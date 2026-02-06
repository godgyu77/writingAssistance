import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  
  // 액션
  setAuth: (user: User | null, session: Session | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,

      // 인증 정보 설정
      setAuth: (user, session) => {
        console.log('[useAuthStore] setAuth 호출됨')
        console.log('[useAuthStore] user:', user?.email)
        console.log('[useAuthStore] session:', session ? 'exists' : 'null')
        set({ user, session })
        console.log('[useAuthStore] 저장 완료')
      },

      // 인증 정보 제거
      clearAuth: () => {
        console.log('[useAuthStore] clearAuth 호출됨')
        set({ user: null, session: null })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session
      })
    }
  )
)
