# Avril Encoolish — 앱 (MVP)

4–6세 영유·국제학교 입학 준비 수업 **Avril Encoolish**의 학부모·아이·선생님용 앱 첫 작동 버전입니다.
Expo(React Native) 한 벌의 코드로 **iOS · Android · Web**에서 같은 화면이 돕니다.

- 아이디어북 색: 종이 `#FAF7F2` · 인쇄 흑 `#1C1A17` · 클레이 `#A4572F` · 세이지 `#5A6B5C`
- 활자: Fraunces(라틴 세리프) · Inter(라틴 산세리프) · 한글은 기기 세리프/산세리프(AppleMyungjo, Noto Serif CJK)
- 둥근 박스·알약 배지를 쓰지 않고, 헤어라인과 여백으로 나눈 편집 디자인

---

## 1. 지금 되는 것

| 모드 | 화면 | 내용 |
| --- | --- | --- |
| Kids | 오늘의 소리 | 파닉스 단어 카드 3장(누르면 영어 발음 재생), 3문항 미니 퀴즈, 스탬프 적립 |
| Parent | 로그인 | 아이별 고유 아이디 로그인(`yulli` / `minhyuk`, 데모 비밀번호 `2026`). 계정이 다르면 다른 아이의 기록은 열리지 않음 |
| Parent | 환영 | 로그인 직후 “안녕, 율리야!” 문구와 별빛·링·페이드 업 애니메이션(약 3.2초 뒤 자동 진입, 탭하면 바로) |
| Parent | 수업 영상 | 날짜별 수업 영상 목록, 플레이어(올린 영상은 실제 재생, 없으면 인쇄물풍 모의 플레이어), 이 날의 노트로 이동 |
| Parent | 수업노트 | 날짜별 노트 펼치기 — 오늘의 주제, 보미 선생님의 성향·강점 관찰, 오늘 배운 표현, 집에서 5분 미션 |
| Teacher | 스튜디오 | 아이 방 선택 |
| Teacher | 아이 전용 방 | 그날의 수업 영상 선택/촬영 업로드 + 주제·핵심 단어·관찰·미션 작성 → 저장하면 **그 아이 계정에만** 즉시 반영 |

데이터는 아이(`yulli`, `minhyuk`)별로 완전히 분리되어 있고, 어머님 화면은 로그인한 아이의 노트·영상만 읽습니다.
선생님이 올린 기록도 그 아이의 방에만 쌓입니다.

## 2. 실행

```bash
npm install
npx expo start            # QR을 iPhone/Android Expo Go로 스캔
npx expo start --web      # 브라우저에서 바로 보기
```

- iPhone: App Store에서 **Expo Go** 설치 → 터미널의 QR 스캔(카메라 앱) → 같은 Wi‑Fi에서 열립니다.
- Android: Play 스토어 Expo Go → Expo Go 앱 안에서 QR 스캔.
- 웹 빌드 확인: `npx expo export --platform web` → `dist/` (이 폴더를 정적 호스팅하면 그대로 배포됩니다).

### 웹 라이브 링크 (GitHub Pages)

아이폰 사파리에서 바로 열리는 주소입니다.

**https://nohobmi-code.github.io/Avril-Encoolsih-app/**

`gh-pages` 브랜치의 빌드 산출물이 그대로 서빙됩니다. 화면을 고친 뒤 다시 올릴 때:

```bash
npx expo export --platform web            # app.json experiments.baseUrl = "/Avril-Encoolsih-app"
touch dist/.nojekyll
git clone --branch main . /tmp/pages && cd /tmp/pages
git checkout --orphan gh-pages && git rm -rq --cached . && find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a <원본>/dist/. . && git add -A -f && git commit -m "Deploy web build"
git push -f origin gh-pages
```

### 데모 계정

| 아이디 | 아이 | 비밀번호 |
| --- | --- | --- |
| `yulli` | 율리 · 5세 | `2026` |
| `minhyuk` | 민혁 · 5세 | `2026` |

로그인 화면 아래 데모 계정을 누르면 바로 들어갑니다.

## 3. 구조

```
App.tsx                      폰트 로딩 · 화면 라우터(상태 기반) · 안전영역/최대 폭 프레임
src/theme.ts                 색·활자·여백 토큰
src/types.ts                 Child / Lesson / Note / Screen 타입
src/store.tsx                아이별 데이터와 publish(아이 방에 올리기) 상태
src/components/ui.tsx        헤어라인, 라벨, 입력, 탭, 버튼, 장식(마름모·별), 콜로폰
src/screens/Entry.tsx        진입(세 개의 방) + 손그림 하트 로고
src/screens/Login.tsx        어머님 계정 로그인
src/screens/Welcome.tsx      “안녕, 율리야!” 샤랄라 애니메이션
src/screens/Parent.tsx       수업 영상 / 수업노트 두 카테고리
src/screens/Teacher.tsx      선생님 스튜디오(아이 방 목록)
src/screens/TeacherRoom.tsx  아이 전용 방 — 영상 업로드 + 노트 작성 + 전달
src/screens/Kids.tsx         아이 모드(단어 카드·퀴즈·스탬프)
assets/                      앱 아이콘·스플래시·손그림 하트 로고
```

### 영상 업로드

- 웹: `expo-image-picker`가 파일 선택창(`accept="video/*"`)을 엽니다.
- iOS/Android: 갤러리 선택과 카메라 촬영을 모두 지원합니다(권한 문구는 `app.json`의 `infoPlist`·`permissions`에 있음).
- 올린 영상은 `expo-video` 플레이어로 어머님 화면에서 바로 재생됩니다.

### 지금은 메모리 상태입니다

MVP라 계정·영상·노트는 앱이 켜져 있는 동안 메모리에 있습니다(새로고침하면 처음 상태로 돌아갑니다).
실서비스에서는 다음만 바꾸면 됩니다.

1. 로그인: 아이디/비밀번호 인증을 서버(Supabase, Firebase 등)로. 지금의 `DEMO_PASSWORD` 상수 제거.
2. 영상: `expo-image-picker`가 준 로컬 uri를 스토리지에 업로드하고, `Lesson.videoUri`에 원격 URL 저장.
3. 노트: `publish()` 안에서 서버에 저장하고, 어머님 화면은 서버에서 읽기. 접근 권한은 아이 단위로 제한.

## 4. 출시 절차 요약

1. **계정 정리** — `app.json`의 `ios.bundleIdentifier` / `android.package`는 `com.avrilencoolish.app`으로 이미 지정되어 있습니다. 실제 배포 전 그대로 쓸지 확정합니다.
2. **EAS 로그인/초기화**
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```
3. **빌드**
   ```bash
   eas build --platform ios       # TestFlight용 .ipa
   eas build --platform android   # .aab
   ```
4. **제출**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```
   - App Store: App Store Connect에 앱 생성 → 스크린샷(6.7", 6.5", 5.5") · 설명 · 개인정보 처리방침 URL → 심사 제출. 아이 영상이 오가는 앱이므로 **개인정보 처리방침과 아동 데이터 취급**을 먼저 정리해야 합니다.
   - Google Play: Play Console에 앱 생성 → 데이터 보안 양식 · 콘텐츠 등급 · 아동 대상 앱 정책 → 내부 테스트 트랙부터.
5. **웹 배포(선택)** — 이미 GitHub Pages(`https://nohobmi-code.github.io/Avril-Encoolsih-app/`)에 올라가 있습니다. 앱스토어 배포와 별개로, `dist/`를 Netlify·Vercel·S3에 올려 별도 링크로 쓸 수도 있습니다.

## 5. 화면 캡처

`downloads/`에 390×844 모바일 뷰포트로 캡처한 화면이 있습니다.

- `avril-app-entry.png` — 진입(로고·세 개의 방)
- `avril-app-login.png` — 어머님 로그인
- `avril-app-welcome.png` — “안녕, 율리야!” 환영 연출
- `avril-app-parent-video.png` — 수업 영상
- `avril-app-parent-note.png` — 수업노트
- `avril-app-teacher.png` — 선생님 스튜디오
- `avril-app-teacher-room.png` / `-bottom.png` / `-done.png` — 아이 전용 방, 작성 하단, 올린 뒤
- `avril-app-parent-note-after-publish.png` — 올린 노트가 어머님 계정에 반영된 화면
- `avril-app-kids.png` — 아이 모드
- `avril-app-screens.png` — 아홉 화면을 한 장으로 모은 시트
