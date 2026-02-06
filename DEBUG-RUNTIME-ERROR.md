# runtime.lastError 오류 디버깅 가이드

## 🔍 오류 추적 방법

### 1. Chrome DevTools에서 정확한 출처 확인

1. **F12** → **Console** 탭 열기
2. 톱니바퀴(⚙️) 아이콘 클릭 → **Settings**
3. **Console** → **Show timestamps** 체크 (시간 확인)
4. **Console** → **Enable custom formatters** 체크

### 2. Stack Trace 확인

콘솔에서 오류 메시지를 클릭하면 **Stack Trace**가 나타납니다:
- 만약 `chrome-extension://`로 시작하는 경로가 보이면 → **확장 프로그램 문제**
- 만약 `localhost:3000`으로 시작하는 경로가 보이면 → **코드 문제**

### 3. 오류 발생 패턴 확인

**콘솔을 지운 후(Clear Console) 다음을 확인하세요:**

#### 테스트 1: 페이지 로드 직후
```
1. 페이지 새로고침 (F5)
2. 5초 동안 아무것도 하지 않음
3. 콘솔에 오류가 몇 개나 나타나는가?
```
- 0개: 정상
- 1-2개: 초기 로드 시 일회성 (무시 가능)
- **계속 증가**: 문제 있음 (아래 계속)

#### 테스트 2: 특정 액션 후
```
1. 콘솔 지우기 (Clear)
2. 다음 각각을 시도:
   - 로그인
   - 대시보드 이동
   - 에디터 페이지 이동
   - 텍스트 입력
3. 어느 액션에서 오류가 증가하는가?
```

## 🎯 해결 방법

### 방법 1: 시크릿 모드 테스트 ⭐ (가장 중요)

```bash
npm run dev
```

**Chrome 시크릿 모드** (Ctrl + Shift + N)로 http://localhost:3000 접속

**결과:**
- ✅ 오류 없음 → **확장 프로그램이 원인** (방법 2로 이동)
- ❌ 오류 계속 → **코드 문제** (방법 3으로 이동)

---

### 방법 2: 확장 프로그램 비활성화 (시크릿 모드에서 오류 없을 때)

#### Chrome 확장 프로그램 관리
1. 주소창에 `chrome://extensions/` 입력
2. 다음 확장 프로그램들을 **하나씩** 비활성화하며 테스트:

**가장 의심되는 확장 프로그램 순위:**
1. ⭐ **React Developer Tools** (99% 확률)
2. ⭐ **Redux DevTools**
3. **Grammarly**
4. **LastPass / 1Password / Bitwarden**
5. **AdBlock / uBlock Origin**
6. **Google Translate**
7. **Honey / 쿠팡 확장 프로그램**
8. 기타 페이지 수정 확장 프로그램

#### 해결 후
- 문제 확장 프로그램 발견 시:
  - 업데이트 확인
  - 또는 해당 확장만 비활성화하고 개발

---

### 방법 3: 코드 문제 (시크릿 모드에서도 오류 발생 시)

#### A. 오류 발생 시점 로그 추가

`app/page.tsx`에 다음 코드 추가:

```typescript
// Supabase Auth 상태 변화 감지
useEffect(() => {
  console.log('[DEBUG] Auth listener 등록')
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('[DEBUG] Auth 이벤트:', event)
      if (session?.user) {
        setAuth(session.user, session)
      } else {
        clearAuth()
      }
    }
  )

  return () => {
    console.log('[DEBUG] Auth listener 정리')
    subscription.unsubscribe()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

**콘솔 확인:**
- `[DEBUG] Auth listener 등록`이 여러 번 나타나면 → 컴포넌트가 여러 번 마운트됨
- `[DEBUG] Auth listener 정리`가 나타나지 않으면 → cleanup 문제

#### B. React Strict Mode 비활성화 (테스트용)

`app/layout.tsx` 수정:

```typescript
// 기존
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider ...>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**React 18의 Strict Mode는 개발 환경에서 useEffect를 2번 실행합니다.**
이것이 문제라면 프로덕션 빌드에서는 오류가 없을 것입니다.

---

### 방법 4: 브라우저 캐시/쿠키 완전 삭제

```
1. F12 → Application 탭
2. Storage → Clear site data
3. 페이지 새로고침
```

---

### 방법 5: 다른 브라우저 테스트

- **Firefox**: https://www.mozilla.org/firefox/
- **Edge**: Windows에 기본 설치됨
- **Safari** (Mac): 기본 브라우저

다른 브라우저에서 오류가 없으면 → Chrome 확장 프로그램 확정

---

## 📊 오류 리포트 작성

위 테스트 결과를 다음 형식으로 알려주세요:

```
1. 시크릿 모드 테스트: [O/X]
2. 오류 발생 시점: [페이지 로드 / 로그인 / 에디터 / 계속]
3. Stack Trace 출처: [chrome-extension / localhost / 기타]
4. 의심되는 확장 프로그램: [이름]
5. 다른 브라우저 테스트: [O/X] - [브라우저명]
```

---

## 🚨 알려진 이슈

### React DevTools + Supabase 조합
- **증상**: Supabase Auth 리스너와 React DevTools가 충돌
- **해결**: React DevTools 업데이트 또는 비활성화
- **관련 이슈**: https://github.com/facebook/react/issues/25432

### Chrome 브라우저 버전 문제
- **Chrome 120+ 버전**에서 일부 확장 프로그램 호환성 문제
- **해결**: Chrome 업데이트 확인

---

## ✅ 최종 체크리스트

- [ ] 시크릿 모드에서 테스트
- [ ] React DevTools 비활성화
- [ ] Redux DevTools 비활성화
- [ ] 비밀번호 관리자 확장 비활성화
- [ ] 광고 차단기 비활성화
- [ ] 브라우저 캐시 삭제
- [ ] 다른 브라우저에서 테스트
- [ ] Chrome 버전 확인 (chrome://version/)

---

**대부분의 경우 시크릿 모드에서 오류가 사라지면 확장 프로그램이 원인입니다!** 🎯
