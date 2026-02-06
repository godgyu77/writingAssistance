"use client"

import { useState, useEffect, useMemo } from "react"
import { History, Sparkles, FileText, Settings, StickyNote, Zap, BookOpen, Check, X, Copy, Trash2, Clock, Library, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { formatTokenCount, AI_MODELS } from "@/store/useSettingsStore"
import { useEditorStore } from "@/store/useEditorStore"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { AILog, PromptTemplate } from "@/lib/types/database"
import { Input } from "@/components/ui/input"
import { PromptTemplateModal, SaveTemplateModal } from "@/components/PromptTemplateModal"

interface RightSidebarProps {
  projectId: string
  openaiApiKey: string | null
  anthropicApiKey: string | null
  geminiApiKey: string | null
  selectedModel: string
  tokensUsedToday: number
  onOpenApiKeyModal: () => void
  onModelChange: (model: string) => void
  onBeforeAI?: () => void
  onAIResult?: (result: string) => void
}

interface AIHistoryItem extends AILog {
  isSelected?: boolean
}

export function RightSidebarContent({ 
  projectId,
  openaiApiKey,
  anthropicApiKey, 
  geminiApiKey,
  selectedModel,
  tokensUsedToday, 
  onOpenApiKeyModal,
  onModelChange,
  onBeforeAI,
  onAIResult
}: RightSidebarProps) {
  const [aiMode, setAiMode] = useState<string>('continue')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiError, setAiError] = useState('')
  const [notes, setNotes] = useState('')
  const [generateCount, setGenerateCount] = useState(1)
  const [multipleResults, setMultipleResults] = useState<string[]>([])
  
  // 히스토리 관련
  const [aiHistory, setAiHistory] = useState<AIHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // 이번 달 사용량
  const [monthlyTokens, setMonthlyTokens] = useState(0)
  const [monthlyCost, setMonthlyCost] = useState(0)

  // 템플릿 모달
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const { selectedText, content } = useEditorStore()

  const hasAnyKey = openaiApiKey || anthropicApiKey || geminiApiKey

  // 선택된 모델에 따라 적절한 API 키 반환
  const getApiKeyForModel = (model: string): string | null => {
    const modelLower = model.toLowerCase()
    if (modelLower.includes('gpt')) return openaiApiKey
    if (modelLower.includes('claude')) return anthropicApiKey
    if (modelLower.includes('gemini')) return geminiApiKey
    return null
  }

  // 히스토리 로드
  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from('ai_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // ai_logs 테이블이 없으면 무시 (선택적 기능)
        if (error.code === 'PGRST205') {
          setAiHistory([])
          return
        }
        throw error
      }
      setAiHistory(data || [])
    } catch (error) {
      // console.error('히스토리 로드 오류:', error) // 오류 로그 숨김
    } finally {
      setHistoryLoading(false)
    }
  }

  // 이번 달 사용량 계산
  const loadMonthlyUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const { data, error } = await supabase
        .from('ai_logs')
        .select('total_tokens, cost')
        .eq('user_id', user.id)
        .gte('created_at', firstDayOfMonth)

      if (error) {
        // ai_logs 테이블이 없으면 무시 (선택적 기능)
        if (error.code === 'PGRST205') {
          setMonthlyTokens(0)
          setMonthlyCost(0)
          return
        }
        throw error
      }

      const totalTokens = data?.reduce((sum, log) => sum + (log.total_tokens || 0), 0) || 0
      const totalCost = data?.reduce((sum, log) => sum + (Number(log.cost) || 0), 0) || 0

      setMonthlyTokens(totalTokens)
      setMonthlyCost(totalCost)
    } catch (error) {
      // console.error('사용량 계산 오류:', error) // 오류 로그 숨김
    }
  }

  useEffect(() => {
    loadHistory()
    loadMonthlyUsage()
  }, [projectId])

  // API 키가 변경되면 사용 가능한 모델로 자동 선택
  useEffect(() => {
    const currentModelKey = getApiKeyForModel(selectedModel)
    
    // 현재 선택된 모델의 API 키가 없으면 다른 사용 가능한 모델로 변경
    if (!currentModelKey) {
      if (openaiApiKey) {
        onModelChange(AI_MODELS.openai[0].value)
      } else if (anthropicApiKey) {
        onModelChange(AI_MODELS.claude[0].value)
      } else if (geminiApiKey) {
        onModelChange(AI_MODELS.gemini[0].value)
      }
    }
  }, [openaiApiKey, anthropicApiKey, geminiApiKey])

  // 주변 문맥 추출 (선택 영역 앞뒤 200자)
  const getSurroundingText = (selectedText: string, fullContent: string): string => {
    const startIndex = fullContent.indexOf(selectedText)
    if (startIndex === -1) return ''

    const before = fullContent.substring(Math.max(0, startIndex - 200), startIndex)
    const after = fullContent.substring(startIndex + selectedText.length, startIndex + selectedText.length + 200)

    return `[앞 문맥] ${before}\n\n[선택 영역] ${selectedText}\n\n[뒤 문맥] ${after}`
  }

  const handleRunAI = async () => {
    if (!hasAnyKey) {
      onOpenApiKeyModal()
      return
    }

    const apiKey = getApiKeyForModel(selectedModel)
    if (!apiKey) {
      setAiError('선택된 모델에 대한 API 키가 없습니다.')
      return
    }

    if (!aiPrompt.trim()) {
      setAiError('프롬프트를 입력해주세요.')
      return
    }

    // AI 실행 전 버전 저장
    if (onBeforeAI) {
      onBeforeAI()
    }

    setAiLoading(true)
    setAiError('')
    setAiResult('')
    setMultipleResults([])

    try {
      // 다중 버전 생성
      if (generateCount > 1) {
        const promises = Array.from({ length: generateCount }, () => 
          generateSingleVersion(apiKey)
        )
        const results = await Promise.all(promises)
        setMultipleResults(results)
      } else {
        const result = await generateSingleVersion(apiKey)
        setAiResult(result)
      }

      // 히스토리 다시 로드
      loadHistory()
      loadMonthlyUsage()
    } catch (error: any) {
      console.error('AI 실행 오류:', error)
      setAiError(error.message || 'AI 실행 중 오류가 발생했습니다.')
    } finally {
      setAiLoading(false)
    }
  }

  const generateSingleVersion = async (apiKey: string): Promise<string> => {
    const surroundingText = selectedText ? getSurroundingText(selectedText, content) : ''

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: aiPrompt,
        projectId: projectId,
        apiKey: apiKey,
        model: selectedModel,
        mode: aiMode,
        selectedText: selectedText || undefined,
        surroundingText: surroundingText || undefined
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'AI 생성 실패')
    }

    // 스트리밍 응답 처리
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        fullText += chunk
      }
    }

    return fullText
  }

  const handleAdoptResult = (result: string) => {
    if (onAIResult) {
      onAIResult(result)
    }
    setAiResult('')
    setMultipleResults([])
  }

  const handleDeleteHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_logs')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadHistory()
    } catch (error) {
      console.error('히스토리 삭제 오류:', error)
    }
  }

  // 템플릿 선택 핸들러
  const handleSelectTemplate = (template: PromptTemplate) => {
    setAiPrompt(template.content)
    if (template.category) {
      setAiMode(template.category)
    }
  }

  return (
    <>
      {/* 템플릿 모달 */}
      <PromptTemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelect={handleSelectTemplate}
      />

      {/* 템플릿 저장 모달 */}
      <SaveTemplateModal
        isOpen={saveTemplateModalOpen}
        onClose={() => setSaveTemplateModalOpen(false)}
        initialContent={aiPrompt}
        initialMode={aiMode}
      />

      <Tabs defaultValue="ai" className="flex flex-col h-full">
        {/* Tabs Header */}
        <div className="h-14 border-b border-zinc-800 px-2 flex-shrink-0">
        <TabsList className="w-full h-full bg-transparent grid grid-cols-3">
          <TabsTrigger value="ai" className="data-[state=active]:bg-zinc-800">
            <Sparkles className="h-4 w-4 mr-1" />
            AI
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-zinc-800">
            <History className="h-4 w-4 mr-1" />
            히스토리
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-zinc-800">
            <StickyNote className="h-4 w-4 mr-1" />
            메모
          </TabsTrigger>
        </TabsList>
      </div>

      {/* AI 도구 탭 */}
      <TabsContent value="ai" className="flex-1 mt-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* API 키 상태 */}
            <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${hasAnyKey ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-zinc-400">
                  {hasAnyKey ? 'API 연결됨' : 'API 키 없음'}
                </span>
              </div>
              <Button
                variant={hasAnyKey ? "ghost" : "default"}
                size="sm"
                className={hasAnyKey ? "h-7 text-xs" : "h-7 text-xs bg-purple-600 hover:bg-purple-700"}
                onClick={onOpenApiKeyModal}
              >
                <Settings className="h-3 w-3 mr-1" />
                {hasAnyKey ? "관리" : "설정"}
              </Button>
            </div>
            
            {/* API 키 없음 경고 */}
            {!hasAnyKey && (
              <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-800 rounded-md text-sm text-yellow-400">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  AI 기능을 사용하려면 API 키를 설정해주세요. 
                  <button 
                    onClick={onOpenApiKeyModal}
                    className="underline ml-1 hover:text-yellow-300"
                  >
                    지금 설정하기
                  </button>
                </p>
              </div>
            )}

            {/* 이번 달 사용량 표시 */}
            {hasAnyKey && (
              <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-zinc-300">이번 달 사용량</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">토큰:</span>
                  <Badge variant="secondary" className="bg-purple-900/50 text-purple-300">
                    {formatTokenCount(monthlyTokens)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">비용:</span>
                  <Badge variant="secondary" className="bg-purple-900/50 text-purple-300">
                    ${monthlyCost.toFixed(4)}
                  </Badge>
                </div>
              </div>
            )}

            {/* 선택 영역 표시 */}
            {selectedText && (
              <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-400">선택된 텍스트</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedText.length}자
                  </Badge>
                </div>
                <div className="text-xs text-zinc-400 line-clamp-3">
                  {selectedText}
                </div>
              </div>
            )}

            {/* AI 모델 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">AI 모델</label>
              {!hasAnyKey ? (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-400">
                  API 키를 설정하면 사용 가능한 모델이 표시됩니다
                </div>
              ) : (
                <Select value={selectedModel} onValueChange={onModelChange}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="모델을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {/* OpenAI 그룹 - API 키가 있을 때만 표시 */}
                    {openaiApiKey && (
                      <SelectGroup>
                        <SelectLabel className="text-zinc-400">OpenAI</SelectLabel>
                        {AI_MODELS.openai.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}

                    {/* Claude 그룹 - API 키가 있을 때만 표시 */}
                    {anthropicApiKey && (
                      <SelectGroup>
                        <SelectLabel className="text-zinc-400">Claude</SelectLabel>
                        {AI_MODELS.claude.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}

                    {/* Gemini 그룹 - API 키가 있을 때만 표시 */}
                    {geminiApiKey && (
                      <SelectGroup>
                        <SelectLabel className="text-zinc-400">Google Gemini</SelectLabel>
                        {AI_MODELS.gemini.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* AI 작업 모드 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">작업 모드</label>
              <Select value={aiMode} onValueChange={setAiMode}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="continue">✍️ 이어 쓰기</SelectItem>
                  <SelectItem value="improve">✨ 문체 교정</SelectItem>
                  <SelectItem value="describe">🎨 묘사 강화</SelectItem>
                  <SelectItem value="dialogue">💬 대화 개선</SelectItem>
                  <SelectItem value="plot">📖 플롯 제안</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 프롬프트 입력 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">프롬프트</label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTemplateModalOpen(true)}
                    className="h-7 text-xs"
                  >
                    <Library className="h-3 w-3 mr-1" />
                    템플릿 불러오기
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSaveTemplateModalOpen(true)}
                    disabled={!aiPrompt.trim()}
                    className="h-7 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    템플릿 저장
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="AI에게 구체적인 지시사항을 입력하세요..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="bg-zinc-900 border-zinc-800 min-h-[100px] resize-none text-sm"
              />
            </div>

            {/* 생성 버전 수 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">생성 버전 수</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                  className="bg-zinc-900 border-zinc-800"
                />
                <span className="text-xs text-zinc-500 self-center">
                  (1-5개)
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                여러 버전을 생성하여 비교할 수 있습니다
              </p>
            </div>

            {/* AI 실행 버튼 */}
            <Button
              onClick={handleRunAI}
              disabled={!hasAnyKey || aiLoading || !aiPrompt.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {aiLoading ? '처리 중...' : `AI 실행하기 ${generateCount > 1 ? `(${generateCount}개)` : ''}`}
            </Button>

            {/* 에러 메시지 */}
            {aiError && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-md text-sm text-red-400">
                {aiError}
              </div>
            )}

            {/* 단일 결과 */}
            {aiResult && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">AI 생성 결과</label>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(aiResult)}
                        className="h-7 text-xs"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAdoptResult(aiResult)}
                        className="h-7 text-xs text-green-400"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        채택
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-md text-sm max-h-[300px] overflow-y-auto">
                    <p className="whitespace-pre-wrap">{aiResult}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 다중 결과 */}
            {multipleResults.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{multipleResults.length}개 버전 생성됨</label>
                {multipleResults.map((result, index) => (
                  <Card key={index} className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">버전 {index + 1}</Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(result)}
                            className="h-7 text-xs"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdoptResult(result)}
                            className="h-7 text-xs text-green-400"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            채택
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-md text-sm max-h-[200px] overflow-y-auto">
                        <p className="whitespace-pre-wrap">{result}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      {/* 히스토리 탭 */}
      <TabsContent value="history" className="flex-1 mt-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {/* 버전 기록 보기 버튼 */}
            <Button
              variant="outline"
              className="w-full border-zinc-800 hover:bg-zinc-800"
              onClick={() => {
                // 부모 컴포넌트에서 처리
                const event = new CustomEvent('openVersionHistory')
                window.dispatchEvent(event)
              }}
            >
              <Clock className="h-4 w-4 mr-2" />
              버전 기록 보기
            </Button>
            {historyLoading ? (
              <p className="text-sm text-zinc-500 text-center py-8">로딩 중...</p>
            ) : aiHistory.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                아직 히스토리가 없습니다
              </p>
            ) : (
              aiHistory.map((log) => (
                <Card key={log.id} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {log.mode || 'continue'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.model}
                          </Badge>
                          <span className="text-xs text-zinc-500">
                            {log.total_tokens} 토큰
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {log.prompt}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(log.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (log.response && onAIResult) {
                              onAIResult(log.response)
                            }
                          }}
                          className="h-7 text-xs"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHistory(log.id)}
                          className="h-7 text-xs text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {log.response && (
                      <div className="p-2 bg-zinc-800/50 border border-zinc-700 rounded-md text-xs max-h-[150px] overflow-y-auto">
                        <p className="whitespace-pre-wrap line-clamp-6">{log.response}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      {/* 메모장 탭 */}
      <TabsContent value="notes" className="flex-1 mt-0 overflow-hidden flex flex-col">
        <div className="p-4 flex-1 flex flex-col">
          <Textarea
            placeholder="자유롭게 메모하세요..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 bg-zinc-900 border-zinc-800 resize-none"
          />
          <p className="text-xs text-zinc-500 mt-2">
            {notes.length} 글자
          </p>
        </div>
      </TabsContent>
      </Tabs>
    </>
  )
}
