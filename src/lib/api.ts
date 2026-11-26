import { createSignupClient, emailFor, supabase } from './supabase';
import { Lesson, KidsWord, Profile, SignupRequest, Student } from '../types';

export const BUCKET = 'lesson-videos';
export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,23}$/;
export const MIN_PASSWORD = 6;

export class ApiError extends Error {}

const fail = (message: string): never => {
  throw new ApiError(message);
};

/** 서버가 준 영어 메시지를 선생님·어머님이 읽을 수 있는 문장으로 바꾼다. */
const authMessage = (raw?: string | null) => {
  const m = (raw ?? '').toLowerCase();
  if (m.includes('invalid login credentials')) return '아이디 또는 비밀번호가 맞지 않습니다.';
  if (m.includes('email not confirmed')) return '이 계정은 아직 이메일 확인이 끝나지 않았습니다.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return '이미 사용 중인 아이디입니다. 다른 아이디로 정해 주세요.';
  if (m.includes('password')) return `비밀번호는 ${MIN_PASSWORD}자 이상으로 정해 주세요.`;
  if (m.includes('rate limit')) return '잠시 뒤에 다시 시도해 주세요. (요청이 너무 많습니다)';
  if (m.includes('failed to fetch') || m.includes('network'))
    return '연결이 잠시 불안정합니다. 잠시 뒤 다시 시도해 주세요.';
  return '처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
};

export const todayISO = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const loadStudent = async (studentId: string | null): Promise<Student | null> => {
  if (!studentId) return null;
  const { data } = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
  return (data as Student) ?? null;
};

export type Account = {
  /** 승인 전 어머님은 프로필이 아직 없다. */
  profile: Profile | null;
  student: Student | null;
  /** 승인 대기·거절된 가입 신청 1건 (있을 때만) */
  pending: SignupRequest | null;
};

/** 지금 로그인한 계정의 프로필(과 어머님이면 아이), 아직 승인 전이면 신청 상태를 읽는다. */
export async function loadAccount(): Promise<Account | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return null;
  if (profile) {
    const p = profile as Profile;
    return {
      profile: p,
      student: p.role === 'parent' ? await loadStudent(p.student_id) : null,
      pending: null,
    };
  }

  // 프로필이 없으면 가입 신청 한 줄만 확인할 수 있다. (RLS: 본인 것 1건)
  const { data: request } = await supabase
    .from('signup_requests')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return { profile: null, student: null, pending: (request as SignupRequest) ?? null };
}

export async function signIn(username: string, password: string): Promise<Account> {
  const uname = username.trim().toLowerCase();
  if (!uname || !password) fail('아이디와 비밀번호를 적어 주세요.');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailFor(uname),
    password,
  });
  if (error) fail(authMessage(error.message));

  const account = await loadAccount();
  if (!account || (!account.profile && !account.pending)) {
    await supabase.auth.signOut();
    fail('이 계정은 아직 아이 정보와 연결되지 않았습니다. 선생님께 문의해 주세요.');
  }
  return account as Account;
}

/* ───────── 어머님 직접 가입 (선생님 승인제) ───────── */

/** 가입 전에 아이디가 비어 있는지 확인한다. (이미 쓰는 아이디면 false) */
export async function usernameAvailable(username: string): Promise<boolean> {
  const uname = username.trim().toLowerCase();
  if (!USERNAME_RE.test(uname)) return false;
  const { data, error } = await supabase.rpc('username_available', { p_username: uname });
  if (error) return true; // 확인이 실패하면 가입 단계에서 다시 걸러진다.
  return data !== false;
}

/**
 * 어머님이 직접 가입한다.
 * 계정을 만들고 「선생님 승인 대기」 신청 한 줄을 남긴다. 승인 전에는 아무 자료도 열리지 않는다.
 */
export async function requestParentSignup(input: {
  childName: string;
  ageLabel: string;
  username: string;
  password: string;
}): Promise<SignupRequest> {
  const childName = input.childName.trim();
  const ageLabel = input.ageLabel.trim();
  const uname = input.username.trim().toLowerCase();

  if (!childName) fail('아이 이름을 적어 주세요.');
  if (!USERNAME_RE.test(uname))
    fail('사용할 아이디는 영문 소문자·숫자로 3~24자입니다. (예: mina2026)');
  if (input.password.length < MIN_PASSWORD) fail(`비밀번호는 ${MIN_PASSWORD}자 이상으로 정해 주세요.`);

  if (!(await usernameAvailable(uname)))
    fail('이미 사용 중인 아이디입니다. 다른 아이디로 정해 주세요.');

  // 새 계정은 일회용 클라이언트에서 만든다 (로그인 화면의 세션과 섞이지 않게).
  const signup = createSignupClient();
  const created = await signup.auth.signUp({ email: emailFor(uname), password: input.password });

  if (created.error && /already/i.test(created.error.message)) {
    // 가입 도중 끊겨 남은 빈 계정이면 같은 비밀번호로 이어서 신청한다.
    const again = await signup.auth.signInWithPassword({ email: emailFor(uname), password: input.password });
    if (again.error) fail('이미 사용 중인 아이디입니다. 다른 아이디로 정해 주세요.');
  } else if (created.error) {
    fail(authMessage(created.error.message));
  }

  const { data, error } = await signup.rpc('submit_signup_request', {
    p_child_name: childName,
    p_age_label: ageLabel || null,
  });

  if (error || !data) {
    // 신청을 남기지 못했으면 방금 만든 빈 계정도 지워 아이디를 다시 쓸 수 있게 한다.
    await signup.rpc('cancel_my_signup');
    if (error?.code === '23505')
      fail('이미 사용 중인 아이디입니다. 다른 아이디로 정해 주세요.');
    fail(authMessage(error?.message));
  }

  return data as SignupRequest;
}

/* ───────── 선생님: 가입 승인 ───────── */

export async function listSignupRequests(): Promise<SignupRequest[]> {
  const { data, error } = await supabase
    .from('signup_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) fail('가입 신청을 불러오지 못했습니다.');
  return (data ?? []) as SignupRequest[];
}

/** 승인 — 아이 방(students)과 어머님 프로필이 함께 열린다. */
export async function approveSignup(requestId: string): Promise<string> {
  const { data, error } = await supabase.rpc('approve_signup_request', { p_request_id: requestId });
  if (error) {
    if (error.code === '23505')
      fail('같은 아이디의 방이 이미 있습니다. 어머님 아이디를 확인해 주세요.');
    fail('승인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
  }
  return data as string;
}

export async function rejectSignup(requestId: string) {
  const { error } = await supabase.rpc('reject_signup_request', { p_request_id: requestId });
  if (error) fail('거절하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function changePassword(password: string) {
  if (password.length < MIN_PASSWORD) fail(`비밀번호는 ${MIN_PASSWORD}자 이상으로 정해 주세요.`);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) fail(authMessage(error.message));
}

/* ───────── 선생님 ───────── */

export type StudentRow = Student & { lessonCount: number; lastDate: string | null };

export async function listStudents(): Promise<StudentRow[]> {
  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) fail('아이 목록을 불러오지 못했습니다.');

  const { data: lessons } = await supabase
    .from('lessons')
    .select('student_id, lesson_date')
    .order('lesson_date', { ascending: false });

  const stat = new Map<string, { n: number; last: string | null }>();
  (lessons ?? []).forEach((l: any) => {
    const cur = stat.get(l.student_id) ?? { n: 0, last: null };
    cur.n += 1;
    if (!cur.last || l.lesson_date > cur.last) cur.last = l.lesson_date;
    stat.set(l.student_id, cur);
  });

  return ((students ?? []) as Student[]).map((s) => ({
    ...s,
    lessonCount: stat.get(s.id)?.n ?? 0,
    lastDate: stat.get(s.id)?.last ?? null,
  }));
}

export async function getStudent(studentId: string): Promise<Student | null> {
  return loadStudent(studentId);
}

export async function createStudent(input: {
  name: string;
  ageLabel: string;
  username: string;
  password: string;
}): Promise<Student> {
  const name = input.name.trim();
  const uname = input.username.trim().toLowerCase();
  const ageLabel = input.ageLabel.trim();

  if (!name) fail('아이 이름을 적어 주세요.');
  if (!USERNAME_RE.test(uname))
    fail('어머님 아이디는 영문 소문자·숫자로 3~24자입니다. (예: mina2026)');
  if (input.password.length < MIN_PASSWORD) fail(`비밀번호는 ${MIN_PASSWORD}자 이상으로 정해 주세요.`);

  // 1) 아이 정보 — 아이디 중복을 여기서 먼저 잡는다.
  const { data: student, error: sErr } = await supabase
    .from('students')
    .insert({ name, age_label: ageLabel || null, parent_username: uname })
    .select()
    .single();
  if (sErr) {
    if (sErr.code === '23505') fail('이미 사용 중인 아이디입니다. 다른 아이디로 정해 주세요.');
    fail('아이 정보를 저장하지 못했습니다.');
  }

  // 2) 어머님 계정 — 별도 클라이언트로 만들어 선생님 로그인을 건드리지 않는다.
  const signup = createSignupClient();
  let created = await signup.auth.signUp({ email: emailFor(uname), password: input.password });

  // 방을 지우고 같은 아이디로 다시 만들 때, 남아 있던 빈 계정을 정리하고 한 번 더 시도한다.
  // (프로필이 살아 있는 진짜 계정은 건드리지 않는다)
  if (created.error && /already/i.test(created.error.message)) {
    const { data: live } = await supabase.from('profiles').select('id').eq('username', uname).maybeSingle();
    if (!live) {
      await supabase.rpc('delete_avril_account', { p_username: uname, p_force: false });
      created = await signup.auth.signUp({ email: emailFor(uname), password: input.password });
    }
  }

  if (created.error || !created.data?.user) {
    await supabase.from('students').delete().eq('id', (student as Student).id);
    if (created.error && /already/i.test(created.error.message))
      fail('이미 사용 중인 아이디입니다. 다른 아이디로 정해 주세요.');
    fail(authMessage(created.error?.message));
  }

  // 3) 계정 ↔ 아이 연결 (선생님만 가능)
  const { error: pErr } = await supabase.from('profiles').insert({
    id: created!.data!.user!.id,
    role: 'parent',
    username: uname,
    student_id: (student as Student).id,
  });

  if (pErr) {
    await supabase.from('students').delete().eq('id', (student as Student).id);
    fail('계정은 만들어졌지만 아이 정보 연결에 실패했습니다. 같은 아이디로 다시 시도해 주세요.');
  }

  return student as Student;
}

export async function deleteStudent(studentId: string) {
  const { data: student } = await supabase
    .from('students')
    .select('parent_username')
    .eq('id', studentId)
    .maybeSingle();

  // 영상 파일 먼저 지운다 (경로: {student_id}/…)
  const { data: files } = await supabase.storage.from(BUCKET).list(studentId);
  if (files?.length) {
    await supabase.storage.from(BUCKET).remove(files.map((f) => `${studentId}/${f.name}`));
  }

  const { error } = await supabase.from('students').delete().eq('id', studentId);
  if (error) fail('아이 방을 지우지 못했습니다.');

  // 남은 어머님 계정도 함께 정리한다. (프로필 FK cascade · 선생님만 호출 가능)
  const username = (student as { parent_username?: string } | null)?.parent_username;
  if (username) {
    await supabase.rpc('delete_avril_account', { p_username: username, p_force: true });
  }
}

/* ───────── 수업 기록 ───────── */

export async function listLessons(studentId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('student_id', studentId)
    .order('lesson_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) fail('수업 기록을 불러오지 못했습니다.');
  return (data ?? []) as Lesson[];
}

export async function createLesson(input: {
  studentId: string;
  title: string;
  summary: string;
  homework: string;
  words: string[];
  videoPath: string | null;
}): Promise<Lesson> {
  if (!input.title.trim()) fail('오늘의 주제를 적어 주세요.');
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      student_id: input.studentId,
      lesson_date: todayISO(),
      title: input.title.trim(),
      summary: input.summary.trim() || null,
      homework: input.homework.trim() || null,
      words: input.words,
      video_path: input.videoPath,
    })
    .select()
    .single();
  if (error) fail('수업 기록을 저장하지 못했습니다.');
  return data as Lesson;
}

export async function uploadVideo(studentId: string, file: Blob | File, filename: string): Promise<string> {
  const ext = (filename.split('.').pop() ?? 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const path = `${studentId}/${Date.now()}.${ext}`;
  const type = (file as File).type || `video/${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: type,
    upsert: false,
  });
  if (error) {
    if (/exceeded the maximum allowed size/i.test(error.message))
      fail('영상이 너무 큽니다. 500MB 이하로 올려 주세요.');
    fail('영상을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
  }
  return path;
}

/** 앱(네이티브)에서 고른 영상 — RN FormData 업로드 */
export async function uploadVideoNative(
  studentId: string,
  uri: string,
  filename: string,
  mime: string,
): Promise<string> {
  const ext = (filename.split('.').pop() ?? 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const path = `${studentId}/${Date.now()}.${ext}`;
  const form = new FormData();
  form.append('file', { uri, name: filename, type: mime } as any);
  const { error } = await supabase.storage.from(BUCKET).upload(path, form as any, { upsert: false });
  if (error) fail('영상을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
  return path;
}

/* ───────── Kids Play 단어장 ───────── */

/** 서버를 못 읽을 때(로그인 전 오프라인 등) 아이 화면이 쓰는 기본 3단어. */
export const DEFAULT_KIDS_WORDS: KidsWord[] = [
  { id: 'default-cat', word: 'cat', ko: '고양이', ipa: '/kæt/', sort_order: 1 },
  { id: 'default-hat', word: 'hat', ko: '모자', ipa: '/hæt/', sort_order: 2 },
  { id: 'default-map', word: 'map', ko: '지도', ipa: '/mæp/', sort_order: 3 },
];

/**
 * 아이 화면(Kids)용 — 로그인 전에도 읽을 수 있다.
 * 서버가 없거나 조회가 실패하면 null. (화면은 기본 단어로 넘어간다)
 */
export async function loadKidsWords(): Promise<KidsWord[] | null> {
  try {
    const { data, error } = await supabase
      .from('kids_words')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) return null;
    return (data ?? []) as KidsWord[];
  } catch {
    return null;
  }
}

/** 선생님용 — 편집할 단어 목록. 실패는 화면에 보여 줄 메시지로 알린다. */
export async function listKidsWords(): Promise<KidsWord[]> {
  const { data, error } = await supabase
    .from('kids_words')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) fail('단어 목록을 불러오지 못했습니다.');
  return (data ?? []) as KidsWord[];
}

export type KidsWordInput = { word: string; ko: string; ipa: string };

const checkKidsWord = (input: KidsWordInput) => {
  const word = input.word.trim();
  const ko = input.ko.trim();
  const ipa = input.ipa.trim();
  if (!word) fail('영어 단어를 적어 주세요.');
  if (word.length > 40) fail('영어 단어는 40자 안으로 적어 주세요.');
  if (!ko) fail('뜻을 적어 주세요.');
  if (ko.length > 60) fail('뜻은 60자 안으로 적어 주세요.');
  if (ipa.length > 40) fail('발음기호는 40자 안으로 적어 주세요.');
  return { word, ko, ipa };
};

export async function createKidsWord(input: KidsWordInput): Promise<KidsWord> {
  const v = checkKidsWord(input);
  const { data: last } = await supabase
    .from('kids_words')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 1;
  const { data, error } = await supabase
    .from('kids_words')
    .insert({ word: v.word, ko: v.ko, ipa: v.ipa, sort_order: nextOrder })
    .select()
    .single();
  if (error) fail('단어를 저장하지 못했습니다.');
  return data as KidsWord;
}

export async function updateKidsWord(id: string, input: KidsWordInput): Promise<KidsWord> {
  const v = checkKidsWord(input);
  const { data, error } = await supabase
    .from('kids_words')
    .update({ word: v.word, ko: v.ko, ipa: v.ipa })
    .eq('id', id)
    .select()
    .single();
  if (error) fail('단어를 수정하지 못했습니다.');
  return data as KidsWord;
}

export async function deleteKidsWord(id: string) {
  const { error } = await supabase.from('kids_words').delete().eq('id', id);
  if (error) fail('단어를 삭제하지 못했습니다.');
}

/** 비공개 버킷의 영상은 서명 URL로만 열린다. (4시간) */
export async function videoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 4);
  if (error || !data?.signedUrl) fail('영상을 열지 못했습니다.');
  return data!.signedUrl;
}
