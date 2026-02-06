"use client"

import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/store/useAuthStore"

interface NewProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const GENRES = [
  "판타지",
  "현대 판타지",
  "무협",
  "로맨스",
  "로맨스 판타지",
  "SF",
  "스릴러/미스터리",
  "호러",
  "역사",
  "기타"
]

export function NewProjectModal({ open, onOpenChange, onSuccess }: NewProjectModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const { user } = useAuthStore()
  
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: title.trim(),
          genre: genre || null,
          description: description.trim() || null,
          tags: [],
          cover_image_url: null,
          last_accessed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 성공 시 폼 초기화 및 모달 닫기
      setTitle('')
      setGenre('')
      setDescription('')
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error('프로젝트 생성 오류:', err)
      setError(err.message || '프로젝트 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            새 작품 만들기
          </DialogTitle>
          <DialogDescription>
            새로운 웹소설 프로젝트를 시작하세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="작품 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
                required
              />
            </div>

            {/* 장르 */}
            <div className="space-y-2">
              <Label htmlFor="genre">장르</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="장르를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">간단한 설명</Label>
              <Textarea
                id="description"
                placeholder="작품에 대한 간단한 설명을 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-950 border-zinc-800 min-h-[100px]"
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-md text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              {loading ? '생성 중...' : '생성하기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
