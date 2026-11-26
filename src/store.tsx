import React, { createContext, useCallback, useContext, useMemo, useEffect } from 'react';
import { Child, ChildId, Lesson, Note } from './types';

/** 데모 공통 비밀번호. 실제 서비스에서는 서버 인증으로 대체한다. */
export const DEMO_PASSWORD = '2026';

const WORDS: Record<string, string> = {
  cat: '고양이',
  hat: '모자',
  map: '지도',
  red: '빨강',
  blue: '파랑',
  happy: '기쁜',
  sun: '태양',
  dog: '강아지',
  bus: '버스',
  cup: '컵',
  bed: '침대',
  pen: '펜',
};

export const meaningOf = (word: string) => WORDS[word.trim().toLowerCase()] ?? '';

export const todayISO = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
export const koreanDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}월 ${d}일 ${WEEK[date.getDay()]}요일`;
};
export const shortDate = (iso: string) => iso.slice(5).replace('-', '.');

const seedLessons = (id: ChildId): Lesson[] =>
  id === 'yulli'
    ? [
        {
          id: 'yl-1126',
          date: '2026-11-26',
          title: 'Colors & Feelings',
          duration: '11:24',
          note: {
            topic: 'Colors & Feelings — red · blue · happy',
            comment:
              '율리는 색을 고를 때 이유를 먼저 말합니다. “빨강은 화난 색이야”라고 말한 뒤 스스로 웃었고, 그 장면에서 감정 어휘를 색과 함께 익히는 길이 보였습니다. 문장이 막힐 때 세 박자만 기다려 주면 끝까지 말해 냅니다.',
            words: ['red', 'blue', 'happy'],
            expressions: [
              { en: 'red', ko: '빨강' },
              { en: 'blue', ko: '파랑' },
              { en: 'happy', ko: '기쁜' },
            ],
            mission:
              '저녁 식탁에서 오늘 하루를 세 가지 색으로 골라 보세요. “Today was blue.”처럼 짧게 말해 보는 것만으로 충분합니다. 부모님도 같은 색을 하나 골라 주세요.',
          },
        },
        {
          id: 'yl-1124',
          date: '2026-11-24',
          title: 'Story — The Little Seed',
          duration: '09:52',
          note: {
            topic: 'Story — The Little Seed',
            comment:
              '이야기를 들려줄 때 손으로 씨앗을 심는 시늉을 스스로 만들어 냈어요. 몸으로 기억하는 아이입니다. 다음 시간에는 “grow”를 함께 움직여 보겠습니다.',
            words: ['seed', 'grow'],
            expressions: [
              { en: 'seed', ko: '씨앗' },
              { en: 'grow', ko: '자라다' },
            ],
            mission: '화분 하나를 함께 보며 "Grow, grow!"를 세 번 말해 보세요.',
          },
        },
        {
          id: 'yl-1121',
          date: '2026-11-21',
          title: 'Circle Time — My Day',
          duration: '12:10',
          note: {
            topic: 'Circle Time — My Day',
            comment:
              '아침 인사를 혼자서 먼저 꺼냈습니다. 어제 배운 “Good morning”을 스스로 쓴 첫 장면이었어요.',
            words: ['morning', 'night'],
            expressions: [
              { en: 'Good morning', ko: '좋은 아침' },
              { en: 'Good night', ko: '잘 자' },
            ],
            mission: '잠들기 전에 아이가 "Good night"을 먼저 말해 보게 해 주세요.',
          },
        },
      ]
    : [
        {
          id: 'mh-1126',
          date: '2026-11-26',
          title: 'Short a — cat · hat · map',
          duration: '13:05',
          note: {
            topic: 'Short a — cat · hat · map',
            comment:
              '민혁이는 처음 듣는 소리도 입 모양을 먼저 살피고 따라 했습니다. “cat”을 세 번 반복하는 동안 시선이 흔들리지 않았고, 스스로 “a” 소리를 찾아내더군요. 틀려도 다시 해보는 힘이 좋아서 다음 주에는 문장으로 늘려가도 좋겠습니다.',
            words: ['cat', 'hat', 'map'],
            expressions: [
              { en: 'cat', ko: '고양이' },
              { en: 'hat', ko: '모자' },
              { en: 'map', ko: '지도' },
            ],
            mission:
              '소파 위에 그림 카드 세 장을 숨겨 두고, 아이가 “cat!” 하고 외치면 찾아오는 놀이를 5분만 해 주세요. 소리를 몸으로 익히는 시간입니다.',
          },
        },
        {
          id: 'mh-1124',
          date: '2026-11-24',
          title: 'Phonics — s · a · t',
          duration: '10:38',
          note: {
            topic: 'Phonics — s · a · t',
            comment:
              '세 소리를 이어 붙이는 데 집중했어요. “s-a-t”를 천천히 말한 뒤 혼자 “sat”이라고 완성했습니다.',
            words: ['sat', 'tap'],
            expressions: [
              { en: 'sat', ko: '앉았다' },
              { en: 'tap', ko: '톡톡 치다' },
            ],
            mission: '의자에 앉으며 “sat”, 책상을 톡톡 치며 “tap”을 함께 말해 보세요.',
          },
        },
      ];

const initialChildren = (): Record<ChildId, Child> => ({
  yulli: {
    id: 'yulli',
    name: '율리',
    nameEn: 'Yulli',
    age: '5세',
    account: 'yulli',
    teacherLine: '색을 고를 때 이유를 먼저 말하는 아이',
    lessons: seedLessons('yulli'),
  },
  minhyuk: {
    id: 'minhyuk',
    name: '민혁',
    nameEn: 'Minhyuk',
    age: '5세',
    account: 'minhyuk',
    teacherLine: '소리를 몸으로 익히는 아이',
    lessons: seedLessons('minhyuk'),
  },
});

type Publishing = { note: Note; videoUri?: string; videoName?: string; duration?: string };

type StoreValue = {
  children: Record<ChildId, Child>;
  /** 선생님이 아이 방에 오늘의 영상과 노트를 올린다. 그 아이 계정에만 반영된다. */
  publish: (childId: ChildId, payload: Publishing) => Lesson;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [childrenMap, setChildrenMap] = React.useState<Record<ChildId, Child>>(initialChildren);

  // 데모 화면이 언제나 '오늘'을 가리키도록 날짜만 맞춰 둔다.
  useEffect(() => {
    setChildrenMap((prev) => {
      const t = todayISO();
      const next = { ...prev };
      (Object.keys(next) as ChildId[]).forEach((id) => {
        next[id] = { ...next[id], lessons: next[id].lessons.map((l, i) => (i === 0 ? { ...l, date: t } : l)) };
      });
      return next;
    });
  }, []);

  const publish = useCallback((childId: ChildId, payload: Publishing) => {
    const date = todayISO();
    const lesson: Lesson = {
      id: `${childId}-${Date.now()}`,
      date,
      title: payload.note.topic,
      duration: payload.duration ?? '12:00',
      videoUri: payload.videoUri,
      videoName: payload.videoName,
      note: payload.note,
    };
    setChildrenMap((prev) => {
      const child = prev[childId];
      const rest = child.lessons.filter((l) => l.date !== date);
      return { ...prev, [childId]: { ...child, lessons: [lesson, ...rest] } };
    });
    return lesson;
  }, []);

  const value = useMemo(() => ({ children: childrenMap, publish }), [childrenMap, publish]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const v = useContext(StoreContext);
  if (!v) throw new Error('StoreProvider 안에서만 쓸 수 있습니다.');
  return v;
}
