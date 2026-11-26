import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { C, F, S, body, eyebrow } from '../theme';
import { Colophon, Header, Meta, Rule, Sparkle, TextLink } from '../components/ui';
import { koreanDate, todayISO } from '../store';

const DECK = [
  { word: 'cat', ipa: '/kæt/', ko: '고양이' },
  { word: 'hat', ipa: '/hæt/', ko: '모자' },
  { word: 'map', ipa: '/mæp/', ko: '지도' },
];

const QUIZ = [
  { say: 'cat', options: ['cat', 'hat', 'map'], answer: 'cat' },
  { say: 'hat', options: ['map', 'hat', 'cat'], answer: 'hat' },
  { say: 'map', options: ['cat', 'map', 'bed'], answer: 'map' },
];

const say = (text: string) => {
  try {
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.82, pitch: 1.02 });
  } catch {
    /* 음성 미지원 기기에서는 조용히 넘어간다 */
  }
};

export default function KidsScreen({ onBack }: { onBack: () => void }) {
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [stamps, setStamps] = useState(0);
  const [done, setDone] = useState(false);

  const current = QUIZ[q];

  useEffect(() => {
    if (done) return;
  }, [done]);

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    if (opt === current.answer) setStamps((n) => Math.min(3, n + 1));
  };

  const next = () => {
    if (q + 1 >= QUIZ.length) {
      setDone(true);
      return;
    }
    setQ(q + 1);
    setPicked(null);
  };

  const restart = () => {
    setQ(0);
    setPicked(null);
    setStamps(0);
    setDone(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio="01 — KIDS" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[eyebrow, { color: C.clay }]}>TODAY'S SOUND</Text>
          <Meta style={{ color: C.ink40 }}>{koreanDate(todayISO())}</Meta>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 }}>
          <Text style={s.big}>Short a</Text>
          <Text style={s.ipa}>/æ/</Text>
        </View>
        <Text style={s.kr}>짧은 ‘애’ 소리 — 고양이, 모자, 지도</Text>

        {/* 01 단어 카드 */}
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>01 · WORD CARDS</Text>
            <Meta style={{ color: C.ink40 }}>TAP TO HEAR</Meta>
          </View>
          <Rule />
          {DECK.map((d) => (
            <View key={d.word}>
              <Pressable
                onPress={() => say(d.word)}
                style={({ pressed }) => [s.card, { opacity: pressed ? 0.65 : 1 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.word}>{d.word}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                    <Text style={s.wordIpa}>{d.ipa}</Text>
                    <Text style={s.wordKo}>{d.ko}</Text>
                  </View>
                </View>
                <View style={s.speaker}>
                  <View style={s.triangle} />
                </View>
              </Pressable>
              <Rule />
            </View>
          ))}
        </View>

        {/* 02 미니 퀴즈 */}
        <View style={{ marginTop: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>02 · MINI QUIZ</Text>
            <Meta style={{ color: C.ink40 }}>{done ? 'FINISHED' : `${q + 1} / ${QUIZ.length}`}</Meta>
          </View>
          <Rule />

          {done ? (
            <View style={{ paddingVertical: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sparkle size={8} color={C.clay} />
                <Text style={[eyebrow, { marginLeft: 8, color: C.clay }]}>WELL DONE</Text>
              </View>
              <Text style={s.doneTitle}>오늘의 스탬프 {stamps}개</Text>
              <Text style={s.doneBody}>
                {stamps === 3
                  ? '“a” 소리를 정확하게 들었어요. 내일은 문장으로 만나요.'
                  : '세 번 더 들으면 소리가 더 또렷해져요. 다시 해볼까요?'}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 16 }}>
                <TextLink label="한 번 더 →" onPress={restart} color={C.clay} />
              </View>
            </View>
          ) : (
            <View style={{ paddingTop: 14 }}>
              <Pressable onPress={() => say(current.say)} style={s.hear}>
                <View style={s.speakerSmall}>
                  <View style={s.triangleSmall} />
                </View>
                <Text style={s.hearLabel}>소리를 듣고 알맞은 단어를 골라요</Text>
              </Pressable>

              {current.options.map((opt, i) => {
                const isAnswer = opt === current.answer;
                const isPicked = picked === opt;
                const revealed = picked !== null;
                const color = !revealed ? C.ink : isAnswer ? C.clay : isPicked ? C.sage : C.ink40;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => choose(opt)}
                    style={({ pressed }) => [s.option, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Text style={[s.optionKey, { color: revealed ? color : C.ink40 }]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                    <Text style={[s.optionWord, { color }]}>{opt}</Text>
                    {revealed && isAnswer ? <Text style={s.mark}>✓</Text> : null}
                  </Pressable>
                );
              })}

              {picked ? (
                <View style={{ marginTop: 14 }}>
                  <Text style={s.feedback}>
                    {picked === current.answer
                      ? '맞았어요. “a” 소리가 정확했어요.'
                      : '조금 다르게 들렸어요. 한 번 더 들어볼까요?'}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <TextLink label="다시 듣기" onPress={() => say(current.say)} color={C.ink40} />
                    <View style={{ width: 18 }} />
                    <TextLink
                      label={q + 1 >= QUIZ.length ? '결과 보기 →' : '다음 문제 →'}
                      onPress={next}
                      color={C.clay}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* 03 스탬프 */}
        <View style={{ marginTop: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>03 · STAMP CARD</Text>
            <Meta style={{ color: C.ink40 }}>{stamps} / 3</Meta>
          </View>
          <Rule />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 14 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  s.stamp,
                  i < stamps ? { backgroundColor: C.clay, borderColor: C.clay } : null,
                ]}
              />
            ))}
            <Text style={s.stampNote}>
              {stamps === 0 ? '세 문항을 모두 맞히면 스탬프가 쌓여요.' : '스탬프가 쌓이고 있어요.'}
            </Text>
          </View>
        </View>

        <Colophon note="KIDS · AVRIL ENCOOLISH" />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  big: {
    fontFamily: F.serif,
    fontSize: 42,
    lineHeight: 46,
    color: C.ink,
    letterSpacing: -1.2,
  },
  ipa: {
    fontFamily: F.mono,
    fontSize: 15,
    color: C.clay,
    marginLeft: 10,
    marginBottom: 6,
  },
  kr: {
    fontFamily: F.krSans,
    fontSize: 12,
    color: C.ink55,
    marginTop: 6,
  },
  card: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  word: {
    fontFamily: F.serif,
    fontSize: 30,
    color: C.ink,
    letterSpacing: -0.5,
  },
  wordIpa: { fontFamily: F.mono, fontSize: 10, color: C.ink40 },
  wordKo: { fontFamily: F.krSans, fontSize: 11, color: C.ink55, marginLeft: 10 },
  speaker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: S.hair,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: C.ink,
    marginLeft: 2,
  },
  hear: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  speakerSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: S.hair,
    borderColor: C.clay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triangleSmall: {
    width: 0,
    height: 0,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: C.clay,
    marginLeft: 2,
  },
  hearLabel: {
    fontFamily: F.krSans,
    fontSize: 12,
    color: C.ink70,
    marginLeft: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderTopWidth: S.hair,
    borderTopColor: C.rule,
  },
  optionKey: { width: 24, fontFamily: F.mono, fontSize: 10, letterSpacing: 1 },
  optionWord: { flex: 1, fontFamily: F.serif, fontSize: 22, letterSpacing: -0.3 },
  mark: { fontFamily: F.sans, fontSize: 13, color: C.clay },
  feedback: {
    fontFamily: F.krSans,
    fontSize: 12,
    lineHeight: 19,
    color: C.ink70,
  },
  doneTitle: {
    fontFamily: F.krSerif,
    fontSize: 20,
    color: C.ink,
    marginTop: 10,
  },
  doneBody: { ...body, fontSize: 12, lineHeight: 20, marginTop: 6 },
  stamp: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: S.hair,
    borderColor: C.ruleStrong,
    marginRight: 8,
  },
  stampNote: {
    fontFamily: F.krSans,
    fontSize: 10.5,
    color: C.ink40,
    marginLeft: 8,
    flex: 1,
  },
});
