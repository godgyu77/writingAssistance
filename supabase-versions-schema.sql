-- ============================================
-- 버전 관리 (Time Machine) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  snapshot_type TEXT NOT NULL, -- 'manual', 'auto', 'pre_ai', 'backup'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_versions_chapter_id ON versions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_versions_project_id ON versions(project_id);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at);

-- RLS 활성화
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view versions of their projects"
  ON versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions in their projects"
  ON versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete versions in their projects"
  ON versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- 오래된 버전 자동 정리 함수 (선택사항)
-- 챕터당 최근 50개만 유지
CREATE OR REPLACE FUNCTION cleanup_old_versions()
RETURNS void AS $$
BEGIN
  DELETE FROM versions
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
        ROW_NUMBER() OVER (PARTITION BY chapter_id ORDER BY created_at DESC) as rn
      FROM versions
    ) sub
    WHERE rn > 50
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 사용 방법:
-- ============================================
-- Supabase SQL Editor에서 이 SQL을 실행하세요.
