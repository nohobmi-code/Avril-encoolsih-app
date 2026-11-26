import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { C, F, S, body, eyebrow } from '../theme';
import { Colophon, Header, Meta, Rule, Sparkle, TextLink } from '../components/ui';
import { koreanDate, todayISO } from '../store';
import { DEFAULT_KIDS_WORDS, loadKidsWords } from '../lib/api';
import { KidsWord } from '../types';

type QuizItem = { say: string; options: string[]; answer: string };

/** 단어가 3개 미만일 때 세 번째 보기를 채우는 여분 단어. */
const FILLERS = ['bed', 'sun', 'cup', 'pig', 'fox', 'bus'];

/** 단어장 → 듣기 퀴즈. 정답 하나에 보기 세 개, 정답 자리는 문항마다 돌린다. */
function buildQuiz(deck: KidsWord[]): QuizItem[] {
  const pool: string[] = [];
  deck.forEach((d) => {
    const w = (d.word ?? '').trim();
    if (w && !pool.includes(w)) pool.push(w);
  });

  // 세 단어면 모두, 그보다 많으면 날마다 세 개씩 돌려서 낸다. (한국 시간 기준)
  const day = Math.floor((Date.now() + 9 * 60 * 60 * 1000) / 86400000);
  const picks =
    pool.length <= 3 ? pool : [0, 1, 2].map((i) => pool[(day + i) % pool.length]);

  return picks.map((answer, i) => {
    const distractors: string[] = [];
    [...pool.filter((w) => w !== answer), ...FILLERS].forEach((c) => {
      if (distractors.length < 2 && c !== answer && !distractors.includes(c)) distractors.push(c);
    });
    const options = [answer, ...distractors];
    const shift = options.length ? i % options.length : 0;
    return {
      say: answer,
      options: [...options.slice(shift), ...options.slice(0, shift)],
      answer,
    };
  });
}

const say = (text: string) => {
  try {
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.82, pitch: 1.02 });
  } catch {
    /* 음성 미지원 기기에서는 조용히 넘어간다 */
  }
};

export default function KidsScreen({ onBack }: { onBack: () => void }) {
  const [deck, setDeck] = useState<KidsWord[]>(DEFAULT_KIDS_WORDS);
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [stamps, setStamps] = useState(0);
  const [done, setDone] = useState(false);

  const quiz = useMemo(() => buildQuiz(deck), [deck]);
  const current = quiz[Math.min(q, quiz.length - 1)];

  // 선생님이 저장한 단어를 불러온다. 서버가 없거나 실패하면 기본 3단어로 진행.
  useEffect(() => {
    let alive = true;
    loadKidsWords().then((rows) => {
      if (!alive || rows === null) return;
      setDeck(rows);
      setQ(0);
      setPicked(null);
      setStamps(0);
      setDone(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const choose = (opt: string) => {
    if (!current || picked) return;
    setPicked(opt);
    if (opt === current.answer) setStamps((n) => Math.min(3, n + 1));
  };

  const next = () => {
    if (q + 1 >= quiz.length) {
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

  const koreanLine =
    deck.length === 0
      ? '선생님이 오늘의 단어를 준비하고 있어요.'
      : `오늘의 단어 — ${deck
          .slice(0, 3)
          .map((d) => d.ko)
          .join(' · ')}${deck.length > 3 ? ` 외 ${deck.length - 3}개` : ''}`;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio="01 — KIDS" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[eyebrow, { color: C.clay }]}>TODAY'S WORDS</Text>
          <Meta style={{ color: C.ink40 }}>{koreanDate(todayISO())}</Meta>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 }}>
          <Text style={s.big}>Today's words</Text>
          <Text style={s.ipa}>{`${deck.length} ${deck.length === 1 ? 'card' : 'cards'}`}</Text>
        </View>
        <Text style={s.kr}>{koreanLine}</Text>

        {/* 01 단어 카드 */}
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>01 · WORD CARDS</Text>
            <Meta style={{ color: C.ink40 }}>TAP TO HEAR</Meta>
          </View>
          <Rule />
          {deck.length === 0 ? (
            <Text style={s.emptyNote}>오늘은 준비된 단어가 없어요. 선생님이 단어를 채우면 바로 열립니다.</Text>
          ) : (
            deck.map((d) => (
              <View key={d.id}>
                <Pressable
                  onPress={() => say(d.word)}
                  style={({ pressed }) => [s.card, { opacity: pressed ? 0.65 : 1 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.word}>{d.word}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                      {d.ipa ? <Text style={s.wordIpa}>{d.ipa}</Text> : null}
                      <Text style={s.wordKo}>{d.ko}</Text>
                    </View>
                  </View>
                  <View style={s.speaker}>
                    <View style={s.triangle} />
                  </View>
                </Pressable>
                <Rule />
              </View>
            ))
          )}
        </View>

        {/* 02 미니 퀴즈 */}
        <View style={{ marginTop: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>02 · MINI QUIZ</Text>
            <Meta style={{ color: C.ink40 }}>
              {quiz.length === 0 ? '—' : done ? 'FINISHED' : `${q + 1} / ${quiz.length}`}
            </Meta>
          </View>
          <Rule />

          {!current ? (
            <Text style={s.emptyNote}>단어가 준비되면 세 문항짜리 듣기 퀴즈가 열립니다.</Text>
          ) : done ? (
            <View style={{ paddingVertical: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sparkle size={8} color={C.clay} />
                <Text style={[eyebrow, { marginLeft: 8, color: C.clay }]}>WELL DONE</Text>
              </View>
              <Text style={s.doneTitle}>오늘의 스탬프 {stamps}개</Text>
              <Text style={s.doneBody}>
                {stamps === quiz.length
                  ? '오늘의 단어를 정확하게 들었어요. 내일은 문장으로 만나요.'
                  : '한 번 더 들으면 소리가 더 또렷해져요. 다시 해볼까요?'}
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
                      ? '맞았어요. 소리가 정확했어요.'
                      : '조금 다르게 들렸어요. 한 번 더 들어볼까요?'}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <TextLink label="다시 듣기" onPress={() => say(current.say)} color={C.ink40} />
                    <View style={{ width: 18 }} />
                    <TextLink
                      label={q + 1 >= quiz.length ? '결과 보기 →' : '다음 문제 →'}
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
              {stamps === 0
                ? '퀴즈를 모두 맞히면 스탬프가 쌓여요.'
                : '스탬프가 쌓이고 있어요.'}
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
    fontSize: 38,
    lineHeight: 44,
    color: C.ink,
    letterSpacing: -1.2,
  },
  ipa: {
    fontFamily: F.mono,
    fontSize: 12,
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
  emptyNote: {
    fontFamily: F.krSans,
    fontSize: 12,
    lineHeight: 20,
    color: C.ink40,
    paddingVertical: 18,
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
