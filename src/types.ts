/** 아이 계정·수업 기록의 기본 형태. 계정은 아이 한 명과 1:1로 묶인다. */
export type ChildId = 'yulli' | 'minhyuk';

export type Expression = { en: string; ko: string };

export type Note = {
  topic: string;
  comment: string;
  words: string[];
  expressions: Expression[];
  mission: string;
};

export type Lesson = {
  id: string;
  /** 2026-11-26 형태 */
  date: string;
  title: string;
  /** 12:40 형태 */
  duration: string;
  /** 선생님이 올린 영상의 uri. 없으면 모의 플레이어로 보여준다. */
  videoUri?: string;
  videoName?: string;
  note: Note;
};

export type Child = {
  id: ChildId;
  /** 화면에 보이는 이름 */
  name: string;
  nameEn: string;
  age: string;
  /** 어머님 계정 아이디 (비밀번호는 데모 공통) */
  account: string;
  teacherLine: string;
  lessons: Lesson[];
};

export type Screen =
  | { name: 'entry' }
  | { name: 'kids' }
  | { name: 'login' }
  | { name: 'welcome'; childId: ChildId }
  | { name: 'parent'; childId: ChildId }
  | { name: 'teacher' }
  | { name: 'teacherRoom'; childId: ChildId };
