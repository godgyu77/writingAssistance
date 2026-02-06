import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  // API 키들
  openaiApiKey: string | null
  anthropicApiKey: string | null
  geminiApiKey: string | null
  
  // 선택된 모델
  selectedModel: string
  
  // 사용량 추적
  tokensUsedToday: number
  lastResetDate: string
  
  // 설정
  autoSave: boolean
  autoSaveInterval: number // 초 단위
  
  // 액션
  setOpenAIKey: (key: string) => void
  setAnthropicKey: (key: string) => void
  setGeminiKey: (key: string) => void
  setSelectedModel: (model: string) => void
  incrementTokenUsage: (tokens: number) => void
  resetDailyTokens: () => void
  checkAndResetTokens: () => void
  clearAllKeys: () => void
  setAutoSave: (enabled: boolean) => void
  setAutoSaveInterval: (seconds: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      openaiApiKey: null,
      anthropicApiKey: null,
      geminiApiKey: null,
      selectedModel: 'gpt-4o-mini',
      tokensUsedToday: 0,
      lastResetDate: new Date().toDateString(),
      autoSave: true,
      autoSaveInterval: 30,

      // API 키 설정
      setOpenAIKey: (key: string) => {
        set({ openaiApiKey: key })
      },

      setAnthropicKey: (key: string) => {
        set({ anthropicApiKey: key })
      },

      setGeminiKey: (key: string) => {
        set({ geminiApiKey: key })
      },

      // 모델 선택
      setSelectedModel: (model: string) => {
        set({ selectedModel: model })
      },

      // 토큰 사용량 증가
      incrementTokenUsage: (tokens: number) => {
        const state = get()
        state.checkAndResetTokens()
        set({ tokensUsedToday: state.tokensUsedToday + tokens })
      },

      // 일일 토큰 초기화
      resetDailyTokens: () => {
        set({
          tokensUsedToday: 0,
          lastResetDate: new Date().toDateString()
        })
      },

      // 날짜 체크 및 토큰 초기화
      checkAndResetTokens: () => {
        const state = get()
        const today = new Date().toDateString()
        
        if (state.lastResetDate !== today) {
          state.resetDailyTokens()
        }
      },

      // 모든 API 키 삭제
      clearAllKeys: () => {
        set({ 
          openaiApiKey: null,
          anthropicApiKey: null,
          geminiApiKey: null
        })
      },

      // 자동 저장 설정
      setAutoSave: (enabled: boolean) => {
        set({ autoSave: enabled })
      },

      // 자동 저장 주기 설정
      setAutoSaveInterval: (seconds: number) => {
        set({ autoSaveInterval: seconds })
      }
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        openaiApiKey: state.openaiApiKey,
        anthropicApiKey: state.anthropicApiKey,
        geminiApiKey: state.geminiApiKey,
        selectedModel: state.selectedModel,
        tokensUsedToday: state.tokensUsedToday,
        lastResetDate: state.lastResetDate,
        autoSave: state.autoSave,
        autoSaveInterval: state.autoSaveInterval
      })
    }
  )
)

// API 키 유효성 검사
export const validateApiKey = (key: string, provider: 'openai' | 'anthropic' | 'gemini'): boolean => {
  if (!key || key.trim().length === 0) return false
  
  switch (provider) {
    case 'openai':
      return key.startsWith('sk-') && key.length > 20
    case 'anthropic':
      return key.startsWith('sk-ant-') && key.length > 20
    case 'gemini':
      return key.length > 10 // Gemini 키 형식
    default:
      return false
  }
}

// 토큰을 포맷팅하는 유틸리티
export const formatTokenCount = (tokens: number): string => {
  if (tokens < 1000) return tokens.toString()
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`
  return `${(tokens / 1000000).toFixed(2)}M`
}

// 모델 목록
export const AI_MODELS = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-5', label: 'GPT-5' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini' }
  ],
  claude: [
    { value: 'claude-opus-4.5', label: 'Claude Opus 4.5' },
    { value: 'claude-sonnet-4.5', label: 'Claude Sonnet 4.5' }
  ],
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }
  ]
}

