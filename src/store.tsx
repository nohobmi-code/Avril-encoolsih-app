import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, loadAccount, signIn as apiSignIn, signOut as apiSignOut } from './lib/api';
import { supabase } from './lib/supabase';
import { Profile, Student } from './types';

export { todayISO } from './lib/api';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
export const koreanDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}월 ${d}일 ${WEEK[date.getDay()]}요일`;
};
export const shortDate = (iso: string) => iso.slice(5).replace('-', '.');

/** 수업노트의 KEY WORDS에 붙는 한국어 뜻. 사전에 없으면 빈 칸으로 둔다. */
const WORDS: Record<string, string> = {
  cat: '고양이', hat: '모자', map: '지도', red: '빨강', blue: '파랑', green: '초록',
  happy: '기쁜', sad: '슬픈', sun: '태양', moon: '달', dog: '강아지', bus: '버스',
  cup: '컵', bed: '침대', pen: '펜', seed: '씨앗', grow: '자라다', sat: '앉았다',
  tap: '톡톡 치다', morning: '아침', night: '밤', book: '책', ball: '공', apple: '사과',
};
export const meaningOf = (word: string) => WORDS[word.trim().toLowerCase()] ?? '';

type StoreValue = {
  /** 첫 세션 확인이 끝났는지 */
  ready: boolean;
  profile: Profile | null;
  /** 어머님 계정이면 그 아이 */
  student: Student | null;
  error: string;
  signIn: (username: string, password: string) => Promise<Profile>;
  signOut: () => Promise<void>;
  /** 아이 등록·수정 뒤 계정 정보를 다시 읽는다. */
  reload: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState('');

  const apply = useCallback(async (quiet = false) => {
    const account = await loadAccount().catch(() => null);
    setProfile(account?.profile ?? null);
    setStudent(account?.student ?? null);
    if (!quiet && !account) setError('');
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await apply(true);
      if (alive) setReady(true);
    })();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!alive) return;
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setStudent(null);
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void apply(true);
      }
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [apply]);

  const signIn = useCallback(async (username: string, password: string) => {
    setError('');
    try {
      const account = await apiSignIn(username, password);
      setProfile(account.profile);
      setStudent(account.student);
      return account.profile;
    } catch (e) {
      throw new ApiError(e instanceof ApiError ? e.message : '로그인하지 못했습니다.');
    }
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setProfile(null);
    setStudent(null);
  }, []);

  const reload = useCallback(async () => {
    await apply(true);
  }, [apply]);

  const value = useMemo(
    () => ({ ready, profile, student, error, signIn, signOut, reload }),
    [ready, profile, student, error, signIn, signOut, reload],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const v = useContext(StoreContext);
  if (!v) throw new Error('StoreProvider 안에서만 쓸 수 있습니다.');
  return v;
}
