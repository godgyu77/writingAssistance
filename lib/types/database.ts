export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  genre: string | null
  tags: string[] | null
  cover_image_url: string | null
  last_accessed_at: string | null
  created_at: string
}

export interface Chapter {
  id: string
  project_id: string
  title: string
  content: string
  order_index: number
  status: string | null
  memo: string | null
  updated_at: string | null
  created_at: string
}

export interface Resource {
  id: string
  project_id: string
  category: string
  name: string
  description: string | null
  ai_summary: string | null
  tags: string[] | null
  image_url: string | null
  created_at: string
}

export interface AILog {
  id: string
  user_id: string
  project_id: string | null
  model: string
  mode: string | null
  prompt: string | null
  response: string | null
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost: number
  created_at: string
}

export interface Version {
  id: string
  chapter_id: string
  project_id: string
  title: string
  content: string
  word_count: number
  snapshot_type: 'manual' | 'auto' | 'pre_ai' | 'backup'
  created_at: string
}

export interface PromptTemplate {
  id: string
  user_id: string
  title: string
  content: string
  tags: string[] | null
  category: string | null
  is_favorite: boolean
  use_count: number
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  theme_preference: 'dark' | 'light' | 'system'
  created_at: string
  updated_at: string
}
