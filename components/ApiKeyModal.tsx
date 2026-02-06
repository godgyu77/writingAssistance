"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Key, AlertCircle, CheckCircle2 } from "lucide-react"
import { useSettingsStore, validateApiKey } from "@/store/useSettingsStore"

interface ApiKeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  required?: boolean
}

export function ApiKeyModal({ open, onOpenChange, required = false }: ApiKeyModalProps) {
  const { 
    openaiApiKey, 
    anthropicApiKey, 
    geminiApiKey,
    setOpenAIKey,
    setAnthropicKey,
    setGeminiKey
  } = useSettingsStore()
  
  const [openaiInput, setOpenaiInput] = useState(openaiApiKey || '')
  const [anthropicInput, setAnthropicInput] = useState(anthropicApiKey || '')
  const [geminiInput, setGeminiInput] = useState(geminiApiKey || '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setOpenaiInput(openaiApiKey || '')
    setAnthropicInput(anthropicApiKey || '')
    setGeminiInput(geminiApiKey || '')
  }, [openaiApiKey, anthropicApiKey, geminiApiKey])

  const handleSubmit = () => {
    // 입력된 키만 검증 (빈 값 허용)
    if (openaiInput.trim() && !validateApiKey(openaiInput, 'openai')) {
      setError('올바른 OpenAI API 키 형식이 아닙니다')
      return
    }

    if (anthropicInput.trim() && !validateApiKey(anthropicInput, 'anthropic')) {
      setError('올바른 Anthropic API 키 형식이 아닙니다')
      return
    }

    if (geminiInput.trim() && !validateApiKey(geminiInput, 'gemini')) {
      setError('올바른 Google Gemini API 키 형식이 아닙니다')
      return
    }

    // 저장 (빈 값도 저장하여 키 제거 가능)
    setOpenAIKey(openaiInput)
    setAnthropicKey(anthropicInput)
    setGeminiKey(geminiInput)

    setError(null)
    onOpenChange(false)
  }

  const handleCancel = () => {
    // required가 아니므로 언제든 취소 가능
    setError(null)
    setOpenaiInput(openaiApiKey || '')
    setAnthropicInput(anthropicApiKey || '')
    setGeminiInput(geminiApiKey || '')
    onOpenChange(false)
  }

  const isOpenAIValid = validateApiKey(openaiInput, 'openai')
  const isAnthropicValid = validateApiKey(anthropicInput, 'anthropic')
  const isGeminiValid = validateApiKey(geminiInput, 'gemini')
  const hasAnyKey = openaiApiKey || anthropicApiKey || geminiApiKey

  return (
    <Dialog open={open} onOpenChange={required && !hasAnyKey ? undefined : onOpenChange}>
      <DialogContent 
        className="sm:max-w-[600px] bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          if (required && !hasAnyKey) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (required && !hasAnyKey) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-400" />
            <span>API 키 설정</span>
            {required && (
              <Badge variant="destructive" className="ml-2">
                필수
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            사용하실 AI 제공자의 API 키를 입력하세요. 최소 하나 이상 필요합니다.
          </DialogDescription>
          {!hasAnyKey && (
            <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-800 rounded-md text-sm text-yellow-400 mt-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>API 키가 설정되지 않으면 AI 기능을 사용할 수 없습니다.</span>
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="openai" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="gemini">Google</TabsTrigger>
          </TabsList>

          {/* OpenAI 탭 */}
          <TabsContent value="openai" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenAI API 키</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={openaiInput}
                  onChange={(e) => {
                    setOpenaiInput(e.target.value)
                    setError(null)
                  }}
                  className="bg-zinc-950 border-zinc-800 pr-10"
                />
                {openaiInput && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isOpenAIValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <p>
                  OpenAI API 키는 &apos;sk-&apos;로 시작합니다.{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-purple-400 hover:underline"
                  >
                    API 키 발급받기
                  </a>
                </p>
              </div>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-md text-xs text-zinc-400">
              <p className="font-medium mb-1">사용 가능 모델:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>GPT-4o Mini</li>
                <li>GPT-5</li>
                <li>GPT-5 Mini</li>
              </ul>
            </div>
          </TabsContent>

          {/* Anthropic 탭 */}
          <TabsContent value="anthropic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Anthropic API 키</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={anthropicInput}
                  onChange={(e) => {
                    setAnthropicInput(e.target.value)
                    setError(null)
                  }}
                  className="bg-zinc-950 border-zinc-800 pr-10"
                />
                {anthropicInput && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isAnthropicValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <p>
                  Anthropic API 키는 &apos;sk-ant-&apos;로 시작합니다.{' '}
                  <a 
                    href="https://console.anthropic.com/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-purple-400 hover:underline"
                  >
                    API 키 발급받기
                  </a>
                </p>
              </div>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-md text-xs text-zinc-400">
              <p className="font-medium mb-1">사용 가능 모델:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Claude Opus 4.5</li>
                <li>Claude Sonnet 4.5</li>
              </ul>
            </div>
          </TabsContent>

          {/* Google Gemini 탭 */}
          <TabsContent value="gemini" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Google Gemini API 키</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="AIza..."
                  value={geminiInput}
                  onChange={(e) => {
                    setGeminiInput(e.target.value)
                    setError(null)
                  }}
                  className="bg-zinc-950 border-zinc-800 pr-10"
                />
                {geminiInput && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isGeminiValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <p>
                  Google Gemini API 키를 입력하세요.{' '}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-purple-400 hover:underline"
                  >
                    API 키 발급받기
                  </a>
                </p>
              </div>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-md text-xs text-zinc-400">
              <p className="font-medium mb-1">사용 가능 모델:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Gemini 2.5 Flash</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* 에러 메시지 */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-md text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="flex items-start gap-2 p-3 bg-zinc-800/50 rounded-md text-xs text-zinc-400">
          <Key className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            API 키는 브라우저의 로컬 스토리지에 안전하게 저장되며, 서버로 전송되지 않습니다.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
          >
            {hasAnyKey ? '취소' : '나중에'}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {hasAnyKey ? '업데이트' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
