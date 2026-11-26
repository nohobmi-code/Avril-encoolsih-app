import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { C, F, S, body, eyebrow, meta } from '../theme';

export const isWeb = Platform.OS === 'web';

/** 1px 헤어라인 */
export function Rule({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: S.hair, backgroundColor: C.rule }, style]} />;
}

export function Eyebrow({
  children,
  color,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: any;
}) {
  return <Text style={[eyebrow, color ? { color } : null, style]}>{children}</Text>;
}

export function Meta({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[meta, style]}>{children}</Text>;
}

/** 상단 고정 크롬: 브랜드 · folio · 뒤로 */
export function Header({
  folio,
  onBack,
  onBrand,
}: {
  folio: string;
  onBack?: () => void;
  onBrand?: () => void;
}) {
  const Left = (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {onBack ? (
        <>
          <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="뒤로">
            <Text style={{ fontFamily: F.sans, fontSize: 14, color: C.ink, marginRight: 12 }}>←</Text>
          </Pressable>
          <Text style={[eyebrow, { color: C.ink70 }]}>AVRIL ENCOOLISH</Text>
        </>
      ) : (
        <Text style={[eyebrow, { color: C.ink }]}>AVRIL ENCOOLISH</Text>
      )}
    </View>
  );

  return (
    <View>
      <View style={s.header}>
        {onBrand ? <Pressable onPress={onBrand}>{Left}</Pressable> : Left}
        <Meta style={{ color: C.ink40 }}>{folio}</Meta>
      </View>
      <Rule />
    </View>
  );
}

/** 라벨 + 내용 2단(잡지식) */
export function KV({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ flexDirection: 'row' }, style]}>
      <View style={{ width: 74, paddingTop: 3 }}>
        <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 1.6 }]}>{label}</Text>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

/** 밑줄만 있는 입력. 여러 줄 입력은 글자 수에 맞춰 높이가 늘어난다. */
export function Field({
  label,
  hint,
  style,
  minLines = 3,
  ...rest
}: TextInputProps & { label: string; hint?: string; style?: ViewStyle; minLines?: number }) {
  const text = typeof rest.value === 'string' ? rest.value : '';
  const lines = text.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 22)), 0);
  const grown = rest.multiline ? Math.max(minLines, lines) * 22 + 18 : undefined;
  return (
    <View style={[{ marginBottom: 22 }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
        <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 1.8 }]}>{label}</Text>
        {hint ? <Meta style={{ color: C.ink40 }}>{hint}</Meta> : null}
      </View>
      <TextInput
        placeholderTextColor={C.ink40}
        selectionColor={C.clay}
        {...rest}
        style={[
          {
            fontFamily: F.krSans,
            fontSize: 15,
            lineHeight: 22,
            color: C.ink,
            paddingVertical: 9,
            paddingHorizontal: 0,
            borderBottomWidth: S.hair,
            borderBottomColor: C.ruleStrong,
            ...(isWeb ? ({ outlineStyle: 'none' } as any) : null),
          },
          rest.multiline ? { height: grown, textAlignVertical: 'top' } : null,
        ]}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  tone = 'clay',
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: 'clay' | 'ink' | 'quiet';
  disabled?: boolean;
}) {
  const bg = tone === 'clay' ? C.clay : tone === 'ink' ? C.ink : 'transparent';
  const fg = tone === 'quiet' ? C.ink : C.paper;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderWidth: tone === 'quiet' ? S.hair : 0,
        borderColor: C.ruleStrong,
        paddingVertical: 15,
        paddingHorizontal: 18,
        alignItems: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.82 : 1,
      })}
    >
      <Text style={[eyebrow, { color: fg, fontSize: 10, letterSpacing: 2.4 }]}>{label}</Text>
    </Pressable>
  );
}

export function TextLink({
  label,
  onPress,
  color,
}: {
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text
        style={{
          fontFamily: F.krSans,
          fontSize: 12,
          color: color ?? C.ink70,
          textDecorationLine: 'underline',
          textDecorationColor: C.ruleStrong,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** 밑줄로 선택을 표시하는 탭 */
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string; sub?: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: S.hair, borderBottomColor: C.rule }}>
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={{ marginRight: 28, paddingBottom: 10, paddingTop: 6 }}
          >
            <Text
              style={{
                fontFamily: F.krSans,
                fontSize: 14,
                color: active ? C.ink : C.ink40,
                letterSpacing: 0.2,
              }}
            >
              {it.label}
            </Text>
            {it.sub ? (
              <Text style={{ fontFamily: F.sans, fontSize: 9, letterSpacing: 1.4, color: active ? C.clay : C.ink40, marginTop: 4 }}>
                {it.sub}
              </Text>
            ) : null}
            <View
              style={{
                height: 2,
                marginTop: 8,
                marginBottom: -11,
                backgroundColor: active ? C.clay : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

/** 작은 마름모 장식 — 폰트에 기대지 않는다 */
export function Sparkle({
  size = 10,
  color = C.clay,
  style,
}: {
  size?: number;
  color?: string;
  style?: any;
}) {
  const d = size * 0.8;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={{ width: d, height: d, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

/** 별 — 마름모와 가는 빛살. 환영 화면의 반짝임에 쓴다. */
export function Star({
  size = 10,
  color = C.clay,
  style,
}: {
  size?: number;
  color?: string;
  style?: any;
}) {
  const d = Math.max(2, size * 0.5);
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={{ position: 'absolute', width: size, height: 1, backgroundColor: color, opacity: 0.55 }} />
      <View style={{ position: 'absolute', width: 1, height: size, backgroundColor: color, opacity: 0.55 }} />
      <View style={{ width: d, height: d, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

export function Colophon({ note }: { note?: string }) {
  return (
    <View style={{ marginTop: 40 }}>
      <Rule />
      <View style={s.colophon}>
        <Text style={[eyebrow, { fontSize: 8, letterSpacing: 1.8, color: C.ink40 }]}>
          {note ?? 'SCREEN-FREE · NO AI · GOYANG'}
        </Text>
        <Meta style={{ color: C.ink40 }}>010 3446 0109</Meta>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    height: 52,
    paddingHorizontal: S.pad,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colophon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
});

export const textStyles = StyleSheet.create({
  body: { ...body },
});
