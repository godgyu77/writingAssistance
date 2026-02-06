import { createClient } from '@/lib/supabase/client'
import { 
  getUnsyncedChapters, 
  saveLocalChapter, 
  getLocalChapter,
  LocalChapter 
} from '@/lib/db/localDB'

// 로컬 → Supabase 동기화
export async function syncToSupabase(): Promise<{
  success: boolean
  syncedCount: number
  errors: string[]
}> {
  const supabase = createClient()
  const unsyncedChapters = await getUnsyncedChapters()
  
  let syncedCount = 0
  const errors: string[] = []

  for (const chapter of unsyncedChapters) {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          title: chapter.title,
          content: chapter.content,
          word_count: chapter.wordCount,
          updated_at: new Date(chapter.lastModified).toISOString()
        })
        .eq('id', chapter.id)

      if (error) throw error

      // 동기화 성공 - 플래그 업데이트
      await saveLocalChapter({
        ...chapter,
        needsSync: false,
        syncedAt: Date.now()
      })

      syncedCount++
    } catch (error: any) {
      console.error(`챕터 ${chapter.id} 동기화 실패:`, error)
      errors.push(`${chapter.title}: ${error.message}`)
    }
  }

  return {
    success: errors.length === 0,
    syncedCount,
    errors
  }
}

// Supabase → 로컬 동기화 (덮어쓰기 전에 충돌 확인)
export async function syncFromSupabase(
  chapterId: string
): Promise<{
  success: boolean
  hasConflict: boolean
  serverData?: any
  localData?: LocalChapter
}> {
  const supabase = createClient()
  const localChapter = await getLocalChapter(chapterId)

  try {
    const { data: serverChapter, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single()

    if (error) throw error

    // 서버 데이터가 없으면
    if (!serverChapter) {
      return { success: false, hasConflict: false }
    }

    // 로컬 데이터가 없으면 그냥 다운로드
    if (!localChapter) {
      await saveLocalChapter({
        id: serverChapter.id,
        projectId: serverChapter.project_id,
        title: serverChapter.title,
        content: serverChapter.content,
        wordCount: serverChapter.word_count || 0,
        lastModified: new Date(serverChapter.updated_at).getTime(),
        syncedAt: Date.now(),
        needsSync: false
      })
      return { success: true, hasConflict: false }
    }

    // 충돌 감지: 로컬이 더 최신이고 아직 동기화 안 됨
    const serverTime = new Date(serverChapter.updated_at).getTime()
    const hasConflict = localChapter.needsSync && localChapter.lastModified > serverTime

    if (hasConflict) {
      return {
        success: false,
        hasConflict: true,
        serverData: serverChapter,
        localData: localChapter
      }
    }

    // 충돌 없으면 서버 데이터로 업데이트
    await saveLocalChapter({
      id: serverChapter.id,
      projectId: serverChapter.project_id,
      title: serverChapter.title,
      content: serverChapter.content,
      wordCount: serverChapter.word_count || 0,
      lastModified: new Date(serverChapter.updated_at).getTime(),
      syncedAt: Date.now(),
      needsSync: false
    })

    return { success: true, hasConflict: false }
  } catch (error: any) {
    console.error('서버에서 동기화 실패:', error)
    return { success: false, hasConflict: false }
  }
}

// 자동 동기화 (온라인 상태로 돌아왔을 때)
export async function autoSync(): Promise<void> {
  const result = await syncToSupabase()
  
  if (result.syncedCount > 0) {
    console.log(`✅ ${result.syncedCount}개 챕터 동기화 완료`)
  }
  
  if (result.errors.length > 0) {
    console.error('❌ 동기화 실패:', result.errors)
  }
}
