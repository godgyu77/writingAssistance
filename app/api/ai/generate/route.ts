import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 요청 타입 정의
interface GenerateRequest {
  prompt: string
  projectId: string
  apiKey: string
  model: string
  mode: 'continue' | 'improve' | 'describe' | 'dialogue' | 'plot'
  selectedText?: string
  surroundingText?: string
  generateCount?: number // 생성할 버전 개수 (기본 1)
}

// 모드별 System Prompt
const MODE_PROMPTS = {
  continue: '자연스럽게 이야기를 이어서 작성해주세요. 앞 문맥과 매끄럽게 연결되도록 해주세요.',
  improve: '다음 텍스트의 문체를 개선해주세요. 더 풍부한 표현과 생동감 있는 묘사를 사용하되, 원래의 의미와 흐름은 유지해주세요.',
  describe: '현재 장면의 배경과 분위기를 더욱 생생하게 묘사해주세요. 독자가 장면을 상상할 수 있도록 구체적인 감각 정보를 포함해주세요.',
  dialogue: '대화를 더욱 자연스럽고 생동감 있게 개선해주세요. 각 캐릭터의 개성이 드러나도록 해주세요.',
  plot: '현재 상황에서 이어질 수 있는 흥미로운 플롯 전개를 제안해주세요. 여러 가능성을 간략히 제시해주세요.'
}

// AI 로그 저장 함수
async function saveAILog(
  supabase: any,
  userId: string,
  projectId: string,
  model: string,
  mode: string,
  prompt: string,
  response: string,
  inputTokens: number,
  outputTokens: number
) {
  const totalTokens = inputTokens + outputTokens

  // 대략적인 비용 계산 (USD)
  let cost = 0
  const modelLower = model.toLowerCase()
  
  if (modelLower.includes('gpt-4')) {
    // GPT-4: input $0.03/1K, output $0.06/1K
    cost = (inputTokens / 1000) * 0.03 + (outputTokens / 1000) * 0.06
  } else if (modelLower.includes('gpt-3.5')) {
    // GPT-3.5: input $0.0015/1K, output $0.002/1K
    cost = (inputTokens / 1000) * 0.0015 + (outputTokens / 1000) * 0.002
  } else if (modelLower.includes('claude')) {
    // Claude: input $0.015/1K, output $0.075/1K (대략)
    cost = (inputTokens / 1000) * 0.015 + (outputTokens / 1000) * 0.075
  } else if (modelLower.includes('gemini')) {
    // Gemini: input $0.00125/1K, output $0.005/1K
    cost = (inputTokens / 1000) * 0.00125 + (outputTokens / 1000) * 0.005
  }

  await supabase.from('ai_logs').insert({
    user_id: userId,
    project_id: projectId,
    model: model,
    mode: mode,
    prompt: prompt,
    response: response,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    cost: cost
  })
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { prompt, projectId, apiKey, model, mode, selectedText, surroundingText, generateCount = 1 } = body

    // 유효성 검사
    if (!prompt || !projectId || !apiKey || !model) {
      return new Response(
        JSON.stringify({ error: '필수 파라미터가 누락되었습니다.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient()

    // 1. 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. 프로젝트 정보 조회
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: '프로젝트를 찾을 수 없습니다.' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 3. 리소스(컨텍스트) 조회 - RAG
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .eq('project_id', projectId)

    if (resourcesError) {
      console.error('리소스 조회 오류:', resourcesError)
    }

    // 4. 컨텍스트 구성
    const contextSections: string[] = []

    // 프로젝트 기본 정보
    contextSections.push(`**작품 제목:** ${project.title}`)
    if (project.genre) {
      contextSections.push(`**장르:** ${project.genre}`)
    }
    if (project.description) {
      contextSections.push(`**줄거리:** ${project.description}`)
    }

    // 리소스별 컨텍스트 추가
    if (resources && resources.length > 0) {
      const categorizedResources = {
        world: resources.filter(r => r.category === 'world'),
        character: resources.filter(r => r.category === 'character'),
        item: resources.filter(r => r.category === 'item'),
        plot: resources.filter(r => r.category === 'plot')
      }

      // 세계관
      if (categorizedResources.world.length > 0) {
        contextSections.push('\n**세계관 설정:**')
        categorizedResources.world.forEach(r => {
          contextSections.push(`- ${r.name}: ${r.ai_summary || r.description || ''}`)
        })
      }

      // 등장인물
      if (categorizedResources.character.length > 0) {
        contextSections.push('\n**등장인물:**')
        categorizedResources.character.forEach(r => {
          contextSections.push(`- ${r.name}: ${r.ai_summary || r.description || ''}`)
        })
      }

      // 아이템
      if (categorizedResources.item.length > 0) {
        contextSections.push('\n**주요 아이템:**')
        categorizedResources.item.forEach(r => {
          contextSections.push(`- ${r.name}: ${r.ai_summary || r.description || ''}`)
        })
      }

      // 플롯
      if (categorizedResources.plot.length > 0) {
        contextSections.push('\n**플롯 노트:**')
        categorizedResources.plot.forEach(r => {
          contextSections.push(`- ${r.name}: ${r.ai_summary || r.description || ''}`)
        })
      }
    }

    // System Prompt 구성
    const contextText = contextSections.join('\n')
    let systemPrompt = `당신은 전문 소설 작가입니다. 다음 작품 설정을 참고하여 집필해주세요.

${contextText}

**작업 지시:**
${MODE_PROMPTS[mode] || MODE_PROMPTS.continue}

**중요 원칙:**
- 위의 설정과 일관성을 유지하세요
- 자연스럽고 흐름이 좋은 문장을 작성하세요
- 한국어로 작성하세요`

    // 선택 영역이 있으면 프롬프트에 추가
    let userPrompt = prompt
    if (selectedText) {
      userPrompt = `**선택된 텍스트:**
\`\`\`
${selectedText}
\`\`\`

${surroundingText ? `**주변 문맥:**
${surroundingText}

` : ''}**사용자 요청:**
${prompt}

위 선택된 텍스트를 사용자 요청에 맞춰 수정하거나 개선해주세요.`
    }

    // 5. 모델별 API 호출 및 스트리밍
    const modelLower = model.toLowerCase()

    // 토큰 추적 변수
    let inputTokens = 0
    let outputTokens = 0
    let fullResponse = ''

    // OpenAI 모델
    if (modelLower.includes('gpt')) {
      const openai = new OpenAI({
        apiKey: apiKey
      })

      const stream = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
        stream_options: { include_usage: true },
        temperature: 0.8,
        max_tokens: 2000
      })

      // OpenAI 스트림을 Response로 변환
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || ''
              if (text) {
                fullResponse += text
                controller.enqueue(encoder.encode(text))
              }

              // 토큰 사용량 정보 추출
              if (chunk.usage) {
                inputTokens = chunk.usage.prompt_tokens || 0
                outputTokens = chunk.usage.completion_tokens || 0
              }
            }

            // AI 로그 저장
            await saveAILog(
              supabase,
              user.id,
              projectId,
              model,
              mode,
              userPrompt,
              fullResponse,
              inputTokens,
              outputTokens
            )

            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'X-Input-Tokens': inputTokens.toString(),
          'X-Output-Tokens': outputTokens.toString()
        }
      })
    }

    // Claude 모델
    if (modelLower.includes('claude')) {
      const anthropic = new Anthropic({
        apiKey: apiKey
      })

      const stream = await anthropic.messages.stream({
        model: model,
        max_tokens: 2000,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })

      // Claude 스트림을 Response로 변환
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && 
                  chunk.delta.type === 'text_delta') {
                const text = chunk.delta.text
                fullResponse += text
                controller.enqueue(encoder.encode(text))
              }
            }

            // 최종 메시지에서 토큰 정보 추출
            const finalMessage = await stream.finalMessage()
            inputTokens = finalMessage.usage?.input_tokens || 0
            outputTokens = finalMessage.usage?.output_tokens || 0

            // AI 로그 저장
            await saveAILog(
              supabase,
              user.id,
              projectId,
              model,
              mode,
              userPrompt,
              fullResponse,
              inputTokens,
              outputTokens
            )

            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'X-Input-Tokens': inputTokens.toString(),
          'X-Output-Tokens': outputTokens.toString()
        }
      })
    }

    // Gemini 모델
    if (modelLower.includes('gemini')) {
      const genAI = new GoogleGenerativeAI(apiKey)
      const geminiModel = genAI.getGenerativeModel({ model: model })

      const fullPrompt = `${systemPrompt}\n\n사용자 요청: ${userPrompt}`

      const result = await geminiModel.generateContentStream(fullPrompt)

      // Gemini 스트림을 Response로 변환
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text()
              fullResponse += text
              controller.enqueue(encoder.encode(text))
            }

            // 최종 응답에서 토큰 정보 추출 (Gemini는 usageMetadata 제공)
            const finalResult = await result.response
            const usage = await finalResult.usageMetadata
            inputTokens = usage?.promptTokenCount || 0
            outputTokens = usage?.candidatesTokenCount || 0

            // AI 로그 저장
            await saveAILog(
              supabase,
              user.id,
              projectId,
              model,
              mode,
              userPrompt,
              fullResponse,
              inputTokens,
              outputTokens
            )

            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'X-Input-Tokens': inputTokens.toString(),
          'X-Output-Tokens': outputTokens.toString()
        }
      })
    }

    // 지원하지 않는 모델
    return new Response(
      JSON.stringify({ error: '지원하지 않는 모델입니다.' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('AI 생성 오류:', error)

    // API 키 오류
    if (error.status === 401 || error.message?.includes('API key')) {
      return new Response(
        JSON.stringify({ error: 'API 키가 유효하지 않습니다.' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 할당량 초과
    if (error.status === 429 || error.message?.includes('quota')) {
      return new Response(
        JSON.stringify({ error: 'API 할당량이 초과되었습니다.' }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 일반 오류
    return new Response(
      JSON.stringify({ error: error.message || 'AI 생성 중 오류가 발생했습니다.' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
