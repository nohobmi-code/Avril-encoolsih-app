# Avril Encoolish — 앱

4–6세 아이들을 위한 영어 수업 **Avril Encoolish**의 아이·어머님·선생님용 앱입니다.
Expo(React Native) 한 벌의 코드로 **iOS · Android · Web**에서 같은 화면이 돌고, 계정·영상·수업노트는
**Supabase** 서버에 저장됩니다.

- 종이 `#FAF7F2` · 인쇄 흑 `#1C1A17` · 클레이 `#A4572F` · 세이지 `#5A6B5C`
- 활자: Fraunces(라틴 세리프) · Inter(라틴 산세리프) · 한글은 기기 세리프/산세리프
- 둥근 박스·알약 배지를 쓰지 않고, 헤어라인과 여백으로 나눈 편집 디자인

---

## 1. 지금 되는 것

| 모드 | 화면 | 내용 |
| --- | --- | --- |
| Kids | 오늘의 소리 | 파닉스 단어 카드 3장(누르면 영어 발음 재생), 3문항 미니 퀴즈, 스탬프 적립 |
| Parent | 로그인 | 어머님이 **발급받은 아이디·비밀번호**를 직접 입력. 어떤 아이가 있는지 화면에 드러나지 않음 |
| Parent | 환영 | 로그인 직후 “안녕, ○○야!” 문구와 별빛·링·페이드 업 애니메이션 |
| Parent | 수업 영상 | 그 아이의 수업 영상만. 비공개 버킷의 **서명 URL**로 재생(4시간) |
| Parent | 수업노트 | 날짜별 노트 — 오늘의 주제, 관찰, 오늘의 표현, 집에서 5분 미션 |
| Teacher | 스튜디오 | **선생님 계정 로그인 필수**. 아이 방 목록 · 새 학생 등록 · 방 삭제 · 비밀번호 변경 |
| Teacher | 아이 전용 방 | 실제 영상 파일 업로드 + 주제·핵심 단어·관찰·미션 작성 → 저장하면 그 아이 계정에만 반영 |

## 2. 서버 (Supabase)

프로젝트: `nohobmi-code's Project` (조직 `Avril Encoolish`, 리전 서울)

| 항목 | 값 |
| --- | --- |
| Project URL | `https://iyfdrtxssoicxscxkjak.supabase.co` |
| 공개 키 | `sb_publishable_di7PSW9RHymmxMOo5UzIKA_ADfqMCLc` (`src/lib/supabase.ts`) |

> `service_role`/secret 키는 앱에 넣지 않습니다. 앱이 가진 것은 공개 키뿐이고, 실제 권한은 전부 아래 RLS가 결정합니다.

### 테이블

- `students` — 아이. `name`, `age_label`, `parent_username`(unique)
- `profiles` — 계정. `id`(auth.users), `role`(`teacher`/`parent`), `username`(unique), `student_id`
- `lessons` — 수업 기록. `student_id`, `lesson_date`, `title`, `summary`, `homework`, `video_path`, `words[]`

### 보안 정책 (모두 `enable row level security`)

| 테이블 | teacher | parent |
| --- | --- | --- |
| `students` | 전체 SELECT/INSERT/UPDATE/DELETE | 자기 `profiles.student_id` 1건만 SELECT |
| `lessons` | 전체 CRUD | 자기 아이의 것만 SELECT |
| `profiles` | SELECT/INSERT/DELETE | 자기 프로필 1건만 SELECT |
| `storage.objects` (`lesson-videos`, private) | 업로드·수정·삭제·서명 URL | `{내 student_id}/…` 경로만 서명 URL |

- `profiles`에는 **UPDATE 권한 자체를 주지 않았습니다.** 부모 계정이 스스로 `role`을 `teacher`로 올릴 수 없습니다.
- `profiles` INSERT는 선생님만 가능합니다. 계정을 만드는 쪽은 Teacher Studio 하나뿐입니다.
- `is_teacher()` · `my_student_id()`는 `security definer` 함수라 정책 안에서 재귀 없이 동작합니다.
- `delete_avril_account(username, force)` — 방을 지울 때 어머님 계정도 함께 정리하는 함수. `force=false`는 프로필이 없는 빈 계정만 지웁니다.

## 3. 계정

### 선생님 (보미 님)

| 아이디 | 비밀번호 |
| --- | --- |
| `avril` | `avril2026!` |

Teacher Studio → 아래쪽 **TEACHER ACCOUNT → 선생님 비밀번호 변경**에서 바로 바꿀 수 있습니다.

### 어머님 계정 만들기

Teacher Studio → **＋ 새 학생 등록** → 아이 이름 · 나이/반 · 어머님 아이디 · 비밀번호를 넣으면
그 자리에서 계정이 만들어집니다(이메일 인증 없이 바로 로그인). **아이디와 비밀번호는 어머님께 직접 전해 주세요.**
앱 어디에도 아이 목록이나 아이디 예시가 나오지 않습니다.

- 아이디는 영문 소문자·숫자 3~24자(예: `jiwoo2026`), 비밀번호는 6자 이상.
- 같은 아이디로 이미 계정이 있으면 “이미 사용 중인 아이디”로 막힙니다.
- 방을 지우면 그 아이의 영상·노트·어머님 계정이 함께 정리되어, 같은 아이디로 다시 만들 수 있습니다.

### Supabase Auth 설정

- **Authentication → Sign In / Providers → Email → Confirm email: 꺼짐** (아이디를 만들면 바로 로그인)
- 아이디는 내부적으로 `<아이디>@avril.local` 이메일로 저장됩니다.

## 4. 실행 · 배포

```bash
npm install
npx expo start            # Expo Go로 폰에서 보기
npx expo start --web      # 브라우저에서 보기
npx expo export --platform web   # dist/ 빌드 (baseUrl = /Avril-encoolsih-app)
```

**라이브: https://nohobmi-code.github.io/Avril-encoolsih-app/**

`work/deploy_pages.sh`가 빌드 → `main` push → `dist/`를 `gh-pages`에 force push까지 합니다.

```bash
REPO=nohobmi-code/Avril-encoolsih-app bash work/deploy_pages.sh
```

## 5. 구조

```
App.tsx                      폰트 로딩 · 화면 라우터(세션에 따라 잠금) · 안전영역/최대 폭 프레임
src/lib/supabase.ts          Supabase 클라이언트 + 아이디→이메일 규칙 + 일회용 signUp 클라이언트
src/lib/api.ts               로그인·학생 등록/삭제·수업노트·영상 업로드·서명 URL·비밀번호 변경
src/store.tsx                세션/프로필/아이 컨텍스트, 날짜·단어 뜻 유틸
src/types.ts                 Profile / Student / Lesson / Screen
src/theme.ts                 색·활자·여백 토큰
src/components/ui.tsx        헤어라인, 라벨, 입력, 탭, 버튼, 장식, 콜로폰
src/screens/Entry.tsx        진입(세 개의 방) + 손그림 하트 로고
src/screens/Login.tsx        어머님 로그인 / 선생님 로그인 (모드 전환)
src/screens/Welcome.tsx      “안녕, ○○야!” 샤랄라 애니메이션
src/screens/Parent.tsx       수업 영상(서명 URL 재생) / 수업노트
src/screens/Teacher.tsx      스튜디오 — 아이 방 목록, 새 학생 등록, 계정 관리
src/screens/TeacherRoom.tsx  아이 전용 방 — 영상 업로드 + 노트 작성 + 지난 기록 + 방 삭제
src/screens/Kids.tsx         아이 모드(단어 카드·퀴즈·스탬프)
```

### 영상

- 업로드 경로: `lesson-videos/{student_id}/{timestamp}.{ext}` (비공개 버킷, 500MB까지)
- 웹: 숨은 `<input type="file" accept="video/*">`로 파일 선택 → `storage.upload`
- iOS/Android: `expo-image-picker` 갤러리/카메라 → RN FormData 업로드
- 재생: 웹은 `<video>`, 앱은 `expo-video`. 모두 `createSignedUrl`로 받은 4시간짜리 URL을 씁니다.

## 6. 남은 일 / 메모

- 선생님 비밀번호는 첫 로그인 뒤 바꿔 두세요.
- 무료 플랜 한도: Storage 1GB · MAU 50,000. 수업 영상은 1인당 몇 편씩 쌓이므로 용량을 가끔 확인하세요.
- 앱스토어 배포(`eas build`/`eas submit`)는 아직 하지 않았습니다. 웹 링크로 먼저 쓰고 있습니다.
- 개인정보 처리방침·아동 데이터 취급은 스토어 제출 전에 정리해야 합니다.
