"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { BookOpen, Sparkles, Eye, EyeOff, Menu, AlertCircle, CheckCircle2, Loader2, WifiOff, Clock, ArrowLeft } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { useToast } from "@/hooks/use-toast"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useEditorStore } from "@/store/useEditorStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useAuthStore } from "@/store/useAuthStore"
import { ResourceModal, type ResourceFormData } from "@/components/ResourceModal"
import { ApiKeyModal } from "@/components/ApiKeyModal"
import { VersionHistoryModal } from "@/components/VersionHistoryModal"
import { Resource, Version } from "@/lib/types/database"
import { LeftSidebarContent } from "@/components/LeftSidebar"
import { RightSidebarContent } from "@/components/RightSidebar"
import { createClient } from "@/lib/supabase/client"
import { 
  saveLocalChapter, 
  getLocalChapter, 
  saveDraft, 
  getDraft 
} from "@/lib/db/localDB"
import { syncToSupabase, syncFromSupabase, autoSync } from "@/lib/sync/syncManager"

export default function StudioPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const supabase = useMemo(() => createClient(), [])

  // 인증 체크
  const { user } = useAuthStore()

  // Zustand 스토어
  const {
    title,
    content,
    isFocusMode,
    wordCount,
    characterCount,
    paragraphCount,
    setTitle,
    setContent,
    setSelection,
    toggleFocusMode
  } = useEditorStore()

  // Settings 스토어
  const { 
    openaiApiKey,
    anthropicApiKey,
    geminiApiKey,
    selectedModel,
    tokensUsedToday,
    checkAndResetTokens,
    setSelectedModel
  } = useSettingsStore()

  // 리소스 모달 상태
  const [resourceModalOpen, setResourceModalOpen] = useState(false)
  const [selectedResourceCategory, setSelectedResourceCategory] = useState<string>('world')

  // API 키 모달 상태
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)

  // 모바일 드로어 상태
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false)
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)

  // 자동 저장 상태
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'typing' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // 버전 관리
  const [versionModalOpen, setVersionModalOpen] = useState(false)

  // 챕터 목록 갱신 트리거 (새 챕터 추가 시 LeftSidebar가 다시 불러오도록)
  const [chaptersVersion, setChaptersVersion] = useState(0)

  // 오프라인 상태
  const isOnline = useOnlineStatus()
  const [showOfflineToast, setShowOfflineToast] = useState(false)

  // Toast
  const { toast } = useToast()
  const debouncedContent = useDebounce(content, 3000)
  const debouncedTitle = useDebounce(title, 3000)

  // 인증 체크 (클라이언트 사이드)
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // 프로젝트 소유자 확인 (다른 사용자 작품 URL 직접 접근 시 대시보드로)
  useEffect(() => {
    const checkProjectAccess = async () => {
      if (!user || !projectId) return
      const { data: project, error } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .single()
      // RLS로 본인 프로젝트만 조회됨 → 없거나 에러면 타인 프로젝트이거나 삭제됨
      if (error || !project) {
        router.replace('/dashboard')
      }
    }
    checkProjectAccess()
  }, [user, projectId, supabase, router])

  // API 키 체크 (일일 토큰만 리셋, 강제 모달 제거)
  useEffect(() => {
    checkAndResetTokens()
  }, [checkAndResetTokens])

  // 브라우저 타이틀 설정
  useEffect(() => {
    if (title) {
      document.title = `${title} - StoryArch`
    } else {
      document.title = "에디터 - StoryArch"
    }
  }, [title])

  // 오프라인 상태 감지
  useEffect(() => {
    if (!isOnline && !showOfflineToast) {
      setShowOfflineToast(true)
      toast({
        title: "오프라인 모드",
        description: "인터넷 연결이 끊어졌습니다. 로컬에 자동 저장됩니다.",
        variant: "destructive"
      })
    } else if (isOnline && showOfflineToast) {
      setShowOfflineToast(false)
      toast({
        title: "온라인 복구",
        description: "인터넷에 다시 연결되었습니다. 동기화 중..."
      })
      // 자동 동기화
      autoSync().then(() => {
        toast({
          title: "동기화 완료",
          description: "로컬 데이터가 서버와 동기화되었습니다."
        })
      })
    }
  }, [isOnline, showOfflineToast, toast])

  // 버전 기록 모달 열기 이벤트 리스너
  useEffect(() => {
    const handleOpenVersionHistory = () => {
      setVersionModalOpen(true)
    }

    window.addEventListener('openVersionHistory', handleOpenVersionHistory)
    return () => {
      window.removeEventListener('openVersionHistory', handleOpenVersionHistory)
    }
  }, [])

  // 실시간 로컬 백업 (타이핑할 때마다)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToLocal()
    }, 1000) // 1초 debounce

    return () => clearTimeout(timer)
  }, [title, content, currentChapterId])

  // 챕터 추가 핸들러
  const handleAddChapter = async () => {
    if (!user) return

    try {
      // 현재 챕터 수 가져오기
      const { count } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      const nextOrderIndex = (count || 0) + 1

      const { data: newChapter, error } = await supabase
        .from('chapters')
        .insert({
          project_id: projectId,
          title: `${nextOrderIndex}화: 제목 없음`,
          content: '',
          order_index: nextOrderIndex,
          status: 'draft',
          memo: null
        })
        .select()
        .single()

      if (error) throw error

      if (newChapter) {
        setCurrentChapterId(newChapter.id)
        setTitle(newChapter.title ?? '')
        setContent(newChapter.content ?? '')
        setLastSavedAt(newChapter.updated_at ? new Date(newChapter.updated_at) : null)
        setSaveStatus('saved')
        setChaptersVersion((v) => v + 1)
        toast({
          title: '챕터 추가됨',
          description: '새 챕터가 생성되었습니다.'
        })
      }
    } catch (err) {
      console.error('챕터 추가 오류:', err)
      toast({
        title: '챕터 추가 실패',
        description: err instanceof Error ? err.message : '챕터를 추가하지 못했습니다.',
        variant: 'destructive'
      })
    }
  }

  // 챕터 선택 시 해당 챕터 로드
  const loadChapterById = async (chapterId: string) => {
    if (chapterId === currentChapterId) return

    try {
      // 현재 챕터 자동 저장 (디바운스된 값이 이미 반영되어 있을 수 있음)
      if (currentChapterId && title !== undefined && content !== undefined) {
        await supabase
          .from('chapters')
          .update({
            title,
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentChapterId)
      }

      const { data: chapter, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single()

      if (error) throw error
      if (!chapter) return

      setCurrentChapterId(chapter.id)
      setTitle(chapter.title ?? '')
      setContent(chapter.content ?? '')
      setLastSavedAt(chapter.updated_at ? new Date(chapter.updated_at) : null)
      setSaveStatus('saved')
    } catch (err) {
      console.error('챕터 로드 오류:', err)
      toast({
        title: '챕터 로드 실패',
        description: '챕터를 불러오지 못했습니다.',
        variant: 'destructive'
      })
    }
  }

  // 버전 저장 함수
  const saveVersion = async (snapshotType: 'manual' | 'auto' | 'pre_ai' | 'backup') => {
    if (!currentChapterId || !title || !content) return

    try {
      const { error } = await supabase
        .from('versions')
        .insert({
          chapter_id: currentChapterId,
          project_id: projectId,
          title: title,
          content: content,
          word_count: wordCount,
          snapshot_type: snapshotType
        })

      if (error) throw error

      if (snapshotType === 'manual') {
        toast({
          title: "버전 저장 완료",
          description: "현재 버전이 저장되었습니다."
        })
      }
    } catch (error) {
      console.error('버전 저장 오류:', error)
      if (snapshotType === 'manual') {
        toast({
          title: "버전 저장 실패",
          description: "버전을 저장하지 못했습니다.",
          variant: "destructive"
        })
      }
    }
  }

  // 버전 복원
  const handleRestoreVersion = (version: Version) => {
    setTitle(version.title)
    setContent(version.content)
    toast({
      title: "복원 완료",
      description: "선택한 버전으로 복원되었습니다."
    })
  }

  // 로컬 백업 (실시간)
  const saveToLocal = async () => {
    if (!currentChapterId) return

    try {
      // Draft 저장 (실시간 백업)
      await saveDraft(currentChapterId, title, content)

      // 로컬 챕터 저장
      await saveLocalChapter({
        id: currentChapterId,
        projectId: projectId,
        title: title,
        content: content,
        wordCount: wordCount,
        lastModified: Date.now(),
        needsSync: !isOnline // 오프라인이면 동기화 필요 플래그
      })
    } catch (error) {
      console.error('로컬 저장 오류:', error)
    }
  }

  // 리소스 추가 핸들러
  const handleAddResource = (category: string) => {
    setSelectedResourceCategory(category)
    setResourceModalOpen(true)
  }

  const handleResourceSubmit = async (data: ResourceFormData) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('resources')
        .insert({
          project_id: projectId,
          category: selectedResourceCategory,
          name: data.name,
          description: data.description || null,
          ai_summary: data.aiSummary || null,
          tags: data.tags || [],
          image_url: null
        })

      if (error) throw error

      console.log('리소스 추가 성공')
    } catch (err) {
      console.error('리소스 추가 오류:', err)
    }
  }

  // 챕터 로드
  useEffect(() => {
    const loadChapter = async () => {
      if (!user) return

      try {
        // 오프라인일 경우 로컬 데이터 먼저 확인
        if (!isOnline) {
          const localChapters = await getLocalChapter('temp') // 임시로 하나만 로드
          if (localChapters) {
            setCurrentChapterId(localChapters.id)
            setTitle(localChapters.title)
            setContent(localChapters.content)
            setSaveStatus('saved')
            toast({
              title: "오프라인 모드",
              description: "로컬 저장된 데이터를 불러왔습니다."
            })
            return
          }
        }

        // 온라인: 서버에서 챕터 조회
        const { data: chapters, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true })
          .limit(1)

        if (error) throw error

        if (chapters && chapters.length > 0) {
          const chapter = chapters[0]
          setCurrentChapterId(chapter.id)

          // 로컬 Draft가 있는지 확인 (복구)
          const draft = await getDraft(chapter.id)
          if (draft && draft.timestamp > new Date(chapter.updated_at || chapter.created_at).getTime()) {
            // 로컬 Draft가 더 최신
            setTitle(draft.title)
            setContent(draft.content)
            toast({
              title: "Draft 복구",
              description: "저장되지 않은 로컬 데이터를 복구했습니다."
            })
          } else {
            setTitle(chapter.title)
            setContent(chapter.content || '')
          }

          setLastSavedAt(new Date(chapter.updated_at || chapter.created_at))
          setSaveStatus('saved')
        } else {
          // 챕터가 없으면 새로 생성
          const { data: newChapter, error: createError } = await supabase
            .from('chapters')
            .insert({
              project_id: projectId,
              title: '제목 없음',
              content: '',
              order_index: 1,
              status: 'draft'
            })
            .select()
            .single()

          if (createError) throw createError

          if (newChapter) {
            setCurrentChapterId(newChapter.id)
            setTitle(newChapter.title)
            setContent('')
            setSaveStatus('saved')
          }
        }
      } catch (err) {
        console.error('챕터 로드 오류:', err)
        toast({
          title: '챕터 로드 실패',
          description: '챕터를 불러오는 중 오류가 발생했습니다.',
          variant: 'destructive'
        })
      }
    }

    loadChapter()
  }, [projectId, user, supabase, isOnline])

  // 자동 저장 (디바운스)
  useEffect(() => {
    const autoSave = async () => {
      if (!currentChapterId || !user) return
      if (saveStatus === 'saving') return

      setSaveStatus('saving')

      try {
        // 오프라인이면 로컬에만 저장
        if (!isOnline) {
          await saveToLocal()
          setSaveStatus('saved')
          setTimeout(() => {
            setSaveStatus('idle')
          }, 2000)
          return
        }

        // 온라인: 서버에 저장
        const { error } = await supabase
          .from('chapters')
          .update({
            title: title,
            content: content,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentChapterId)

        if (error) throw error

        // 30분마다 자동 버전 저장
        const lastVersionTime = localStorage.getItem(`lastAutoVersion_${currentChapterId}`)
        const now = Date.now()
        if (!lastVersionTime || now - parseInt(lastVersionTime) > 30 * 60 * 1000) {
          await saveVersion('auto')
          localStorage.setItem(`lastAutoVersion_${currentChapterId}`, now.toString())
        }

        setLastSavedAt(new Date())
        setSaveStatus('saved')

        // 2초 후 idle 상태로 변경
        setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)
      } catch (err) {
        console.error('자동 저장 오류:', err)
        setSaveStatus('error')
        
        toast({
          title: '저장 실패!',
          description: '네트워크 오류로 저장에 실패했습니다. 내용을 백업하세요.',
          variant: 'destructive',
          action: (
            <button
              onClick={() => {
                // 클립보드에 복사
                navigator.clipboard.writeText(content)
                toast({
                  title: '복사 완료',
                  description: '내용이 클립보드에 복사되었습니다.'
                })
              }}
              className="px-3 py-2 text-sm bg-zinc-100 text-zinc-900 rounded hover:bg-zinc-200"
            >
              복사
            </button>
          )
        })
      }
    }

    // 디바운스된 값이 변경되면 자동 저장
    if (currentChapterId && (debouncedContent || debouncedTitle)) {
      autoSave()
    }
  }, [debouncedContent, debouncedTitle, currentChapterId, user])

  // 타이핑 상태 표시
  useEffect(() => {
    if (saveStatus === 'idle' || saveStatus === 'saved') {
      setSaveStatus('typing')
    }
  }, [content, title])

  // 저장 상태 텍스트 및 스타일
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'typing':
        return {
          text: '작성 중...',
          className: 'text-zinc-500',
          icon: null
        }
      case 'saving':
        return {
          text: '저장 중...',
          className: 'text-blue-400',
          icon: <Loader2 className="h-3 w-3 animate-spin" />
        }
      case 'saved':
        return {
          text: lastSavedAt 
            ? `저장됨 (${lastSavedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})` 
            : '저장됨',
          className: 'text-green-400',
          icon: <CheckCircle2 className="h-3 w-3" />
        }
      case 'error':
        return {
          text: '저장 실패!',
          className: 'text-red-400',
          icon: <AlertCircle className="h-3 w-3" />
        }
      default:
        return {
          text: '저장 안됨',
          className: 'text-zinc-500',
          icon: null
        }
    }
  }

  const saveStatusDisplay = getSaveStatusDisplay()

  if (!user) {
    return null // 로딩 중 또는 리다이렉트
  }

  return (
    <div className="flex h-screen w-full bg-zinc-950 overflow-hidden">
      {/* Resource Modal */}
      <ResourceModal
        open={resourceModalOpen}
        onOpenChange={setResourceModalOpen}
        resourceType={selectedResourceCategory}
        onSubmit={handleResourceSubmit}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        open={apiKeyModalOpen}
        onOpenChange={setApiKeyModalOpen}
        required={false}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        chapterId={currentChapterId || ''}
        projectId={projectId}
        onRestore={handleRestoreVersion}
      />

      {/* Left Sidebar - Desktop */}
      <aside className={`hidden md:flex border-r border-zinc-800 flex-col bg-zinc-950 transition-all duration-300 ${
        isFocusMode ? "w-0 border-r-0 overflow-hidden" : "w-[280px]"
      }`}>
        <LeftSidebarContent 
          projectId={projectId}
          currentChapterId={currentChapterId}
          onAddChapter={handleAddChapter}
          onChapterSelect={loadChapterById}
          onAddResource={handleAddResource}
          chaptersVersion={chaptersVersion}
        />
      </aside>

      {/* Left Drawer - Mobile */}
      <Sheet open={leftDrawerOpen} onOpenChange={setLeftDrawerOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-zinc-950 border-zinc-800">
          <LeftSidebarContent 
            projectId={projectId}
            currentChapterId={currentChapterId}
            onAddChapter={async () => {
              await handleAddChapter()
              setLeftDrawerOpen(false)
            }}
            onChapterSelect={(id) => {
              loadChapterById(id)
              setLeftDrawerOpen(false)
            }}
            onAddResource={(type) => {
              handleAddResource(type)
              setLeftDrawerOpen(false)
            }}
            chaptersVersion={chaptersVersion}
          />
        </SheetContent>
      </Sheet>

      {/* Center Editor - 메인 에디터 영역 */}
      <main className="flex-1 flex flex-col bg-zinc-950 min-w-0">
        {/* Editor Toolbar */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            {/* 대시보드로 돌아가기 */}
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1.5 h-9 px-2"
              asChild
            >
              <Link href="/dashboard" title="대시보드로 돌아가기">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">대시보드</span>
              </Link>
            </Button>
            {/* Mobile Menu Buttons */}
            <div className="flex md:hidden gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setLeftDrawerOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate max-w-[150px] md:max-w-[240px]">{title || "제목 없음"}</span>
              <span className="text-xs text-zinc-500">작성중</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 오프라인 배지 */}
            {!isOnline && (
              <Badge variant="destructive" className="gap-1 hidden md:flex">
                <WifiOff className="h-3 w-3" />
                오프라인
              </Badge>
            )}

            {/* 버전 저장 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveVersion('manual')}
              className="gap-2 hidden md:flex"
              title="현재 버전 저장"
            >
              <Clock className="h-4 w-4" />
              버전 저장
            </Button>

            {/* Mobile Right Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 md:hidden"
              onClick={() => setRightDrawerOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
            </Button>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {/* 포커스 모드 토글 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFocusMode}
                className="gap-2"
                title={isFocusMode ? "포커스 모드 해제" : "포커스 모드"}
              >
                {isFocusMode ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    포커스
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    포커스
                  </>
                )}
              </Button>

              <Badge 
                variant="secondary" 
                className={`flex items-center gap-1 ${
                  saveStatus === 'saving' 
                    ? "bg-blue-900/30 text-blue-400" 
                    : saveStatus === 'saved'
                    ? "bg-green-900/30 text-green-400"
                    : saveStatus === 'error'
                    ? "bg-red-900/30 text-red-400"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {saveStatusDisplay.icon}
                <span>{saveStatusDisplay.text.split(' (')[0]}</span>
              </Badge>
              
              <Button variant="ghost" size="sm">
                미리보기
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={async () => {
                  if (!currentChapterId) return
                  setSaveStatus('saving')
                  
                  try {
                    const { error } = await supabase
                      .from('chapters')
                      .update({
                        title: title,
                        content: content,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', currentChapterId)

                    if (error) throw error

                    setLastSavedAt(new Date())
                    setSaveStatus('saved')
                    
                    toast({
                      title: '저장 완료',
                      description: '변경사항이 저장되었습니다.'
                    })
                  } catch (err) {
                    console.error('수동 저장 오류:', err)
                    setSaveStatus('error')
                  }
                }}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content Area */}
        <ScrollArea className="flex-1">
          <div className={`mx-auto px-8 py-8 transition-all duration-300 ${
            isFocusMode ? "max-w-5xl" : "max-w-4xl"
          }`}>
            <div className="prose prose-invert prose-zinc max-w-none">
              {/* Title Input */}
              <input
                type="text"
                placeholder="챕터 제목을 입력하세요..."
                className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-zinc-700 mb-8 focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              {/* Content Textarea */}
              <textarea
                placeholder="이야기를 시작하세요..."
                className="w-full min-h-[600px] bg-transparent border-none outline-none resize-none text-lg leading-relaxed placeholder:text-zinc-700 focus:outline-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  const start = target.selectionStart
                  const end = target.selectionEnd
                  const selectedText = content.substring(start, end)
                  setSelection(selectedText, start, end)
                }}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Editor Status Bar */}
        <div className="h-10 border-t border-zinc-800 flex items-center justify-between px-6 text-xs">
          <div className="flex items-center gap-4 text-zinc-500">
            <span>단어 수: {wordCount.toLocaleString()}</span>
            <span>글자 수: {characterCount.toLocaleString()}</span>
            <span>문단 수: {paragraphCount}</span>
          </div>
          <div className={`flex items-center gap-2 ${saveStatusDisplay.className}`}>
            {saveStatusDisplay.icon}
            <span>{saveStatusDisplay.text}</span>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Desktop */}
      <aside className={`hidden md:flex border-l border-zinc-800 flex-col bg-zinc-950 transition-all duration-300 ${
        isFocusMode ? "w-0 border-l-0 overflow-hidden" : "w-[320px]"
      }`}>
        <RightSidebarContent 
          projectId={projectId}
          openaiApiKey={openaiApiKey}
          anthropicApiKey={anthropicApiKey}
          geminiApiKey={geminiApiKey}
          selectedModel={selectedModel}
          tokensUsedToday={tokensUsedToday}
          onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
          onModelChange={setSelectedModel}
          onBeforeAI={() => {
            // AI 실행 전 버전 저장
            saveVersion('pre_ai')
          }}
          onAIResult={(result) => {
            // AI 결과를 에디터에 삽입
            setContent(content + '\n\n' + result)
          }}
        />
      </aside>

      {/* Right Drawer - Mobile */}
      <Sheet open={rightDrawerOpen} onOpenChange={setRightDrawerOpen}>
        <SheetContent side="right" className="w-[320px] p-0 bg-zinc-950 border-zinc-800">
          <RightSidebarContent 
            projectId={projectId}
            openaiApiKey={openaiApiKey}
            anthropicApiKey={anthropicApiKey}
            geminiApiKey={geminiApiKey}
            selectedModel={selectedModel}
            tokensUsedToday={tokensUsedToday}
            onOpenApiKeyModal={() => {
              setApiKeyModalOpen(true)
              setRightDrawerOpen(false)
            }}
            onModelChange={setSelectedModel}
            onBeforeAI={() => {
              // AI 실행 전 버전 저장
              saveVersion('pre_ai')
            }}
            onAIResult={(result) => {
              // AI 결과를 에디터에 삽입
              setContent(content + '\n\n' + result)
              setRightDrawerOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
