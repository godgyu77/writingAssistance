"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Search, 
  Star, 
  Trash2, 
  Plus,
  FileText,
  TrendingUp
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PromptTemplate } from "@/lib/types/database"
import { useToast } from "@/hooks/use-toast"

interface PromptTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: PromptTemplate) => void
}

export function PromptTemplateModal({
  isOpen,
  onClose,
  onSelect
}: PromptTemplateModalProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  useEffect(() => {
    filterTemplates()
  }, [searchQuery, selectedCategory, templates])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('use_count', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('템플릿 로드 오류:', error)
      toast({
        title: "오류",
        description: "템플릿을 불러오지 못했습니다.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // 카테고리 필터
    if (selectedCategory) {
      if (selectedCategory === 'favorite') {
        filtered = filtered.filter(t => t.is_favorite)
      } else {
        filtered = filtered.filter(t => t.category === selectedCategory)
      }
    }

    setFilteredTemplates(filtered)
  }

  const handleSelectTemplate = async (template: PromptTemplate) => {
    // 사용 횟수 증가
    await supabase
      .from('prompt_templates')
      .update({ use_count: template.use_count + 1 })
      .eq('id', template.id)

    onSelect(template)
    toast({
      title: "템플릿 불러오기 완료",
      description: `"${template.title}" 템플릿을 적용했습니다.`
    })
    onClose()
  }

  const handleToggleFavorite = async (template: PromptTemplate) => {
    try {
      const { error } = await supabase
        .from('prompt_templates')
        .update({ is_favorite: !template.is_favorite })
        .eq('id', template.id)

      if (error) throw error

      loadTemplates()
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      toast({
        title: "삭제 완료",
        description: "템플릿이 삭제되었습니다."
      })
      loadTemplates()
    } catch (error) {
      console.error('템플릿 삭제 오류:', error)
      toast({
        title: "오류",
        description: "템플릿 삭제에 실패했습니다.",
        variant: "destructive"
      })
    }
  }

  const getCategoryLabel = (category: string | null) => {
    switch (category) {
      case 'continue': return '이어쓰기'
      case 'improve': return '문체 교정'
      case 'describe': return '묘사 강화'
      case 'dialogue': return '대화 개선'
      case 'plot': return '플롯 제안'
      case 'custom': return '사용자 정의'
      default: return '기타'
    }
  }

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'continue': return 'bg-blue-900/50 text-blue-300'
      case 'improve': return 'bg-purple-900/50 text-purple-300'
      case 'describe': return 'bg-green-900/50 text-green-300'
      case 'dialogue': return 'bg-yellow-900/50 text-yellow-300'
      case 'plot': return 'bg-red-900/50 text-red-300'
      case 'custom': return 'bg-zinc-800 text-zinc-300'
      default: return 'bg-zinc-800 text-zinc-300'
    }
  }

  const categories = [
    { value: 'favorite', label: '⭐ 즐겨찾기', icon: Star },
    { value: 'continue', label: '✍️ 이어쓰기', icon: FileText },
    { value: 'improve', label: '✨ 문체 교정', icon: TrendingUp },
    { value: 'describe', label: '🎨 묘사 강화', icon: FileText },
    { value: 'dialogue', label: '💬 대화 개선', icon: FileText },
    { value: 'plot', label: '📖 플롯 제안', icon: FileText }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            프롬프트 템플릿
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[65vh]">
          {/* 왼쪽: 카테고리 & 검색 */}
          <div className="w-1/4 border-r border-zinc-800 pr-4 space-y-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* 카테고리 */}
            <div className="space-y-1">
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(null)}
              >
                <FileText className="h-4 w-4 mr-2" />
                전체 ({templates.length})
              </Button>

              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 오른쪽: 템플릿 목록 */}
          <div className="flex-1">
            <ScrollArea className="h-full">
              {loading ? (
                <p className="text-center text-zinc-500 py-8">로딩 중...</p>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>템플릿이 없습니다</p>
                  <p className="text-sm mt-2">프롬프트를 작성하고 저장해보세요</p>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* 헤더 */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-base mb-2">
                                {template.title}
                              </h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                {template.category && (
                                  <Badge className={`text-xs ${getCategoryColor(template.category)}`}>
                                    {getCategoryLabel(template.category)}
                                  </Badge>
                                )}
                                {template.tags && template.tags.length > 0 && template.tags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {template.use_count > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {template.use_count}회 사용
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleFavorite(template)
                                }}
                                className={`h-8 w-8 p-0 ${template.is_favorite ? 'text-yellow-400' : 'text-zinc-500'}`}
                              >
                                <Star className={`h-4 w-4 ${template.is_favorite ? 'fill-current' : ''}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteTemplate(template.id)
                                }}
                                className="h-8 w-8 p-0 text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* 내용 미리보기 */}
                          <p className="text-sm text-zinc-400 line-clamp-2">
                            {template.content}
                          </p>

                          {/* 날짜 */}
                          <p className="text-xs text-zinc-600">
                            {new Date(template.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 템플릿 저장 모달
interface SaveTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  initialContent: string
  initialMode: string
}

export function SaveTemplateModal({
  isOpen,
  onClose,
  initialContent,
  initialMode
}: SaveTemplateModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState('')
  const [category, setCategory] = useState(initialMode)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent)
      setCategory(initialMode)
      setTitle('')
      setTags('')
    }
  }, [isOpen, initialContent, initialMode])

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "오류",
        description: "템플릿 제목을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "오류",
        description: "템플릿 내용을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0)

      const { error } = await supabase
        .from('prompt_templates')
        .insert({
          user_id: user.id,
          title: title,
          content: content,
          tags: tagsArray,
          category: category || 'custom',
          is_favorite: false,
          use_count: 0
        })

      if (error) throw error

      toast({
        title: "저장 완료",
        description: "템플릿이 저장되었습니다."
      })
      onClose()
    } catch (error: any) {
      console.error('템플릿 저장 오류:', error)
      toast({
        title: "오류",
        description: error.message || "템플릿 저장에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            템플릿 저장
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제목 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">템플릿 제목 *</label>
            <Input
              placeholder="예: 액션 장면 묘사"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* 내용 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">프롬프트 내용 *</label>
            <Textarea
              placeholder="저장할 프롬프트를 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-zinc-800 border-zinc-700 min-h-[150px]"
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
            >
              <option value="continue">✍️ 이어쓰기</option>
              <option value="improve">✨ 문체 교정</option>
              <option value="describe">🎨 묘사 강화</option>
              <option value="dialogue">💬 대화 개선</option>
              <option value="plot">📖 플롯 제안</option>
              <option value="custom">기타</option>
            </select>
          </div>

          {/* 태그 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">태그 (쉼표로 구분)</label>
            <Input
              placeholder="예: 액션, 긴장감, 전투"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
            <p className="text-xs text-zinc-500">
              태그를 쉼표(,)로 구분하여 입력하세요
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
