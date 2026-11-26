import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F, S, body, eyebrow } from '../theme';
import { Colophon, Header, Meta, Rule, Sparkle } from '../components/ui';
import { useStore, shortDate } from '../store';
import { ChildId } from '../types';

export default function TeacherScreen({
  onBack,
  onEnterRoom,
}: {
  onBack: () => void;
  onEnterRoom: (id: ChildId) => void;
}) {
  const { children } = useStore();

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio="03 — STUDIO" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 26, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[eyebrow, { color: C.clay }]}>TEACHER STUDIO</Text>
        <Text style={s.title}>오늘의 방을 고르세요.</Text>
        <Text style={s.lead}>
          아이의 방에 들어가 그날의 영상과 노트를 올립니다.{'\n'}
          올린 기록은 그 아이의 어머님 계정에만 나타납니다.
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, marginBottom: 8 }}>
          <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>MY STUDENTS</Text>
          <Meta style={{ color: C.ink40 }}>2 ROOMS</Meta>
        </View>
        <Rule />

        {(Object.keys(children) as ChildId[]).map((k) => {
          const c = children[k];
          const last = c.lessons[0];
          return (
            <View key={k}>
              <Pressable
                onPress={() => onEnterRoom(k)}
                style={({ pressed }) => [s.row, { opacity: pressed ? 0.6 : 1 }]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={s.name}>{c.name}</Text>
                    <Text style={s.meta}>
                      {c.age} · {c.nameEn}
                    </Text>
                  </View>
                  <Text style={s.line}>{c.teacherLine}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Sparkle size={5} color={C.sage} />
                    <Meta style={{ color: C.ink40, marginLeft: 6 }}>
                      최근 {shortDate(last.date)} · 노트 {c.lessons.length}편
                    </Meta>
                  </View>
                </View>
                <Text style={s.arrow}>→</Text>
              </Pressable>
              <Rule />
            </View>
          );
        })}

        <Text style={s.note}>
          방은 아이마다 따로 있습니다. 한 아이의 영상과 노트는 다른 아이의 계정으로 옮겨지지 않습니다.
        </Text>

        <Colophon note="TEACHER · AVRIL ENCOOLISH" />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  title: {
    fontFamily: F.krSerif,
    fontSize: 24,
    lineHeight: 36,
    color: C.ink,
    marginTop: 12,
    letterSpacing: -0.3,
  },
  lead: { ...body, fontSize: 12.5, lineHeight: 21, marginTop: 8 },
  row: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center' },
  name: { fontFamily: F.krSerif, fontSize: 21, color: C.ink, letterSpacing: -0.2 },
  meta: { fontFamily: F.krSans, fontSize: 11, color: C.ink40, marginLeft: 8 },
  line: { fontFamily: F.krSans, fontSize: 11.5, color: C.ink55, marginTop: 4 },
  arrow: { fontFamily: F.sans, fontSize: 13, color: C.ink40 },
  note: {
    fontFamily: F.krSans,
    fontSize: 10.5,
    lineHeight: 17,
    color: C.ink40,
    marginTop: 22,
  },
});
