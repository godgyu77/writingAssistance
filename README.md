# StoryArch (스토리아크)

AI 기반 웹소설 창작 플랫폼입니다.

## 🚀 주요 기능

- ✅ **PWA 지원:** 데스크톱 앱처럼 설치 가능
- ✅ **완전한 반응형:** 데스크톱, 태블릿, 모바일 최적화
- ✅ **다크 모드:** 눈에 편한 Zinc-950 테마
- ✅ **AI 통합:** OpenAI, Anthropic, Custom API 지원
- ✅ **실시간 통계:** 글자 수, 단어 수, 문단 수 자동 계산
- ✅ **자동 저장:** 30초마다 자동 저장
- ✅ **포커스 모드:** 집중 집필을 위한 Zen 모드
- ✅ **리소스 관리:** 세계관, 인물, 아이템, 플롯 체계적 관리

## 기술 스택

- **프레임워크:** Next.js 14+ (App Router)
- **언어:** TypeScript
- **스타일링:** Tailwind CSS + Shadcn UI + Lucide React (아이콘)
- **상태 관리:** Zustand (글 내용, 설정, 포커스 모드 관리)
- **PWA:** next-pwa (오프라인 지원, 앱 설치)
- **배포:** Vercel

## 디자인 시스템

- **테마:** 다크 모드 기본 (Dark Mode Default), `next-themes` 사용
- **스타일:** VS Code나 Notion처럼 집중하기 좋은 깔끔하고 모던한 IDE 스타일
- **레이아웃:** 메인 스튜디오는 반응형 3단 레이아웃 (좌-중-우)
- **스크롤바:** 얇고 눈에 띄지 않는 다크 테마 스타일 (8px, Zinc-700)
- **반응형:** 
  - Desktop (≥768px): 고정 사이드바
  - Mobile (<768px): 드로어(Drawer) 방식

## 설치된 Shadcn UI 컴포넌트

- Button
- Input
- Card
- Dialog
- Sheet
- Tabs
- Accordion
- Textarea
- ScrollArea
- DropdownMenu
- Switch
- Avatar
- Badge
- Progress
- Select

## 시작하기

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### 빌드

```bash
npm run build
```

### 프로덕션 모드 실행

```bash
npm start
```

## 프로젝트 구조

```
writing-assistance/
├── app/                    # Next.js App Router
│   ├── dashboard/         # 대시보드 페이지
│   │   └── page.tsx       # 작품 리스트 그리드
│   ├── studio/            # 메인 스튜디오
│   │   └── [id]/          # 동적 라우팅
│   │       └── page.tsx   # 3단 레이아웃 에디터 + Zustand 연동
│   ├── globals.css        # 전역 스타일 (다크 모드 설정)
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈 (랜딩) 페이지
├── components/            # React 컴포넌트
│   ├── ui/                # Shadcn UI 컴포넌트 (15개)
│   ├── LeftSidebar.tsx    # 좌측 사이드바 컴포넌트
│   ├── RightSidebar.tsx   # 우측 사이드바 컴포넌트
│   ├── ResourceModal.tsx  # 리소스 추가 모달
│   ├── ApiKeyModal.tsx    # API 키 설정 모달
│   └── theme-provider.tsx # 다크 모드 프로바이더
├── store/                 # Zustand 상태 관리
│   ├── useEditorStore.ts  # 에디터 스토어 (포커스 모드, 통계)
│   └── useSettingsStore.ts # 설정 스토어 (API 키, 사용량)
├── lib/                   # 유틸리티 함수
│   ├── mockData.ts        # 목업 데이터 (Novel 타입)
│   ├── resourceData.ts    # 리소스 데이터 (세계관, 인물, 아이템, 플롯)
│   └── utils.ts           # cn() 함수 등
├── public/                # 정적 파일
│   └── manifest.json      # PWA 매니페스트
└── ...설정 파일들
```

## 특징

- 🌙 다크 모드 기본 적용 (Zinc-950 배경)
- 📱 반응형 디자인
- ⚡ Next.js 14 App Router로 빠른 성능
- 🎨 Shadcn UI로 일관된 디자인 시스템
- 🔧 TypeScript로 타입 안정성 확보

## 구현된 페이지

### 홈 페이지 (`/`)
- 히어로 섹션과 주요 기능 소개
- 대시보드로 이동하는 CTA 버튼

### 대시보드 (`/dashboard`)
- **헤더:** 유저 프로필 아바타 + 설정 버튼
- **작품 그리드:** 반응형 카드 레이아웃 (1~4열)
- **새 작품 만들기 카드:** 점선 테두리의 눈에 띄는 디자인
- **작품 카드:**
  - 썸네일 이미지 (호버 시 확대 효과)
  - 제목과 장르 배지
  - 진행률 바 (Progress Bar)
  - 완료 챕터 / 전체 챕터
  - 마지막 수정일 (상대적 시간 표시)
  - 클릭 시 스튜디오로 이동
- **호버 애니메이션:** 살짝 떠오르는 효과 + 그림자

### 메인 스튜디오 (`/studio/[id]`)
**화면 꽉 찬(100vh) 3단 고정 레이아웃:**

#### 좌측 사이드바 (280px 고정)
**🆕 Tabs & Accordion 구조:**

##### 📑 챕터 탭
- **챕터 목록:** ScrollArea로 스크롤 가능
  - 새 챕터 만들기 버튼
  - 챕터 리스트 (제목 + 상태 배지)
  - 현재 선택된 챕터 하이라이트

##### ⚙️ 설정 탭
- **검색 바:** 리소스 검색 (Search 아이콘)
- **아코디언 메뉴 (4개 섹션):**
  
  1. **🌍 세계관 (World)**
     - [+] 추가 버튼 (헤더 우측)
     - 목업 데이터: 2개 (서재의 비밀, 달의 왕국)
     - 각 항목: 이름, AI 요약, 태그 배지
  
  2. **👤 인물 (Characters)**
     - [+] 추가 버튼
     - 목업 데이터: 3개 (주인공, 미스터리한 방문자, 시간의 수호자)
     - 각 항목: 이름, AI 요약, 태그 배지
  
  3. **💎 아이템 (Items)**
     - [+] 추가 버튼
     - 목업 데이터: 2개 (은빛 열쇠, 시간의 모래시계)
     - 각 항목: 이름, AI 요약, 태그 배지
  
  4. **📖 플롯 (Plot)**
     - [+] 추가 버튼
     - 목업 데이터: 3개 (첫 만남, 은빛 열쇠의 발견, 시간의 수호자 등장)
     - 각 항목: 이름, AI 요약, 태그 배지

**리소스 카드 특징:**
- 호버 시 배경색 변경
- ChevronRight 아이콘 (상세 보기 암시)
- 태그 배지 표시
- 1줄 말줄임 (line-clamp-1)

**🆕 리소스 추가 모달 (ResourceModal):**
- Dialog 컴포넌트 사용
- **입력 필드:**
  - 이름 (Input)
  - 태그 (Input + 추가 버튼, X 버튼으로 제거)
  - 상세 설명 (Textarea, 100px 높이)
  - AI용 한 줄 요약 (Input)
- **제출/취소 버튼**
- 리소스 타입별 아이콘과 제목 표시

#### 중앙 에디터 (flex-1, 유동적)
- **상단 툴바:**
  - 현재 챕터 정보 (제목 + 상태)
  - 자동 저장 상태 배지
  - 미리보기 / 저장 버튼
- **에디터 영역:**
  - 챕터 제목 입력
  - 본문 textarea (최소 600px 높이)
  - Prose 스타일 (읽기 편한 타이포그래피)
  - ScrollArea로 스크롤
- **하단 상태바:**
  - 단어 수, 글자 수, 문단 수
  - 마지막 저장 시간

#### 우측 사이드바 (320px 고정)
**🆕 Tabs 구조 (3개 탭):**

##### 🤖 AI 도구 탭
**API 키 상태 표시:**
- ✅ 연결 상태 인디케이터 (초록/빨강 점)
- ✅ "API 연결됨" / "API 키 없음" 텍스트
- ✅ 설정 버튼 (API 키 모달 열기)

**사용량 표시:**
- ✅ 보라색 배경 카드
- ✅ Zap 아이콘
- ✅ "오늘 사용 토큰: 1.2K" 형식 (자동 포맷)

**AI 모드 선택 (Select):**
- ✍️ 이어 쓰기
- ✨ 문체 교정
- 🎨 묘사 강화
- 💬 대화 개선
- 📖 플롯 제안

**프롬프트 입력:**
- Textarea (100px 높이)
- Placeholder: "AI에게 구체적인 지시사항..."
- 예시 텍스트 표시

**AI 실행 버튼:**
- 보라색 배경 (`bg-purple-600`)
- 큰 높이 (h-11)
- Sparkles 아이콘
- 로딩 상태 ("처리 중...")
- API 키 없으면 비활성화

**빠른 작업:**
- 다음 내용 제안
- 문체 개선
- 배경 묘사 추가
- 클릭 시 모드/프롬프트 자동 설정

##### 📜 히스토리 탭
- 빈 상태 메시지
- (향후 AI 실행 이력 표시)

##### 📝 메모장 탭
- 자유 형식 Textarea
  - 글자 수 표시

## 🆕 PWA (Progressive Web App)

### 설정
- ✅ **next-pwa** 통합
- ✅ Service Worker 자동 생성
- ✅ 오프라인 캐싱
- ✅ manifest.json 설정

### 매니페스트 정보
```json
{
  "name": "StoryArch - 스토리아크",
  "short_name": "StoryArch",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#09090b"
}
```

### 설치 방법
1. Chrome/Edge: 주소창 우측 설치 아이콘
2. iOS Safari: 공유 → 홈 화면에 추가
3. Android Chrome: 메뉴 → 앱 설치

## 🆕 반응형 디자인

### 데스크톱 (≥768px)
```
┌────────┬─────────────┬────────┐
│ 280px  │   flex-1    │ 320px  │
│ Left   │   Center    │ Right  │
│ (고정)  │   (유동)     │ (고정)  │
└────────┴─────────────┴────────┘
```

### 모바일 (<768px)
```
┌──────────────────────────────┐
│ [☰] Title        [✨]        │ ← 햄버거 메뉴
├──────────────────────────────┤
│                              │
│      Center Editor           │
│        (전체)                 │
│                              │
└──────────────────────────────┘

[☰] 클릭 → 좌측 Sheet (Drawer)
[✨] 클릭 → 우측 Sheet (Drawer)
```

### 모바일 기능
- ✅ 햄버거 메뉴로 좌측 사이드바 접근
- ✅ Sparkles 버튼으로 우측 AI 도구 접근
- ✅ Sheet(Drawer) 컴포넌트 사용
- ✅ 제목 텍스트 truncate (150px)
- ✅ 데스크톱 버튼들 숨김 (`hidden md:flex`)
- ✅ 4px 얇은 스크롤바 (모바일)

## 🆕 커스텀 스크롤바 스타일

```css
/* 데스크톱 */
width: 8px
color: #3f3f46 (Zinc-700)
hover: #52525b (Zinc-600)
border-radius: 4px

/* 모바일 */
width: 4px (더 얇게)
```

### 특징
- ✅ 얇고 눈에 띄지 않음
- ✅ 다크 테마 일관성
- ✅ Hover 시 밝아짐
- ✅ Firefox 지원 (`scrollbar-width: thin`)
- ✅ Webkit 브라우저 지원
- 로컬 상태로 관리

**레이아웃 특징:**
- Flex 레이아웃으로 중앙만 유동적 확장
- 각 영역 독립적으로 스크롤
- Border로 명확한 영역 구분 (Zinc-800)
- 100vh로 화면 꽉 참

**🎯 새로운 기능: Zustand & 포커스 모드**

#### Zustand 에디터 스토어
- **상태 관리:**
  - `title`: 챕터 제목
  - `content`: 본문 내용
  - `isFocusMode`: 포커스 모드 여부
  - `wordCount`, `characterCount`, `paragraphCount`: 실시간 통계
  - `lastSaved`: 마지막 저장 시간
  - `isAutoSaving`: 저장 중 상태

- **액션:**
  - `setTitle()`, `setContent()`: 에디터 내용 업데이트
  - `toggleFocusMode()`: 포커스 모드 토글
  - `saveContent()`: 저장 (시뮬레이션)
  - `updateStatistics()`: 통계 수동 업데이트

- **자동 기능:**
  - 실시간 통계 계산 (입력 시마다)
  - 30초마다 자동 저장
  - LocalStorage에 상태 저장 (persist)

#### 🆕 설정 스토어 (useSettingsStore)
- **API 키 관리:**
  - `apiKey`: API 키 저장 (LocalStorage)
  - `apiProvider`: 제공자 선택 (OpenAI, Anthropic, Custom)
  - `setApiKey()`, `clearApiKey()`: 키 저장/삭제
  
- **사용량 추적:**
  - `tokensUsedToday`: 오늘 사용한 토큰 수
  - `lastResetDate`: 마지막 초기화 날짜
  - `incrementTokenUsage()`: 토큰 증가
  - `checkAndResetTokens()`: 날짜 체크 후 자동 초기화
  
- **자동 저장 설정:**
  - `autoSave`: 자동 저장 활성화 여부
  - `autoSaveInterval`: 저장 주기 (초)

- **유틸리티:**
  - `validateApiKey()`: 키 유효성 검사 (제공자별)
  - `formatTokenCount()`: 토큰 수 포맷 (1.2K, 2.5M)

#### 🆕 API 키 모달 (ApiKeyModal)
**기능:**
- ✅ 앱 최초 진입 시 API 키 없으면 자동 표시
- ✅ `required` prop으로 필수 입력 강제
- ✅ ESC/배경 클릭 방지 (필수 모드)

**입력 필드:**
1. **API 제공자 선택 (Select)**
   - OpenAI (GPT-4, GPT-3.5)
   - Anthropic (Claude)
   - Custom API

2. **API 키 입력 (Input)**
   - 비밀번호 타입
   - 실시간 유효성 검사
   - ✓ 초록 체크 (유효)
   - ✗ 빨간 X (무효)

**안내:**
- 제공자별 키 형식 안내
- API 키 발급 링크
- 로컬 저장 안내 메시지

**에러 처리:**
- 빈 값 체크
- 형식 유효성 검사
- 에러 메시지 표시

#### 포커스 모드 (Zen Mode)
- **활성화 방법:** 상단 툴바의 "눈 아이콘(Eye)" 버튼 클릭
- **효과:**
  - 좌/우 사이드바 숨김 (`w-0`, `overflow-hidden`)
  - 중앙 에디터 최대 폭 확대 (4xl → 5xl)
  - 부드러운 애니메이션 (`transition-all duration-300`)
- **목적:** 집중 집필 환경 제공

#### 실시간 통계
- **하단 상태바 표시:**
  - 단어 수 (공백 기준 분리)
  - 글자 수 (공백 포함)
  - 문단 수 (빈 줄 기준 구분)
  - 마지막 저장 시간 (상대적 시간)
