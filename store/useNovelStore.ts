import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Novel, mockNovels } from '@/lib/mockData'

interface NovelState {
  novels: Novel[]
  
  // 액션
  addNovel: (novel: Novel) => void
  updateNovel: (id: string, novel: Partial<Novel>) => void
  deleteNovel: (id: string) => void
  loadMockData: () => void
  clearAll: () => void
}

export const useNovelStore = create<NovelState>()(
  persist(
    (set) => ({
      novels: [],

      // 소설 추가
      addNovel: (novel) => {
        set((state) => ({
          novels: [...state.novels, novel]
        }))
      },

      // 소설 업데이트
      updateNovel: (id, updates) => {
        set((state) => ({
          novels: state.novels.map((novel) =>
            novel.id === id ? { ...novel, ...updates } : novel
          )
        }))
      },

      // 소설 삭제
      deleteNovel: (id) => {
        set((state) => ({
          novels: state.novels.filter((novel) => novel.id !== id)
        }))
      },

      // 목업 데이터 로드
      loadMockData: () => {
        set({ novels: mockNovels })
      },

      // 모두 삭제
      clearAll: () => {
        set({ novels: [] })
      }
    }),
    {
      name: 'novel-storage'
    }
  )
)
