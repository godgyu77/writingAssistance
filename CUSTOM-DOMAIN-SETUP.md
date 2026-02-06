# 커스텀 도메인 설정 가이드

## 2️⃣ Supabase URL을 이쁜 도메인으로 변경하기

현재: `lvgyjdzuselxfhqxobbn.supabase.co`  
원하는 형태: `api.storyarch.com` 또는 `auth.storyarch.com`

---

## 🎯 방법 1: Supabase Custom Domain (Pro 플랜 이상)

### 필요 사항
- **Supabase Pro 플랜** ($25/월)
- 본인 소유의 도메인 (예: storyarch.com)

### 설정 방법

1. **Supabase 대시보드 접속**
   - https://supabase.com
   - 프로젝트 선택

2. **Settings → Custom Domains**
   - **Add custom domain** 클릭
   - 원하는 도메인 입력 (예: `api.storyarch.com`)

3. **DNS 설정**
   - 도메인 등록 업체(GoDaddy, Namecheap, Cloudflare 등)에서:
   ```
   Type: CNAME
   Name: api (또는 auth)
   Value: lvgyjdzuselxfhqxobbn.supabase.co
   ```

4. **SSL 인증서 자동 생성**
   - Supabase가 자동으로 SSL 인증서 생성 (Let's Encrypt)
   - 약 10-30분 소요

5. **코드 업데이트**
   - `.env.local` 수정:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://api.storyarch.com
   ```

---

## 🎯 방법 2: Reverse Proxy (무료, 복잡함)

### Cloudflare Workers 사용

자신의 도메인을 통해 Supabase API를 프록시:

**장점:**
- ✅ 무료
- ✅ 커스텀 도메인 사용 가능

**단점:**
- ❌ 설정이 복잡함
- ❌ 추가 관리 필요
- ❌ 레이턴시 증가 가능

### 간단 설정:
1. Cloudflare에 도메인 추가
2. Workers 스크립트로 프록시 설정
3. DNS 레코드 추가

---

## 🎯 방법 3: Vercel Custom Domain (가장 간단, 권장)

### 프론트엔드 도메인만 변경

**현재 상태:**
- 로그인 시 Supabase URL 노출: `lvgyjdzuselxfhqxobbn.supabase.co`

**해결:**
- 앱을 예쁜 도메인에 배포: `storyarch.com`
- 사용자는 `storyarch.com`만 보게 됨
- OAuth 리디렉션도 `storyarch.com/auth/callback`으로 설정

### 설정 방법

1. **Vercel에 배포**
   ```bash
   npm run build
   vercel --prod
   ```

2. **커스텀 도메인 추가**
   - Vercel 대시보드 → Settings → Domains
   - `storyarch.com` 추가
   - DNS 설정 (A 레코드 또는 CNAME)

3. **Supabase Redirect URI 업데이트**
   ```
   https://storyarch.com/auth/callback
   ```

4. **Google OAuth Redirect URI 업데이트**
   - Google Cloud Console에서:
   ```
   https://lvgyjdzuselxfhqxobbn.supabase.co/auth/v1/callback
   ```
   
   그대로 유지하되, **Homepage URL**을 변경:
   ```
   https://storyarch.com
   ```

---

## 💡 추천 방법 (무료 + 간단)

### 단계별 가이드

#### 1. 무료 도메인 받기 (선택사항)
- Freenom: https://www.freenom.com (무료 도메인)
- Cloudflare: https://www.cloudflare.com (도메인 구매)
- GoDaddy, Namecheap 등

#### 2. Vercel에 Next.js 앱 배포
```bash
# Vercel CLI 설치 (처음만)
npm i -g vercel

# 프로젝트 루트에서 실행
vercel

# 프로덕션 배포
vercel --prod
```

#### 3. Vercel에서 커스텀 도메인 연결
1. https://vercel.com → 프로젝트 선택
2. **Settings** → **Domains**
3. 도메인 입력 (예: `storyarch.com`)
4. DNS 설정 지시사항 따르기

#### 4. Supabase 설정 업데이트
- **Authentication** → **URL Configuration**
- **Site URL**: `https://storyarch.com`
- **Redirect URLs** 추가:
  ```
  https://storyarch.com/auth/callback
  ```

#### 5. Google OAuth 설정 업데이트
- Google Cloud Console
- **승인된 JavaScript 원본**:
  ```
  https://storyarch.com
  ```
- **승인된 리디렉션 URI** (기존 유지):
  ```
  https://lvgyjdzuselxfhqxobbn.supabase.co/auth/v1/callback
  ```

---

## 🎨 OAuth 화면 브랜딩 개선

### Google OAuth 동의 화면 커스터마이징

1. **Google Cloud Console** → **OAuth 동의 화면**

2. **앱 정보 설정:**
   - **앱 이름**: `StoryArch`
   - **앱 로고**: 업로드 (120x120px PNG)
   - **애플리케이션 홈페이지**: `https://storyarch.com`
   - **애플리케이션 개인정보처리방침**: `https://storyarch.com/privacy`
   - **서비스 약관**: `https://storyarch.com/terms`

3. **도메인 확인:**
   - **승인된 도메인**: `storyarch.com`
   - Google Search Console에서 도메인 소유권 확인 필요

이렇게 하면 사용자가 Google 로그인 시:
- ✅ "StoryArch가 로그인을 요청합니다" (이쁜 이름)
- ✅ 앱 로고 표시
- ✅ 신뢰할 수 있는 느낌

---

## 📋 요약 및 권장사항

### 현재 상황 (무료)
```
사용자가 보는 URL: lvgyjdzuselxfhqxobbn.supabase.co
→ 기술적으로 보임, 신뢰도 낮음
```

### 권장 (무료 or 저렴)
```
옵션 1: Vercel 무료 배포
→ storyarch.vercel.app (무료, 즉시 가능)

옵션 2: Vercel + 커스텀 도메인
→ storyarch.com ($10-15/년, 전문적)

옵션 3: Supabase Pro + 커스텀 도메인
→ api.storyarch.com ($25/월, 완전한 커스터마이징)
```

---

## 🚀 지금 당장 할 수 있는 것 (무료)

### 1. Vercel에 배포 (5분)
```bash
npm run build
npx vercel

# 나오는 URL: https://storyarch-xxx.vercel.app
```

### 2. Supabase 설정 업데이트
- **Site URL**: 위에서 받은 Vercel URL
- **Redirect URLs**: `https://storyarch-xxx.vercel.app/auth/callback`

### 3. Google OAuth 업데이트
- **Homepage URL**: Vercel URL로 변경

**결과:**
- ✅ 사용자는 더 이상 `lvgyjdzuselxfhqxobbn.supabase.co`를 보지 않음
- ✅ `storyarch-xxx.vercel.app`만 보임 (훨씬 나음!)
- ✅ 무료!

---

**추가 질문이나 도움이 필요하시면 알려주세요!** 🎯
