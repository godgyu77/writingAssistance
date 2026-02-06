"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Plus, BookOpen, LogOut, RefreshCw } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { createClient } from "@/lib/supabase/client"
import { NewProjectModal } from "@/components/NewProjectModal"
import { Project } from "@/lib/types/database"

export default function DashboardPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { user, setAuth, clearAuth } = useAuthStore()
  const [displayName, setDisplayName] = useState<string>('')

  // 브라우저 타이틀 설정
  useEffect(() => {
    document.title = "대시보드 - StoryArch"
  }, [])

  // 프로필에서 닉네임 불러오기
  useEffect(() => {
    const loadDisplayName = async () => {
      if (!user) return
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()
        
        // display_name이 있으면 사용, 없으면 이메일 ID 사용
        setDisplayName(data?.display_name || user.email?.split('@')[0] || '사용자')
      } catch {
        // 프로필이 없거나 오류 시 이메일 ID 사용
        setDisplayName(user.email?.split('@')[0] || '사용자')
      }
    }
    
    loadDisplayName()
  }, [user, supabase])
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newProjectOpen, setNewProjectOpen] = useState(false)

  // 초기 세션 확인 및 Zustand 동기화
  useEffect(() => {
    const checkSession = async () => {
      console.log('[대시보드] 초기 세션 확인')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        console.log('[대시보드] 세션 없음, 로그인 페이지로 이동')
        router.push('/')
        return
      }
      
      console.log('[대시보드] 세션 있음, 사용자:', session.user.email)
      console.log('[대시보드] 현재 Zustand user:', user ? user.email : 'null')
      
      // Zustand에 user가 없으면 저장
      if (!user) {
        console.log('[대시보드] Zustand에 세션 저장 시작')
        setAuth(session.user, session)
        console.log('[대시보드] Zustand에 세션 저장 완료')
      } else {
        console.log('[대시보드] Zustand에 이미 user 존재, 저장 생략')
      }
    }
    
    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 프로젝트 목록 불러오기
  const fetchProjects = async () => {
    if (!user) {
      console.log('[대시보드] fetchProjects: user 없음')
      return
    }

    console.log('[대시보드] 프로젝트 불러오기 시작, user.id:', user.id)
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[대시보드] 프로젝트 불러오기 에러:', error)
        throw error
      }

      console.log('[대시보드] 불러온 프로젝트 수:', data?.length || 0)
      setProjects(data || [])
    } catch (err) {
      console.error('[대시보드] 프로젝트 불러오기 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    router.push('/')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return '오늘'
    if (diffInDays === 1) return '어제'
    if (diffInDays < 7) return `${diffInDays}일 전`
    
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // 로딩 중일 때도 화면 표시
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-400">로그인 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* 새 작품 모달 */}
      <NewProjectModal
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        onSuccess={fetchProjects}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-zinc-400" />
            <h1 className="text-xl font-semibold">내 작품</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 새로고침 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchProjects}
              disabled={loading}
              className="text-zinc-400 hover:text-zinc-100"
              title="새로고침"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-zinc-400 hover:text-zinc-100"
              onClick={handleLogout}
              title="로그아웃"
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-zinc-400 hover:text-zinc-100"
              onClick={() => router.push('/settings/profile')}
              title="설정"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Avatar className="h-9 w-9 border-2 border-zinc-800">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">대시보드</h2>
          <p className="text-zinc-400">
            안녕하세요, {displayName}님! 작품을 선택하거나 새로운 이야기를 시작하세요
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
              <BookOpen className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">작품이 없습니다</h3>
            <p className="text-zinc-400 mb-8 text-center max-w-md">
              새로운 작품을 만들어 창작을 시작하세요
            </p>
            <Button 
              onClick={() => setNewProjectOpen(true)}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 작품 만들기
            </Button>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* New Project Card */}
            <Card 
              onClick={() => setNewProjectOpen(true)}
              className="border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900 transition-all duration-300 hover:shadow-lg hover:shadow-zinc-900/50 hover:-translate-y-1 cursor-pointer group"
            >
              <CardContent className="flex flex-col items-center justify-center h-[400px] p-6">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-zinc-700 transition-colors">
                  <Plus className="h-8 w-8 text-zinc-400 group-hover:text-zinc-200" />
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-zinc-100 transition-colors">
                  새 작품 만들기
                </h3>
                <p className="text-sm text-zinc-500 text-center">
                  새로운 이야기를 시작해보세요
                </p>
              </CardContent>
            </Card>

            {/* Project Cards */}
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} formatDate={formatDate} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ProjectCard({ project, formatDate }: { project: Project; formatDate: (date: string) => string }) {
  return (
    <Link href={`/studio/${project.id}`}>
      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden hover:shadow-xl hover:shadow-zinc-900/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
        <CardHeader className="p-0">
          {/* Cover Image */}
          <div className="relative w-full h-48 bg-zinc-800 overflow-hidden">
            {project.cover_image_url ? (
              <img
                src={project.cover_image_url}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-zinc-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {/* Title & Genre */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-zinc-100 transition-colors">
              {project.title}
            </h3>
            {project.genre && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                {project.genre}
              </Badge>
            )}
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-xs text-zinc-500 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-xs border-zinc-700 text-zinc-400"
                >
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 3 && (
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                  +{project.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>마지막 접근:</span>
            <span className="text-zinc-400">
              {project.last_accessed_at ? formatDate(project.last_accessed_at) : formatDate(project.created_at)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

