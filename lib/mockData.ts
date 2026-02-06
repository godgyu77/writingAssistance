export interface Novel {
  id: string
  title: string
  genre: string
  thumbnail?: string
  progress: number // 0-100
  lastModified: Date
  totalChapters: number
  completedChapters: number
}

export const mockNovels: Novel[] = [
  {
    id: "1",
    title: "별이 빛나는 밤의 기억",
    genre: "판타지",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop",
    progress: 65,
    lastModified: new Date("2026-02-05"),
    totalChapters: 50,
    completedChapters: 32
  },
  {
    id: "2",
    title: "시간을 거스르는 연인",
    genre: "로맨스",
    thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=600&fit=crop",
    progress: 42,
    lastModified: new Date("2026-02-04"),
    totalChapters: 40,
    completedChapters: 17
  },
  {
    id: "3",
    title: "흑마법사의 귀환",
    genre: "다크 판타지",
    thumbnail: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=600&fit=crop",
    progress: 88,
    lastModified: new Date("2026-02-06"),
    totalChapters: 60,
    completedChapters: 53
  },
  {
    id: "4",
    title: "미래도시의 탐정",
    genre: "SF 스릴러",
    thumbnail: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&h=600&fit=crop",
    progress: 15,
    lastModified: new Date("2026-01-28"),
    totalChapters: 35,
    completedChapters: 5
  }
]

export function formatDate(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return "오늘"
  if (diffInDays === 1) return "어제"
  if (diffInDays < 7) return `${diffInDays}일 전`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}주 전`
  
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
}
