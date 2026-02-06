# 소셜 로그인 (OAuth) 설정 가이드
## Google OAuth

## 오류 해결
`{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}` 오류는 Supabase에서 OAuth 공급자(Google)가 활성화되지 않았을 때 발생합니다.

---

## 🔧 Supabase OAuth 설정 방법

### 1️⃣ Supabase 대시보드 접속
1. https://supabase.com 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Authentication** → **Providers** 클릭

---

## 🔵 Google OAuth 설정

### Step 1: Google Cloud Console 설정
1. https://console.cloud.google.com 접속
2. 프로젝트 선택 (또는 새로 생성)
3. **API 및 서비스** → **사용자 인증 정보** 클릭
4. **+ 사용자 인증 정보 만들기** → **OAuth 2.0 클라이언트 ID** 선택
5. 애플리케이션 유형: **웹 애플리케이션** 선택
6. 이름: `StoryArch` (원하는 이름)
7. **승인된 리디렉션 URI** 추가:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   ```
   > 예시: `https://abcdefghijklmn.supabase.co/auth/v1/callback`
   
   **Supabase Project Ref 찾는 방법:**
   - Supabase 대시보드 → Settings → API
   - URL 섹션에서 `Project URL` 확인
   - `https://abcdefghijklmn.supabase.co` 에서 `abcdefghijklmn` 부분이 Project Ref

8. **만들기** 클릭
9. **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사

### Step 2: Supabase에 Google 설정 추가
1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Google** 찾아서 클릭
3. **Enable Sign in with Google** 토글 활성화
4. 복사한 정보 입력:
   - **Client ID (for OAuth)**: Google에서 복사한 클라이언트 ID
   - **Client Secret (for OAuth)**: Google에서 복사한 클라이언트 보안 비밀번호
5. **Save** 클릭

---

## ⚙️ 개발 환경 추가 설정 (localhost)

### 로컬 개발용 리디렉션 URL 추가

Supabase는 기본적으로 `localhost`를 허용하지만, 명시적으로 추가하려면:

1. Supabase 대시보드 → **Authentication** → **URL Configuration**
2. **Redirect URLs** 섹션에 추가:
   ```
   http://localhost:3000/auth/callback
   ```
3. **Site URL** 확인:
   - 개발: `http://localhost:3000`
   - 배포: 실제 도메인 (예: `https://storyarch.vercel.app`)

---

## 🧪 테스트 방법

### 1. 개발 서버 실행
```bash
npm run dev
```

### 2. 브라우저에서 테스트
1. http://localhost:3000 접속
2. **Google로 시작하기** 버튼 클릭
3. OAuth 동의 화면에서 권한 승인
4. 자동으로 `/dashboard`로 리디렉션되는지 확인

### 3. 문제 해결
- 브라우저 개발자 도구 (F12) → Console 탭에서 오류 확인
- Supabase 대시보드 → **Authentication** → **Users**에서 사용자 생성 확인

---

## 📝 체크리스트

- [ ] Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
- [ ] 승인된 리디렉션 URI 추가
- [ ] Supabase에서 Google Provider 활성화
- [ ] Client ID 및 Client Secret 입력
- [ ] 로컬에서 테스트

---

## 🚨 자주 발생하는 오류

### 1. "Unsupported provider: provider is not enabled"
**원인:** Supabase에서 해당 Provider가 활성화되지 않음  
**해결:** 위의 설정 단계를 따라 Provider 활성화

### 2. "redirect_uri_mismatch"
**원인:** Google에 등록한 Redirect URI와 실제 요청 URI가 다름  
**해결:** Supabase Project Ref를 정확히 확인하고 다시 입력

### 3. "Access denied"
**원인:** OAuth App 승인 대기 중 또는 잘못된 Client Secret  
**해결:** Client ID/Secret 재확인 및 재생성

### 4. 로그인 후 리디렉션 실패
**원인:** `/auth/callback` 라우트가 제대로 작동하지 않음  
**해결:** `app/auth/callback/route.ts` 파일 확인

---

## 📚 추가 참고 자료

- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 설정](https://developers.google.com/identity/protocols/oauth2)

---

## 🎯 빠른 설정 (임시 테스트용)

소셜 로그인 없이 먼저 테스트하려면, 이메일 로그인만 사용하세요:

1. Supabase 대시보드 → **Authentication** → **Email Auth** 확인 (기본 활성화됨)
2. 로그인 페이지에서 이메일/비밀번호로 회원가입 및 로그인
3. 소셜 로그인 버튼은 나중에 설정 완료 후 사용

---

**설정 완료 후 다시 테스트해주세요!** 🚀
