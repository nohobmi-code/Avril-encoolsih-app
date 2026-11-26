import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, F, S, eyebrow } from '../theme';
import { Meta, Star } from '../components/ui';

const useNative = Platform.OS !== 'web';

/** 받침에 따라 '아/야'를 고른다 (민혁아 · 율리야). */
const vocative = (name: string) => {
  const code = name.charCodeAt(name.length - 1);
  const hasJong = (code - 0xac00) % 28 !== 0;
  return `${name}${hasJong ? '아' : '야'}`;
};

const SPARKS = [
  { x: 16, y: 20, s: 20, d: 60, c: C.clay },
  { x: 80, y: 14, s: 14, d: 180, c: C.sage },
  { x: 67, y: 32, s: 11, d: 320, c: C.clay },
  { x: 9, y: 47, s: 12, d: 460, c: C.sage },
  { x: 87, y: 55, s: 18, d: 240, c: C.clay },
  { x: 25, y: 68, s: 10, d: 560, c: C.clay },
  { x: 61, y: 73, s: 15, d: 380, c: C.sage },
  { x: 41, y: 9, s: 9, d: 700, c: C.clay },
  { x: 93, y: 40, s: 9, d: 520, c: C.clay },
  { x: 5, y: 65, s: 8, d: 780, c: C.sage },
];

function Twinkle({ x, y, s, d, c }: { x: number; y: number; s: number; d: number; c: string }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(d + 380),
        Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: useNative }),
        Animated.delay(560),
        Animated.timing(v, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: useNative }),
        Animated.delay(560),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [d, v]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        opacity: v,
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.15] }) }],
      }}
    >
      <Star size={s * 1.25} color={c} />
    </Animated.View>
  );
}

export default function WelcomeScreen({
  name,
  nameEn,
  onDone,
}: {
  name: string;
  nameEn: string;
  onDone: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;
  const line = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const halo2 = useRef(new Animated.Value(0)).current;
  const sub = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),
        Animated.timing(rise, { toValue: 0, duration: 760, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),
        Animated.timing(halo, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: useNative }),
      ]),
      Animated.parallel([
        Animated.timing(line, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.cubic), useNativeDriver: useNative }),
        Animated.timing(sub, { toValue: 1, duration: 620, useNativeDriver: useNative }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(320),
      Animated.timing(halo2, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: useNative }),
    ]).start();

    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [fade, rise, line, halo, halo2, sub, onDone]);

  const ring = (v: Animated.Value, from: number, to: number, max: number) => ({
    opacity: v.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, max, max * 0.22] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) }],
  });

  return (
    <Pressable style={s.root} onPress={onDone}>
      <Animated.View style={[s.ringOuter, ring(halo, 0.72, 1.22, 0.45)]} pointerEvents="none" />
      <Animated.View style={[s.ringInner, ring(halo2, 0.8, 1.1, 0.3)]} pointerEvents="none" />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {SPARKS.map((sp) => (
          <Twinkle key={`${sp.x}-${sp.y}`} {...sp} />
        ))}
      </View>

      <Animated.View style={{ alignItems: 'center', opacity: fade, transform: [{ translateY: rise }] }}>
        <Text style={[eyebrow, { color: C.clay, fontSize: 8.5, letterSpacing: 2.6 }]}>
          WELCOME · {nameEn.toUpperCase()}'S ROOM
        </Text>
        <Text style={s.hello}>안녕, {vocative(name)}!</Text>
        <Animated.View style={[s.line, { transform: [{ scaleX: line }] }]} />
        <Animated.Text style={[s.caption, { opacity: sub }]}>
          {name} 전용 방으로 들어왔어요.{'\n'}오늘의 영상과 노트가 기다리고 있습니다.
        </Animated.Text>
      </Animated.View>

      <View style={s.foot} pointerEvents="none">
        <Meta style={{ color: C.ink40 }}>PRIVATE ROOM · ONLY {nameEn.toUpperCase()}</Meta>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.pad,
    overflow: 'hidden',
  },
  halo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(164,87,47,0.55)',
  },
  ringOuter: {
    position: 'absolute',
    width: 258,
    height: 258,
    borderRadius: 129,
    borderWidth: 1,
    borderColor: C.clay,
  },
  ringInner: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
    borderColor: C.sage,
  },
  hello: {
    fontFamily: F.krSerif,
    fontSize: 38,
    lineHeight: 54,
    color: C.ink,
    marginTop: 16,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  line: {
    width: 44,
    height: 1,
    backgroundColor: C.clay,
    marginTop: 12,
  },
  caption: {
    fontFamily: F.krSans,
    fontSize: 12,
    lineHeight: 21,
    color: C.ink55,
    marginTop: 18,
    textAlign: 'center',
  },
  foot: {
    position: 'absolute',
    bottom: 34,
  },
});
