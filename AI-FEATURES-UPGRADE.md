# AI 기능 고도화 완료

## ✅ 구현된 기능

### 1. 선택 영역(Selection) 문맥 전송
- 에디터에서 텍스트 드래그 시 `selectedText`와 `surroundingText` 자동 추출
- AI API에 선택 영역 + 앞뒤 200자 문맥 전송
- 선택된 텍스트는 우측 사이드바에 파란색 카드로 표시

### 2. 토큰 사용량 추적 및 저장
- **Supabase `ai_logs` 테이블 생성**
  - `user_id`, `project_id`, `model`, `mode`, `prompt`, `response`
  - `input_tokens`, `output_tokens`, `total_tokens`, `cost`
  - `created_at`
- AI 응답 시 토큰 사용량 자동 기록
- 대략적인 비용 계산 (OpenAI, Claude, Gemini 각각 다른 요금)
- **우측 사이드바에 이번 달 사용량 표시**
  - 이번 달 총 토큰 수
  - 이번 달 총 비용 (USD)

### 3. AI 히스토리 및 다중 버전 생성
- **히스토리 탭**: 과거 AI 요청/응답을 카드 형태로 표시
  - 모델, 모드, 토큰 수, 생성 시간 표시
  - 각 히스토리 항목마다 "채택" 또는 "삭제" 버튼
  - 채택 버튼 클릭 시 에디터에 바로 삽입
- **다중 버전 생성 기능**
  - "생성 버전 수" 입력란 추가 (1-5개)
  - 여러 버전 생성 시 병렬로 요청 전송
  - 각 버전마다 독립적인 카드로 표시
  - 원하는 버전 선택하여 채택 가능
- 복사, 채택 버튼으로 간편한 UX

## 📁 수정/추가된 파일

1. **`supabase-ai-logs-schema.sql`** (신규)
   - `ai_logs` 테이블 생성 스키마
   - RLS 정책 및 인덱스 포함

2. **`lib/types/database.ts`**
   - `AILog` 인터페이스 추가

3. **`store/useEditorStore.ts`**
   - `selectedText`, `selectionStart`, `selectionEnd` 상태 추가
   - `setSelection` 액션 추가

4. **`app/api/ai/generate/route.ts`**
   - `selectedText`, `surroundingText`, `generateCount` 파라미터 추가
   - 토큰 사용량 추적 및 `ai_logs` 테이블에 저장
   - `saveAILog` 함수 구현
   - OpenAI, Claude, Gemini 각각 토큰 정보 추출
   - 대략적인 비용 계산 로직 추가

5. **`components/RightSidebar.tsx`**
   - 완전히 재작성하여 고급 기능 추가
   - 선택 영역 표시 카드
   - 이번 달 사용량 표시 (토큰 + 비용)
   - 생성 버전 수 입력
   - 다중 버전 생성 및 표시
   - 히스토리 탭 구현 (로드, 채택, 삭제)
   - 각 결과마다 "채택" 및 "복사" 버튼

6. **`app/studio/[id]/page.tsx`**
   - `textarea`에 `onSelect` 이벤트 추가
   - 텍스트 선택 시 자동으로 스토어에 저장

## 🎯 사용 방법

### Supabase 테이블 생성
1. Supabase 프로젝트의 SQL Editor 열기
2. `supabase-ai-logs-schema.sql` 파일의 내용을 복사
3. SQL Editor에 붙여넣기 후 실행

### AI 사용 예시
1. 에디터에서 텍스트 드래그하여 선택
2. 우측 사이드바에서 작업 모드 선택 (문체 교정, 이어쓰기 등)
3. 프롬프트 입력
4. "생성 버전 수"를 3으로 설정
5. "AI 실행하기 (3개)" 버튼 클릭
6. 3개의 버전이 생성되면 원하는 버전 선택하여 "채택"

### 히스토리 확인
1. 우측 사이드바 → "히스토리" 탭 클릭
2. 과거 AI 요청 내역 확인
3. 원하는 항목의 "채택" 버튼으로 에디터에 재삽입

### 사용량 확인
- 우측 사이드바 상단에 이번 달 총 토큰 수와 비용(USD) 표시
- 각 히스토리 항목에도 토큰 수 표시

## 🔧 기술 세부사항

- **토큰 추적**: OpenAI, Claude, Gemini 각각 API 응답에서 토큰 정보 추출
- **비용 계산**: 2024년 2월 기준 각 모델의 대략적인 요금 적용
- **선택 영역 문맥**: 선택 영역 앞뒤 200자씩 추출하여 AI에 전달
- **다중 버전 생성**: `Promise.all`을 사용한 병렬 요청
- **히스토리 저장**: 모든 AI 요청/응답 자동 저장, RLS로 보안
