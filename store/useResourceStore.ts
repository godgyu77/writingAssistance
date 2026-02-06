import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Resource,
  mockWorldResources,
  mockCharacterResources,
  mockItemResources,
  mockPlotResources
} from '@/lib/resourceData'

interface ResourceState {
  resources: Resource[]
  
  // 액션
  addResource: (resource: Resource) => void
  updateResource: (id: string, resource: Partial<Resource>) => void
  deleteResource: (id: string) => void
  loadMockData: () => void
  clearAll: () => void
  getResourcesByType: (type: Resource['type']) => Resource[]
}

export const useResourceStore = create<ResourceState>()(
  persist(
    (set, get) => ({
      resources: [],

      // 리소스 추가
      addResource: (resource) => {
        set((state) => ({
          resources: [...state.resources, resource]
        }))
      },

      // 리소스 업데이트
      updateResource: (id, updates) => {
        set((state) => ({
          resources: state.resources.map((resource) =>
            resource.id === id ? { ...resource, ...updates } : resource
          )
        }))
      },

      // 리소스 삭제
      deleteResource: (id) => {
        set((state) => ({
          resources: state.resources.filter((resource) => resource.id !== id)
        }))
      },

      // 목업 데이터 로드
      loadMockData: () => {
        set({
          resources: [
            ...mockWorldResources,
            ...mockCharacterResources,
            ...mockItemResources,
            ...mockPlotResources
          ]
        })
      },

      // 모두 삭제
      clearAll: () => {
        set({ resources: [] })
      },

      // 타입별 리소스 가져오기
      getResourcesByType: (type) => {
        return get().resources.filter((r) => r.type === type)
      }
    }),
    {
      name: 'resource-storage'
    }
  )
)
