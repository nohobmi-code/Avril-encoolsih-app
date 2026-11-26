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
  | { name: 'welcome' }
  | { name: 'parent' }
  | { name: 'teacher' }
  | { name: 'teacherRoom'; studentId: string };
