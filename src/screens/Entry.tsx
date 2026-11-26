import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F, S, body, eyebrow } from '../theme';
import { Colophon, Meta, Rule, Sparkle } from '../components/ui';

type Props = {
  onKids: () => void;
  onParent: () => void;
  onTeacher: () => void;
};

const ROOMS = [
  { no: '01', en: 'Kids', ko: '아이 모드', desc: '오늘의 소리 카드와 세 문항', go: 'kids' as const },
  { no: '02', en: 'Parent Note', ko: '어머님 모드', desc: '수업 영상 · 수업노트', go: 'parent' as const },
  { no: '03', en: 'Teacher Studio', ko: '선생님 모드', desc: '아이 방에 영상과 기록 올리기', go: 'teacher' as const },
];

export default function EntryScreen({ onKids, onParent, onTeacher }: Props) {
  const handlers = { kids: onKids, parent: onParent, teacher: onTeacher };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.paper }}
      contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 30, paddingBottom: 34 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Sparkle size={7} color={C.clay} />
        <Text style={s.eyebrowKo}>
          {'아이들을 위한 선택'}
          <Text style={{ color: C.clay }}>{' · '}</Text>
          {'Avril 선생님'}
        </Text>
      </View>

      <Image
        source={require('../../assets/brand-heart.png')}
        style={{ width: 182, height: 161, marginTop: 16 }}
        resizeMode="contain"
      />

      <View style={{ width: 34, height: 1, backgroundColor: C.clay, marginTop: 18 }} />

      <Text style={s.krHeadline}>정보는 교육이 아니다.</Text>
      <Text style={s.lead}>
        아이 한 명 한 명의 마음을 먼저 읽고,{'\n'}
        따뜻하게 영어를 만나는 시간.
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 34, marginBottom: 10 }}>
        <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>THREE ROOMS</Text>
        <Meta style={{ color: C.ink40 }}>SELECT</Meta>
      </View>

      <Rule />
      {ROOMS.map((r) => (
        <View key={r.no}>
          <Pressable
            onPress={handlers[r.go]}
            style={({ pressed }) => [s.row, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[s.rowNo]}>{r.no}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{r.en}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 3 }}>
                <Text style={s.rowKo}>{r.ko}</Text>
                <Text style={s.rowDesc}> — {r.desc}</Text>
              </View>
            </View>
            <Text style={s.arrow}>→</Text>
          </Pressable>
          <Rule />
        </View>
      ))}

      <View style={{ marginTop: 36, flexDirection: 'row' }}>
        <View style={{ width: 1, backgroundColor: C.ruleStrong, marginRight: 16 }} />
        <View style={{ flex: 1 }}>
          <Text style={s.quote}>“진심인 사람을 이길 수는 없다.”</Text>
          <Text style={[eyebrow, { fontSize: 8, letterSpacing: 1.8, marginTop: 10 }]}>
            BOMI · TEACHER & FOUNDER
          </Text>
        </View>
      </View>

      <Colophon />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wordmark1: {
    fontFamily: F.serif,
    fontSize: 64,
    lineHeight: 66,
    color: C.ink,
    letterSpacing: -1.6,
    marginTop: 26,
  },
  wordmark2: {
    fontFamily: F.serifItalic,
    fontSize: 64,
    lineHeight: 68,
    color: C.ink,
    letterSpacing: -1.4,
    marginTop: -6,
  },
  eyebrowKo: {
    marginLeft: 9,
    fontFamily: F.krSans,
    fontSize: 10.5,
    letterSpacing: 0.3,
    color: C.ink55,
  },
  krHeadline: {
    fontFamily: F.krSerif,
    fontSize: 19,
    lineHeight: 30,
    color: C.ink,
    marginTop: 22,
    letterSpacing: -0.2,
  },
  lead: {
    ...body,
    fontSize: 12.5,
    lineHeight: 21,
    color: C.ink70,
    marginTop: 8,
  },
  row: {
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowNo: {
    width: 30,
    paddingTop: 9,
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: C.clay,
  },
  rowTitle: {
    fontFamily: F.serif,
    fontSize: 26,
    lineHeight: 30,
    color: C.ink,
    letterSpacing: -0.4,
  },
  rowKo: {
    fontFamily: F.krSans,
    fontSize: 11.5,
    color: C.ink,
  },
  rowDesc: {
    fontFamily: F.krSans,
    fontSize: 11.5,
    color: C.ink40,
  },
  arrow: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.ink40,
    paddingTop: 8,
  },
  quote: {
    fontFamily: F.krSerif,
    fontSize: 14,
    lineHeight: 24,
    color: C.ink70,
  },
});
