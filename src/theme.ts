import { Platform } from 'react-native';

/**
 * Avril Encoolish — 인쇄물에서 출발한 화면.
 * 종이(따뜻한 미색), 인쇄 흑, 클레이 포인트, 세이지 그린. 둥근 박스·알약 배지는 쓰지 않는다.
 */
const isWeb = Platform.OS === 'web';

export const C = {
  paper: '#FAF7F2',
  paperShade: '#F4EFE6',
  ink: '#1C1A17',
  ink70: 'rgba(28,26,23,0.72)',
  ink55: 'rgba(28,26,23,0.55)',
  ink40: 'rgba(28,26,23,0.40)',
  rule: 'rgba(28,26,23,0.15)',
  ruleStrong: 'rgba(28,26,23,0.38)',
  clay: '#A4572F',
  claySoft: 'rgba(164,87,47,0.10)',
  sage: '#5A6B5C',
};

/**
 * 라틴 활자는 Fraunces(serif) / Inter(sans)를 앱에 포함해 쓴다.
 * 한글은 별도 서체로 분리한다. (iOS AppleMyungjo·Apple SD Gothic Neo, 안드로이드 serif/sans-serif)
 */
export const F = {
  serif: isWeb ? '"Fraunces_300Light", "Noto Serif CJK KR", serif' : 'Fraunces_300Light',
  serifItalic: isWeb
    ? '"Fraunces_300Light_Italic", "Noto Serif CJK KR", serif'
    : 'Fraunces_300Light_Italic',
  serifMedium: isWeb ? '"Fraunces_400Regular", "Noto Serif CJK KR", serif' : 'Fraunces_400Regular',
  sans: isWeb ? '"Inter_400Regular", "Noto Sans CJK KR", sans-serif' : 'Inter_400Regular',
  sansMedium: isWeb ? '"Inter_500Medium", "Noto Sans CJK KR", sans-serif' : 'Inter_500Medium',
  krSerif: isWeb ? '"Noto Serif CJK KR", serif' : Platform.OS === 'ios' ? 'AppleMyungjo' : 'serif',
  krSans: isWeb
    ? '"Noto Sans CJK KR", sans-serif'
    : Platform.OS === 'ios'
      ? 'Apple SD Gothic Neo'
      : 'sans-serif',
  mono: isWeb
    ? '"DejaVu Sans Mono", ui-monospace, monospace'
    : Platform.OS === 'ios'
      ? 'Menlo'
      : 'monospace',
};

export const S = {
  pad: 26,
  hair: 1,
};

/** 작은 라틴 라벨 — 자간을 넓게, 대문자. */
export const eyebrow = {
  fontFamily: F.sansMedium,
  fontSize: 9,
  letterSpacing: 2.2,
  color: C.ink55,
} as const;

/** 숫자·코드류 */
export const meta = {
  fontFamily: F.mono,
  fontSize: 9,
  letterSpacing: 1.1,
  color: C.ink40,
} as const;

export const body = {
  fontFamily: F.sans,
  fontSize: 13,
  lineHeight: 22,
  color: C.ink70,
  letterSpacing: 0.1,
} as const;
