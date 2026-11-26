/** 서버(Supabase)에서 오는 자료의 형태. */

export type Role = 'teacher' | 'parent';

export type Profile = {
  id: string;
  role: Role;
  username: string;
  student_id: string | null;
  created_at?: string;
};

export type Student = {
  id: string;
  name: string;
  age_label: string | null;
  parent_username: string;
  created_at?: string;
};

export type SignupStatus = 'pending' | 'approved' | 'rejected';

/** 어머님이 직접 보낸 가입 신청 — 선생님이 승인해야 아이 방이 열린다. */
export type SignupRequest = {
  id: string;
  user_id: string;
  child_name: string;
  age_label: string | null;
  username: string;
  status: SignupStatus;
  student_id: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type Lesson = {
  id: string;
  student_id: string;
  /** 2026-11-26 형태 — Postgres date */
  lesson_date: string;
  title: string;
  summary: string | null;
  homework: string | null;
  video_path: string | null;
  words: string[] | null;
  created_at?: string;
};

export type Screen =
  | { name: 'entry' }
  | { name: 'kids' }
  | { name: 'login'; mode: Role }
  | { name: 'signup' }
  | { name: 'pending'; request?: SignupRequest }
  | { name: 'welcome' }
  | { name: 'parent' }
  | { name: 'teacher' }
  | { name: 'teacherRoom'; studentId: string };
