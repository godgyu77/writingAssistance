-- ============================================
-- AI 로그 및 사용량 추적 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  mode TEXT, -- 'continue', 'improve', 'describe', etc.
  prompt TEXT,
  response TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0, -- 비용 (USD)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_project_id ON ai_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(created_at);

-- RLS 활성화
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view their own ai logs"
  ON ai_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ai logs"
  ON ai_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai logs"
  ON ai_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 사용 방법:
-- ============================================
-- Supabase SQL Editor에서 이 SQL을 실행하세요.
