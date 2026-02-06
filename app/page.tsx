"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Mail, Lock, AlertCircle } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const { user, setAuth, clearAuth } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 브라우저 타이틀 설정
  useEffect(() => {
    document.title = "로그인 - StoryArch"
  }, [])

  // 회원가입 모달 상태
  const [signupOpen, setSignupOpen] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [signupError, setSignupError] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  // 비밀번호 재설정 모달 상태
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // 초기 세션 확인 및 복원
  useEffect(() => {
    const checkSession = async () => {
      console.log('[로그인] 초기 세션 확인 시작')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('[로그인] 세션 확인 오류:', error)
        return
      }
      
      console.log('[로그인] 현재 세션:', session ? '있음' : '없음')
      
      if (session?.user) {
        console.log('[로그인] 사용자 ID:', session.user.id)
        console.log('[로그인] 이메일:', session.user.email)
        setAuth(session.user, session)
        router.push('/dashboard')
      }
    }
    
    checkSession()
  }, [supabase, setAuth, router])

  // Supabase Auth 상태 변화 감지
  useEffect(() => {
    console.log('[로그인] Auth 리스너 등록')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[로그인] Auth 이벤트:', event)
        console.log('[로그인] 세션:', session ? '있음' : '없음')
        
        if (session?.user) {
          console.log('[로그인] setAuth 호출, 사용자:', session.user.email)
          setAuth(session.user, session)
        } else {
          console.log('[로그인] clearAuth 호출')
          clearAuth()
        }
      }
    )

    return () => {
      console.log('[로그인] Auth 리스너 정리')
      subscription.unsubscribe()
    }
  }, [supabase, setAuth, clearAuth])

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (signInError) {
        throw signInError
      }

      if (data.user && data.session) {
        setAuth(data.user, data.session)
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 회원가입 처리
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError('')

    // 비밀번호 확인
    if (signupPassword !== signupConfirm) {
      setSignupError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (signupPassword.length < 6) {
      setSignupError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setSignupLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (signUpError) {
        throw signUpError
      }

      setSignupSuccess(true)
      setSignupEmail('')
      setSignupPassword('')
      setSignupConfirm('')
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        setSignupOpen(false)
        setSignupSuccess(false)
      }, 3000)
    } catch (err: any) {
      console.error('Signup error:', err)
      setSignupError(err.message || '회원가입에 실패했습니다.')
    } finally {
      setSignupLoading(false)
    }
  }

  // 소셜 로그인 (OAuth)
  const handleSocialLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) throw error
    } catch (err: any) {
      console.error('Google login error:', err)
      setError(err.message || 'Google 로그인에 실패했습니다.')
    }
  }

  // 비밀번호 재설정 요청
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setResetSuccess(true)
      setResetEmail('')
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        setResetOpen(false)
        setResetSuccess(false)
      }, 3000)
    } catch (err: any) {
      console.error('Password reset error:', err)
      setResetError(err.message || '비밀번호 재설정 요청에 실패했습니다.')
    } finally {
      setResetLoading(false)
    }
  }

  if (user) {
    return null // 리다이렉트 중
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-10 w-10 text-zinc-400" />
          </div>
          <h1 className="text-3xl font-bold">StoryArch</h1>
          <p className="text-lg text-zinc-500 mb-2">스토리아크</p>
          <p className="text-zinc-400">로그인하여 창작을 시작하세요</p>
        </div>

        {/* 로그인 카드 */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>이메일로 로그인하거나 소셜 계정을 사용하세요</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {/* 이메일 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-zinc-950 border-zinc-800"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800 rounded-md text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 로그인 버튼 */}
              <Button 
                type="submit" 
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                disabled={loading}
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>

              {/* 구분선 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900 px-2 text-zinc-500">또는</span>
                </div>
              </div>

              {/* 소셜 로그인 버튼 */}
              <Button
                type="button"
                variant="outline"
                onClick={handleSocialLogin}
                className="w-full border-zinc-800 hover:bg-zinc-800"
                disabled={loading}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 시작하기
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-zinc-500 text-center">
              계정이 없으신가요?{' '}
              <button 
                onClick={() => setSignupOpen(true)}
                className="text-zinc-100 hover:underline"
              >
                회원가입
              </button>
            </div>
            <div className="text-sm text-zinc-500 text-center">
              <button 
                onClick={() => setResetOpen(true)}
                className="text-zinc-400 hover:text-zinc-100 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* 푸터 */}
        <p className="text-center text-sm text-zinc-600">
          © 2026 StoryArch. All rights reserved.
        </p>
      </div>

      {/* 비밀번호 재설정 모달 */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>비밀번호 재설정</DialogTitle>
            <DialogDescription>
              가입하신 이메일 주소를 입력하세요
            </DialogDescription>
          </DialogHeader>

          {resetSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-900/20 border border-green-800 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">이메일을 확인하세요!</h3>
                <p className="text-sm text-zinc-400">
                  비밀번호 재설정 링크를 이메일로 전송했습니다.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset}>
              <div className="space-y-4 py-4">
                {/* 이메일 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">이메일</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                  <p className="text-xs text-zinc-500">
                    비밀번호 재설정 링크를 이메일로 전송합니다
                  </p>
                </div>

                {/* 에러 메시지 */}
                {resetError && (
                  <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800 rounded-md text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setResetOpen(false)}
                  disabled={resetLoading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                >
                  {resetLoading ? '전송 중...' : '재설정 링크 전송'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 회원가입 모달 */}
      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>회원가입</DialogTitle>
            <DialogDescription>
              새 계정을 만들어 시작하세요
            </DialogDescription>
          </DialogHeader>

          {signupSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-900/20 border border-green-800 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">회원가입 완료!</h3>
                <p className="text-sm text-zinc-400">
                  이메일을 확인하여 계정을 활성화해주세요.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="space-y-4 py-4">
                {/* 이메일 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">이메일</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>

                {/* 비밀번호 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">비밀번호</label>
                  <Input
                    type="password"
                    placeholder="최소 6자 이상"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="bg-zinc-950 border-zinc-800"
                    required
                    minLength={6}
                  />
                </div>

                {/* 비밀번호 확인 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">비밀번호 확인</label>
                  <Input
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    className="bg-zinc-950 border-zinc-800"
                    required
                    minLength={6}
                  />
                </div>

                {/* 에러 메시지 */}
                {signupError && (
                  <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800 rounded-md text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{signupError}</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSignupOpen(false)}
                  disabled={signupLoading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={signupLoading}
                  className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                >
                  {signupLoading ? '가입 중...' : '가입하기'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

