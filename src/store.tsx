import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Account,
  ApiError,
  loadAccount,
  requestParentSignup,
  signIn as apiSignIn,
  signOut as apiSignOut,
} from './lib/api';
import { emailFor, supabase } from './lib/supabase';
import { Profile, SignupRequest, Student } from './types';

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
  /** 선생님 승인을 기다리는(또는 거절된) 가입 신청 */
  pending: SignupRequest | null;
  error: string;
  signIn: (username: string, password: string) => Promise<Account>;
  /** 어머님 직접 가입 — 계정을 만들고 승인 신청을 남긴다. */
  signUp: (input: {
    childName: string;
    ageLabel: string;
    username: string;
    password: string;
  }) => Promise<SignupRequest>;
  signOut: () => Promise<void>;
  /** 아이 등록·수정·승인 뒤 계정 정보를 다시 읽는다. */
  reload: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [pending, setPending] = useState<SignupRequest | null>(null);
  const [error, setError] = useState('');

  const apply = useCallback(async (quiet = false) => {
    const account = await loadAccount().catch(() => null);
    setProfile(account?.profile ?? null);
    setStudent(account?.student ?? null);
    setPending(account?.pending ?? null);
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
        setPending(null);
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
      setPending(account.pending);
      return account;
    } catch (e) {
      throw new ApiError(e instanceof ApiError ? e.message : '로그인하지 못했습니다.');
    }
  }, []);

  const signUp = useCallback(
    async (input: { childName: string; ageLabel: string; username: string; password: string }) => {
      const request = await requestParentSignup(input);
      setPending(request);
      // 신청 직후에는 그 계정으로 로그인해 대기 화면이 앱을 다시 열어도 이어지게 한다.
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailFor(request.username),
          password: input.password,
        });
        if (!signInError) await apply(true);
      } catch {
        /* 로그인까지 되지 않아도 신청은 접수된 상태 — 화면이 신청 내용을 그대로 보여 준다. */
      }
      return request;
    },
    [apply],
  );

  const signOut = useCallback(async () => {
    await apiSignOut();
    setProfile(null);
    setStudent(null);
    setPending(null);
  }, []);

  const reload = useCallback(async () => {
    await apply(true);
  }, [apply]);

  const value = useMemo(
    () => ({ ready, profile, student, pending, error, signIn, signUp, signOut, reload }),
    [ready, profile, student, pending, error, signIn, signUp, signOut, reload],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const v = useContext(StoreContext);
  if (!v) throw new Error('StoreProvider 안에서만 쓸 수 있습니다.');
  return v;
}
