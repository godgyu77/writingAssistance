"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Clock, 
  Undo2, 
  Eye, 
  Trash2, 
  Save, 
  Sparkles, 
  Archive,
  FileText
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Version } from "@/lib/types/database"
import { useToast } from "@/hooks/use-toast"

interface VersionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  chapterId: string
  projectId: string
  onRestore: (version: Version) => void
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  chapterId,
  projectId,
  onRestore
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (isOpen && chapterId) {
      loadVersions()
    }
  }, [isOpen, chapterId])

  const loadVersions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('versions')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setVersions(data || [])
    } catch (error) {
      console.error('버전 로드 오류:', error)
      toast({
        title: "오류",
        description: "버전 기록을 불러오지 못했습니다.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = (version: Version) => {
    onRestore(version)
    toast({
      title: "버전 복원",
      description: `${new Date(version.created_at).toLocaleString('ko-KR')} 버전으로 복원되었습니다.`,
    })
    onClose()
  }

  const handleDelete = async (versionId: string) => {
    try {
      const { error } = await supabase
        .from('versions')
        .delete()
        .eq('id', versionId)

      if (error) throw error

      toast({
        title: "삭제 완료",
        description: "버전이 삭제되었습니다."
      })
      loadVersions()
    } catch (error) {
      console.error('버전 삭제 오류:', error)
      toast({
        title: "오류",
        description: "버전 삭제에 실패했습니다.",
        variant: "destructive"
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'manual':
        return <Save className="h-4 w-4" />
      case 'auto':
        return <Clock className="h-4 w-4" />
      case 'pre_ai':
        return <Sparkles className="h-4 w-4" />
      case 'backup':
        return <Archive className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'manual':
        return '수동 저장'
      case 'auto':
        return '자동 저장'
      case 'pre_ai':
        return 'AI 실행 전'
      case 'backup':
        return '백업'
      default:
        return type
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'manual':
        return 'bg-blue-900/50 text-blue-300'
      case 'auto':
        return 'bg-zinc-800 text-zinc-300'
      case 'pre_ai':
        return 'bg-purple-900/50 text-purple-300'
      case 'backup':
        return 'bg-green-900/50 text-green-300'
      default:
        return 'bg-zinc-800 text-zinc-300'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            버전 기록
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[60vh]">
          {/* 왼쪽: 버전 리스트 */}
          <div className="w-1/2 border-r border-zinc-800 pr-4">
            <ScrollArea className="h-full">
              {loading ? (
                <p className="text-center text-zinc-500 py-8">로딩 중...</p>
              ) : versions.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">
                  저장된 버전이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <Card
                      key={version.id}
                      className={`cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id
                          ? 'bg-zinc-800 border-purple-700'
                          : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getTypeBadgeColor(version.snapshot_type)}`}>
                                {getTypeIcon(version.snapshot_type)}
                                <span className="ml-1">{getTypeLabel(version.snapshot_type)}</span>
                              </Badge>
                              <span className="text-xs text-zinc-500">
                                {version.word_count.toLocaleString()}자
                              </span>
                            </div>
                            <p className="text-sm font-medium line-clamp-1">
                              {version.title}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {new Date(version.created_at).toLocaleString('ko-KR')}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRestore(version)
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <Undo2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(version.id)
                              }}
                              className="h-7 w-7 p-0 text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* 오른쪽: 선택된 버전 미리보기 */}
          <div className="w-1/2 pl-4">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-400">제목</h3>
                  <p className="text-base font-medium">{selectedVersion.title}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-400">내용 미리보기</h3>
                    <Button
                      size="sm"
                      onClick={() => handleRestore(selectedVersion)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Undo2 className="h-3 w-3 mr-1" />
                      이 버전으로 복원
                    </Button>
                  </div>
                  <ScrollArea className="h-[400px] p-4 bg-zinc-950 border border-zinc-800 rounded-md">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedVersion.content || '(내용 없음)'}
                    </p>
                  </ScrollArea>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{selectedVersion.word_count.toLocaleString()}자</span>
                  <span>•</span>
                  <span>{new Date(selectedVersion.created_at).toLocaleString('ko-KR')}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                <div className="text-center space-y-2">
                  <Eye className="h-12 w-12 mx-auto opacity-50" />
                  <p>왼쪽에서 버전을 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
