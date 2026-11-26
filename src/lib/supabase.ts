import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

/**
 * Avril Encoolish 서버 (Supabase).
 * 여기에는 공개 키(publishable)만 둔다. service_role·secret 키는 앱에 넣지 않는다.
 * 실제 권한은 전부 DB의 RLS 정책이 결정한다.
 */
export const SUPABASE_URL = 'https://iyfdrtxssoicxscxkjak.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_di7PSW9RHymmxMOo5UzIKA_ADfqMCLc';

/** 아이디는 내부 이메일로 바뀌어 저장된다. 어머님·선생님은 아이디만 입력한다. */
export const EMAIL_DOMAIN = 'avril.local';
export const emailFor = (username: string) => `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

const isWeb = Platform.OS === 'web';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: isWeb,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'avril-encoolish-auth',
  },
});

/**
 * 새 아이(어머님) 계정을 만들 때만 쓰는 일회용 클라이언트.
 * 세션을 저장하지 않으므로 선생님이 로그인한 상태가 끊기지 않는다.
 */
export function createSignupClient() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      // 저장소를 아예 쓰지 않는다 (탭 간 세션 공유도 일어나지 않는다).
      storage: {
        getItem: async () => null,
        setItem: async () => undefined,
        removeItem: async () => undefined,
      },
    },
  });
}
