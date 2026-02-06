-- ============================================
-- 프롬프트 템플릿 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category TEXT, -- 'continue', 'improve', 'describe', 'dialogue', 'plot', 'custom'
  is_favorite BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_favorite ON prompt_templates(is_favorite);

-- RLS 활성화
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view their own prompt templates"
  ON prompt_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prompt templates"
  ON prompt_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt templates"
  ON prompt_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt templates"
  ON prompt_templates FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 사용 방법:
-- ============================================
-- Supabase SQL Editor에서 이 SQL을 실행하세요.
