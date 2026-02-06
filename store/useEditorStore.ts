import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface EditorState {
  // 에디터 상태
  title: string
  content: string
  isFocusMode: boolean
  
  // 선택 영역
  selectedText: string
  selectionStart: number
  selectionEnd: number
  
  // 통계
  wordCount: number
  characterCount: number
  paragraphCount: number
  
  // 메타 정보
  lastSaved: Date | null
  isAutoSaving: boolean
  
  // 액션
  setTitle: (title: string) => void
  setContent: (content: string) => void
  setSelection: (text: string, start: number, end: number) => void
  toggleFocusMode: () => void
  updateStatistics: () => void
  saveContent: () => Promise<void>
  resetEditor: () => void
}

// 통계 계산 함수
const calculateStatistics = (content: string) => {
  // 글자 수 (공백 포함)
  const characterCount = content.length
  
  // 단어 수 (공백 기준)
  const wordCount = content.trim() === '' 
    ? 0 
    : content.trim().split(/\s+/).length
  
  // 문단 수 (빈 줄로 구분)
  const paragraphCount = content.trim() === ''
    ? 0
    : content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
  
  return { characterCount, wordCount, paragraphCount }
}

export const useEditorStore = create<EditorState>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        title: '',
        content: '',
        isFocusMode: false,
        selectedText: '',
        selectionStart: 0,
        selectionEnd: 0,
        wordCount: 0,
        characterCount: 0,
        paragraphCount: 0,
        lastSaved: null,
        isAutoSaving: false,

        // 제목 설정
        setTitle: (title: string) => {
          set({ title })
        },

        // 본문 설정 및 통계 자동 업데이트
        setContent: (content: string) => {
          const stats = calculateStatistics(content)
          set({
            content,
            ...stats
          })
        },

        // 선택 영역 설정
        setSelection: (text: string, start: number, end: number) => {
          set({
            selectedText: text,
            selectionStart: start,
            selectionEnd: end
          })
        },

        // 포커스 모드 토글
        toggleFocusMode: () => {
          set((state) => ({
            isFocusMode: !state.isFocusMode
          }))
        },

        // 통계 수동 업데이트
        updateStatistics: () => {
          const { content } = get()
          const stats = calculateStatistics(content)
          set(stats)
        },

        // 저장 (시뮬레이션)
        saveContent: async () => {
          set({ isAutoSaving: true })
          
          // 실제로는 API 호출
          await new Promise(resolve => setTimeout(resolve, 500))
          
          set({
            isAutoSaving: false,
            lastSaved: new Date()
          })
        },

        // 에디터 초기화
        resetEditor: () => {
          set({
            title: '',
            content: '',
            isFocusMode: false,
            selectedText: '',
            selectionStart: 0,
            selectionEnd: 0,
            wordCount: 0,
            characterCount: 0,
            paragraphCount: 0,
            lastSaved: null,
            isAutoSaving: false
          })
        }
      }),
      {
        name: 'editor-storage',
        partialize: (state) => ({
          title: state.title,
          content: state.content,
          isFocusMode: state.isFocusMode
        })
      }
    ),
    { name: 'EditorStore' }
  )
)

// 자동 저장 훅
export const useAutoSave = (interval: number = 30000) => {
  const saveContent = useEditorStore((state) => state.saveContent)
  const content = useEditorStore((state) => state.content)
  const title = useEditorStore((state) => state.title)
  
  // 실제 구현에서는 useEffect로 자동 저장 로직 구현
  return { saveContent }
}
