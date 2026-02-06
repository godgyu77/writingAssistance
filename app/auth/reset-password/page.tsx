"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // 브라우저 타이틀 설정
  useEffect(() => {
    document.title = "비밀번호 재설정 - StoryArch"
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 비밀번호 확인
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setSuccess(true)
      toast({
        title: "비밀번호 변경 완료",
        description: "새 비밀번호로 로그인하세요."
      })

      // 2초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err: any) {
      console.error('Password update error:', err)
      setError(err.message || '비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>새 비밀번호 설정</CardTitle>
            <CardDescription>
              새로운 비밀번호를 입력하세요
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-900/20 border border-green-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">비밀번호 변경 완료!</h3>
                <p className="text-sm text-zinc-400">
                  로그인 페이지로 이동합니다...
                </p>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                {/* 새 비밀번호 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">새 비밀번호</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type="password"
                      placeholder="최소 6자 이상"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 bg-zinc-950 border-zinc-800"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* 비밀번호 확인 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">비밀번호 확인</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type="password"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

                {/* 변경 버튼 */}
                <Button 
                  type="submit" 
                  className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                  disabled={loading}
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </Button>
              </CardContent>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
