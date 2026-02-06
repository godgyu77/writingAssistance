import Dexie, { Table } from 'dexie'

// IndexedDB 데이터 타입
export interface LocalChapter {
  id: string
  projectId: string
  title: string
  content: string
  wordCount: number
  lastModified: number
  syncedAt?: number
  needsSync: boolean
}

export interface LocalDraft {
  chapterId: string
  content: string
  title: string
  timestamp: number
}

// Dexie DB 클래스
export class WritingAssistanceDB extends Dexie {
  chapters!: Table<LocalChapter>
  drafts!: Table<LocalDraft>

  constructor() {
    super('WritingAssistanceDB')
    
    this.version(1).stores({
      chapters: 'id, projectId, lastModified, needsSync',
      drafts: 'chapterId, timestamp'
    })
  }
}

// DB 인스턴스 생성 (싱글톤)
export const localDB = new WritingAssistanceDB()

// 유틸리티 함수들

// 로컬 챕터 저장
export async function saveLocalChapter(chapter: LocalChapter): Promise<void> {
  await localDB.chapters.put(chapter)
}

// 로컬 챕터 가져오기
export async function getLocalChapter(chapterId: string): Promise<LocalChapter | undefined> {
  return await localDB.chapters.get(chapterId)
}

// 로컬 챕터 목록 가져오기
export async function getLocalChaptersByProject(projectId: string): Promise<LocalChapter[]> {
  return await localDB.chapters.where('projectId').equals(projectId).toArray()
}

// 동기화가 필요한 챕터 가져오기
export async function getUnsyncedChapters(): Promise<LocalChapter[]> {
  return await localDB.chapters.where('needsSync').equals(1).toArray()
}

// 임시 저장 (Draft) - 실시간 백업
export async function saveDraft(chapterId: string, title: string, content: string): Promise<void> {
  await localDB.drafts.put({
    chapterId,
    title,
    content,
    timestamp: Date.now()
  })
}

// Draft 가져오기
export async function getDraft(chapterId: string): Promise<LocalDraft | undefined> {
  return await localDB.drafts.get(chapterId)
}

// Draft 삭제
export async function deleteDraft(chapterId: string): Promise<void> {
  await localDB.drafts.delete(chapterId)
}

// 오래된 Draft 정리 (7일 이상)
export async function cleanupOldDrafts(): Promise<void> {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  await localDB.drafts.where('timestamp').below(sevenDaysAgo).delete()
}

// 모든 로컬 데이터 삭제 (로그아웃 시)
export async function clearAllLocalData(): Promise<void> {
  await localDB.chapters.clear()
  await localDB.drafts.clear()
}
