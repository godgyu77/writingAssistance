"use client"

import { useState, useEffect, useMemo } from "react"
import { BookOpen, FileText, Plus, Search, ChevronRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Chapter, Resource } from "@/lib/types/database"

interface LeftSidebarProps {
  projectId: string
  currentChapterId?: string | null
  onAddChapter: () => void
  onChapterSelect?: (chapterId: string) => void
  onAddResource: (category: string) => void
  /** 변경 시 챕터 목록 다시 불러옴 (예: 새 챕터 추가 후 증가) */
  chaptersVersion?: number
}

const resourceIconMap: Record<string, string> = {
  world: '🌍',
  character: '👤',
  item: '⚔️',
  plot: '📖'
}

const resourceLabelMap: Record<string, string> = {
  world: '세계관',
  character: '인물',
  item: '아이템',
  plot: '플롯'
}

export function LeftSidebarContent({ projectId, currentChapterId, onAddChapter, onChapterSelect, onAddResource, chaptersVersion = 0 }: LeftSidebarProps) {
  const supabase = useMemo(() => createClient(), [])
  const [searchQuery, setSearchQuery] = useState('')
  
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  // 챕터 불러오기
  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (error) throw error
      setChapters(data || [])
    } catch (err) {
      console.error('챕터 불러오기 오류:', err)
    }
  }

  // 리소스 불러오기
  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setResources(data || [])
    } catch (err) {
      console.error('리소스 불러오기 오류:', err)
    }
  }

  // 초기 데이터 로드 (projectId 또는 chaptersVersion 변경 시)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchChapters(), fetchResources()])
      setLoading(false)
    }
    loadData()
  }, [projectId, chaptersVersion])

  // 타입별 리소스 필터링
  const getResourcesByType = (category: string) => {
    return resources.filter(r => r.category === category && 
      (searchQuery === '' || 
       r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       r.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    )
  }

  const worldResources = getResourcesByType('world')
  const characterResources = getResourcesByType('character')
  const itemResources = getResourcesByType('item')
  const plotResources = getResourcesByType('plot')

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { style: string; label: string }> = {
      draft: { style: 'bg-zinc-800 text-zinc-400', label: '계획' },
      writing: { style: 'bg-blue-900/30 text-blue-400', label: '작성중' },
      completed: { style: 'bg-green-900/30 text-green-400', label: '완료' }
    }
    
    if (!status || !statusMap[status]) {
      return { style: 'bg-zinc-800 text-zinc-400', label: '계획' }
    }
    
    return statusMap[status]
  }

  return (
    <Tabs defaultValue="chapters" className="flex flex-col h-full min-h-0">
      {/* Tabs Header - 높이 축소해 챕터 목록 영역 확대 */}
      <div className="h-11 border-b border-zinc-800 px-2 flex-shrink-0">
        <TabsList className="w-full h-full bg-transparent grid grid-cols-2">
          <TabsTrigger value="chapters" className="data-[state=active]:bg-zinc-800 text-sm">
            <BookOpen className="h-4 w-4 mr-2" />
            챕터
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-zinc-800 text-sm">
            <FileText className="h-4 w-4 mr-2" />
            설정
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Chapters Tab - 남는 세로 공간 모두 사용 */}
      <TabsContent value="chapters" className="flex-1 min-h-0 mt-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 pb-6 space-y-2">
            {/* New Chapter Button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
              size="sm"
              onClick={onAddChapter}
            >
              <Plus className="h-4 w-4" />
              새 챕터
            </Button>

            {/* Loading */}
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-zinc-500" />
              </div>
            ) : chapters.length === 0 ? (
              /* Empty State */
              <div className="text-center py-8 text-zinc-500 text-sm">
                <p>챕터가 없습니다</p>
                <p className="text-xs mt-2">위 버튼을 눌러 추가하세요</p>
              </div>
            ) : (
              /* Chapter List */
              chapters.map((chapter) => {
                const statusBadge = getStatusBadge(chapter.status)
                const isActive = currentChapterId === chapter.id
                return (
                  <div
                    key={chapter.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onChapterSelect?.(chapter.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onChapterSelect?.(chapter.id)
                      }
                    }}
                    className={`p-3 rounded-md border transition-colors cursor-pointer ${
                      isActive
                        ? 'border-purple-600 bg-purple-950/50 hover:bg-purple-900/30'
                        : 'border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium line-clamp-1">
                        {chapter.title}
                      </span>
                    </div>
                    <Badge variant="secondary" className={`text-xs ${statusBadge.style}`}>
                      {statusBadge.label}
                    </Badge>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      {/* Settings Tab */}
      <TabsContent value="settings" className="flex-1 min-h-0 mt-0 overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-3 border-b border-zinc-800 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="리소스 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 h-9 text-sm"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-zinc-500" />
          </div>
        ) : (
          /* Accordion Sections */
          <ScrollArea className="flex-1">
            <div className="p-3">
              <Accordion type="multiple" className="space-y-2">
                {/* 세계관 */}
                <AccordionItem value="world" className="border-zinc-800 bg-zinc-900/50 rounded-lg px-3">
                  <div className="flex items-center gap-1">
                    <AccordionTrigger className="hover:no-underline py-3 flex-1 [&[data-state=open]>div]:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{resourceIconMap.world}</span>
                        <span className="text-sm font-medium">{resourceLabelMap.world}</span>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
                          {worldResources.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-zinc-800 flex-shrink-0"
                      onClick={() => onAddResource('world')}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <AccordionContent className="pb-3">
                    {worldResources.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">
                        세계관 리소스가 없습니다
                      </p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {worldResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="p-2 rounded border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{resource.name}</p>
                                {resource.ai_summary && (
                                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                                    {resource.ai_summary}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                            </div>
                            {resource.tags && resource.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {resource.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="bg-zinc-800 text-zinc-400 text-xs px-1.5 py-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* 인물 */}
                <AccordionItem value="character" className="border-zinc-800 bg-zinc-900/50 rounded-lg px-3">
                  <div className="flex items-center gap-1">
                    <AccordionTrigger className="hover:no-underline py-3 flex-1 [&[data-state=open]>div]:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{resourceIconMap.character}</span>
                        <span className="text-sm font-medium">{resourceLabelMap.character}</span>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
                          {characterResources.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-zinc-800 flex-shrink-0"
                      onClick={() => onAddResource('character')}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <AccordionContent className="pb-3">
                    {characterResources.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">
                        인물 리소스가 없습니다
                      </p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {characterResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="p-2 rounded border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{resource.name}</p>
                                {resource.ai_summary && (
                                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                                    {resource.ai_summary}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                            </div>
                            {resource.tags && resource.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {resource.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="bg-zinc-800 text-zinc-400 text-xs px-1.5 py-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* 아이템 */}
                <AccordionItem value="item" className="border-zinc-800 bg-zinc-900/50 rounded-lg px-3">
                  <div className="flex items-center gap-1">
                    <AccordionTrigger className="hover:no-underline py-3 flex-1 [&[data-state=open]>div]:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{resourceIconMap.item}</span>
                        <span className="text-sm font-medium">{resourceLabelMap.item}</span>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
                          {itemResources.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-zinc-800 flex-shrink-0"
                      onClick={() => onAddResource('item')}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <AccordionContent className="pb-3">
                    {itemResources.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">
                        아이템 리소스가 없습니다
                      </p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {itemResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="p-2 rounded border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{resource.name}</p>
                                {resource.ai_summary && (
                                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                                    {resource.ai_summary}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                            </div>
                            {resource.tags && resource.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {resource.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="bg-zinc-800 text-zinc-400 text-xs px-1.5 py-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* 플롯 */}
                <AccordionItem value="plot" className="border-zinc-800 bg-zinc-900/50 rounded-lg px-3">
                  <div className="flex items-center gap-1">
                    <AccordionTrigger className="hover:no-underline py-3 flex-1 [&[data-state=open]>div]:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{resourceIconMap.plot}</span>
                        <span className="text-sm font-medium">{resourceLabelMap.plot}</span>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
                          {plotResources.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-zinc-800 flex-shrink-0"
                      onClick={() => onAddResource('plot')}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <AccordionContent className="pb-3">
                    {plotResources.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">
                        플롯 리소스가 없습니다
                      </p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {plotResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="p-2 rounded border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{resource.name}</p>
                                {resource.ai_summary && (
                                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                                    {resource.ai_summary}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                            </div>
                            {resource.tags && resource.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {resource.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="bg-zinc-800 text-zinc-400 text-xs px-1.5 py-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>
        )}
      </TabsContent>
    </Tabs>
  )
}
