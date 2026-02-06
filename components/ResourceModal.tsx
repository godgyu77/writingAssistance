"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
interface ResourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceType: string
  onSubmit?: (data: ResourceFormData) => void
}

const resourceLabelMap: Record<string, string> = {
  world: '세계관',
  character: '인물',
  item: '아이템',
  plot: '플롯'
}

const resourceIconMap: Record<string, string> = {
  world: '🌍',
  character: '👤',
  item: '⚔️',
  plot: '📖'
}

export interface ResourceFormData {
  name: string
  tags: string[]
  description: string
  aiSummary: string
}

export function ResourceModal({ open, onOpenChange, resourceType, onSubmit }: ResourceModalProps) {
  const [formData, setFormData] = useState<ResourceFormData>({
    name: '',
    tags: [],
    description: '',
    aiSummary: ''
  })
  
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleSubmit = () => {
    if (formData.name.trim()) {
      onSubmit?.(formData)
      // 폼 초기화
      setFormData({
        name: '',
        tags: [],
        description: '',
        aiSummary: ''
      })
      setTagInput('')
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    // 폼 초기화
    setFormData({
      name: '',
      tags: [],
      description: '',
      aiSummary: ''
    })
    setTagInput('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{resourceIconMap[resourceType] || '📝'}</span>
            <span>{resourceLabelMap[resourceType] || '리소스'} 추가</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            새로운 {resourceLabelMap[resourceType] || '리소스'} 정보를 입력하세요. AI가 이 정보를 활용하여 더 나은 제안을 할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">이름</label>
            <Input
              placeholder={`${resourceLabelMap[resourceType]} 이름을 입력하세요`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-zinc-950 border-zinc-800 focus:border-zinc-700"
            />
          </div>

          {/* 태그 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">태그 (AI 인식용)</label>
            <div className="flex gap-2">
              <Input
                placeholder="태그 입력 후 Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="bg-zinc-950 border-zinc-800 focus:border-zinc-700"
              />
              <Button 
                type="button" 
                onClick={handleAddTag}
                variant="outline"
                className="border-zinc-800"
              >
                추가
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-zinc-800 text-zinc-300 pr-1 gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-zinc-700 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">상세 설명</label>
            <Textarea
              placeholder="자세한 설명을 입력하세요"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-zinc-950 border-zinc-800 focus:border-zinc-700 min-h-[100px] resize-none"
            />
          </div>

          {/* AI용 요약 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI용 한 줄 요약</label>
            <Input
              placeholder="AI가 이해하기 쉬운 간단한 요약"
              value={formData.aiSummary}
              onChange={(e) => setFormData({ ...formData, aiSummary: e.target.value })}
              className="bg-zinc-950 border-zinc-800 focus:border-zinc-700"
            />
            <p className="text-xs text-zinc-500">
              AI가 이 리소스를 참조할 때 사용할 핵심 정보를 한 줄로 작성하세요.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
