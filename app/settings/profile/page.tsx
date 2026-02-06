"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
// import { Separator } from "@/components/ui/separator" // Not needed
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  ArrowLeft, 
  Moon, 
  Sun, 
  Monitor,
  Upload,
  Loader2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/store/useAuthStore"
import { Profile } from "@/lib/types/database"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 브라우저 타이틀 설정
  useEffect(() => {
    document.title = "프로필 설정 - StoryArch"
  }, [])

  // 프로필 정보
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [themePreference, setThemePreference] = useState<'dark' | 'light' | 'system'>('dark')

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 로딩 상태
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // 프로필이 없으면 기본값 사용
        if (error.code === 'PGRST116' || error.code === 'PGRST204') {
          // 테이블이나 프로필이 없으면 기본값 설정
          setDisplayName(user.email?.split('@')[0] || '')
          setBio('')
          setAvatarUrl(null)
          setThemePreference('dark')
          return
        }
        throw error
      }
      
      // 데이터가 있으면 설정 (컬럼이 없을 수 있으므로 안전하게 접근)
      setProfile(data)
      setDisplayName(data?.display_name || data?.email?.split('@')[0] || '')
      setBio(data?.bio || '')
      setAvatarUrl(data?.avatar_url || null)
      setThemePreference(data?.theme_preference || 'dark')
    } catch (error: any) {
      // 컬럼이 없는 경우 조용히 처리
      if (error?.code === 'PGRST204') {
        setDisplayName(user.email?.split('@')[0] || '')
        return
      }
      console.error('프로필 로드 오류:', error)
    }
  }

  // 프로필 업데이트
  const handleUpdateProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      // 먼저 프로필이 존재하는지 확인
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // 프로필이 없거나 profiles 테이블 구조가 다르면 경고만 표시
      if (!existingProfile) {
        toast({
          title: "알림",
          description: "프로필 테이블이 아직 설정되지 않았습니다. DB 설정을 완료해주세요.",
          variant: "default"
        })
        return
      }

      // 업데이트 시도
      const updateData: any = {}
      
      // 안전하게 업데이트 (컬럼이 있을 때만)
      if (displayName) updateData.display_name = displayName
      if (bio) updateData.bio = bio
      if (themePreference) updateData.theme_preference = themePreference
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      // 컬럼이 없는 오류는 무시
      if (error && error.code !== 'PGRST204') {
        throw error
      }

      toast({
        title: "저장 완료",
        description: error?.code === 'PGRST204' 
          ? "DB 컬럼이 일부 없어 저장되지 않았습니다. fix-database-columns.sql을 실행하세요." 
          : "프로필이 업데이트되었습니다."
      })
    } catch (error: any) {
      console.error('프로필 업데이트 오류:', error)
      toast({
        title: "오류",
        description: "DB 구조를 확인해주세요. fix-database-columns.sql을 실행하세요.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 아바타 업로드
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    setUploading(true)
    try {
      // 기존 아바타 삭제 (선택사항)
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').slice(-2).join('/')
        await supabase.storage.from('avatars').remove([oldPath])
      }

      // 새 아바타 업로드
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // 프로필에 URL 저장
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast({
        title: "업로드 완료",
        description: "프로필 이미지가 변경되었습니다."
      })
    } catch (error: any) {
      console.error('아바타 업로드 오류:', error)
      toast({
        title: "오류",
        description: error.message || "이미지 업로드에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // 비밀번호 변경
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "오류",
        description: "새 비밀번호를 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "오류",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "오류",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive"
      })
      return
    }

    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast({
        title: "변경 완료",
        description: "비밀번호가 변경되었습니다."
      })
      
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('비밀번호 변경 오류:', error)
      toast({
        title: "오류",
        description: error.message || "비밀번호 변경에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name.slice(0, 2).toUpperCase()
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-zinc-950 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">계정 설정</h1>
          <p className="text-zinc-400 mt-2">프로필 정보와 계정 설정을 관리하세요</p>
        </div>

        {/* 프로필 정보 */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>프로필 정보</CardTitle>
            <CardDescription>공개 프로필 정보를 수정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 프로필 이미지 */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(displayName || user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="border-zinc-800"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      이미지 업로드
                    </>
                  )}
                </Button>
                <p className="text-xs text-zinc-500">
                  JPG, PNG 또는 GIF (최대 5MB)
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800" />

            {/* 이메일 (읽기 전용) */}
            <div className="space-y-2">
              <Label>이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  value={user.email || ''}
                  disabled
                  className="pl-10 bg-zinc-950 border-zinc-800"
                />
              </div>
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <Label>닉네임</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  className="pl-10 bg-zinc-950 border-zinc-800"
                />
              </div>
            </div>

            {/* 소개 */}
            <div className="space-y-2">
              <Label>소개</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="자기소개를 입력하세요"
                className="bg-zinc-950 border-zinc-800 min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  프로필 저장
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 테마 설정 */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>테마 설정</CardTitle>
            <CardDescription>화면 테마를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setThemePreference('dark')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  themePreference === 'dark'
                    ? 'border-zinc-100 bg-zinc-800'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Moon className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">다크</p>
              </button>

              <button
                onClick={() => setThemePreference('light')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  themePreference === 'light'
                    ? 'border-zinc-100 bg-zinc-800'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Sun className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">라이트</p>
              </button>

              <button
                onClick={() => setThemePreference('system')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  themePreference === 'system'
                    ? 'border-zinc-100 bg-zinc-800'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Monitor className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">시스템</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 비밀번호 변경 */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
            <CardDescription>새로운 비밀번호를 설정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 새 비밀번호 */}
            <div className="space-y-2">
              <Label>새 비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  className="pl-10 bg-zinc-950 border-zinc-800"
                  minLength={6}
                />
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label>비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="pl-10 bg-zinc-950 border-zinc-800"
                  minLength={6}
                />
              </div>
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              variant="outline"
              className="border-zinc-800"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  변경 중...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  비밀번호 변경
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
