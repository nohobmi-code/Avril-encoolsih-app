import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { C, F, S, body, eyebrow } from '../theme';
import { Colophon, Header, Meta, Rule, Sparkle, Tabs, TextLink } from '../components/ui';
import { useStore, koreanDate, shortDate } from '../store';
import { ChildId, Lesson } from '../types';

const toSeconds = (d: string) => {
  const [m, s] = d.split(':').map(Number);
  return m * 60 + (s || 0);
};
const clock = (sec: number) =>
  `${Math.floor(sec / 60)}:${`${sec % 60}`.padStart(2, '0')}`;

function UploadedVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = false;
  });
  return <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls />;
}

/** 영상이 아직 없을 때의 모의 플레이어 — 인쇄물의 필름 프레임처럼. */
function MockStage({
  lesson,
  playing,
  elapsed,
  onToggle,
}: {
  lesson: Lesson;
  playing: boolean;
  elapsed: number;
  onToggle: () => void;
}) {
  const total = toSeconds(lesson.duration);
  const pct = Math.min(1, elapsed / total);

  return (
    <View style={st.stage}>
      <View style={st.stageGridH} />
      <View style={st.stageGridV} />
      <View style={st.stageTop}>
        <Meta style={{ color: C.ink40 }}>CLASS RECORD</Meta>
        <Meta style={{ color: C.ink40 }}>{lesson.duration}</Meta>
      </View>

      <Pressable onPress={onToggle} style={st.playWrap} accessibilityLabel="재생">
        <View style={st.playCircle}>
          {playing ? (
            <View style={{ flexDirection: 'row' }}>
              <View style={st.pauseBar} />
              <View style={[st.pauseBar, { marginLeft: 3 }]} />
            </View>
          ) : (
            <View style={st.triangle} />
          )}
        </View>
      </Pressable>

      <View style={st.stageBottom}>
        <Text style={st.stageTitle}>{lesson.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Meta style={{ color: C.ink55 }}>
            {playing ? '재생 중' : '대기'} · {clock(elapsed)} / {lesson.duration}
          </Meta>
        </View>
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width: `${pct * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

export default function ParentScreen({
  childId,
  onLogout,
}: {
  childId: ChildId;
  onLogout: () => void;
}) {
  const { children } = useStore();
  const child = children[childId];
  const [tab, setTab] = useState<'video' | 'note'>('video');
  const [activeId, setActiveId] = useState(child.lessons[0]?.id);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(child.lessons[0]?.id ?? null);

  const active = child.lessons.find((l) => l.id === activeId) ?? child.lessons[0];

  useEffect(() => {
    if (!active) return;
    setActiveId(active.id);
    setPlaying(false);
    setElapsed(0);
  }, [active?.id]);

  useEffect(() => {
    if (!playing || !active) return;
    const total = toSeconds(active.duration);
    const t = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= total) {
          setPlaying(false);
          return total;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, active?.id]);

  const pickLesson = (id: string) => {
    setActiveId(id);
    setPlaying(false);
    setElapsed(0);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio={`02 — ${child.nameEn.toUpperCase()}`} onBack={onLogout} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 아이 신원 */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text style={[eyebrow, { color: C.clay }]}>{child.nameEn.toUpperCase()} · {child.age}</Text>
            <Text style={st.childName}>{child.name}의 방</Text>
            <Text style={st.tagline}>{child.teacherLine}</Text>
          </View>
          <TextLink label="로그아웃" onPress={onLogout} color={C.ink40} />
        </View>

        <View style={{ marginTop: 20, marginBottom: 18 }}>
          <Tabs
            value={tab}
            onChange={(k) => setTab(k as 'video' | 'note')}
            items={[
              { key: 'video', label: '수업 영상', sub: `영상 ${child.lessons.length}` },
              { key: 'note', label: '수업노트', sub: `노트 ${child.lessons.length}` },
            ]}
          />
        </View>

        {tab === 'video' ? (
          <>
            {active?.videoUri ? (
              <View style={st.videoBox}>
                <UploadedVideo uri={active.videoUri} />
              </View>
            ) : active ? (
              <MockStage
                lesson={active}
                playing={playing}
                elapsed={elapsed}
                onToggle={() => {
                  if (elapsed >= toSeconds(active.duration)) setElapsed(0);
                  setPlaying((p) => !p);
                }}
              />
            ) : null}

            {active ? (
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[eyebrow, { color: C.ink40, letterSpacing: 0.4 }]}>{koreanDate(active.date)}</Text>
                  <Meta style={{ color: C.ink40 }}>UPLOADED BY BOMI</Meta>
                </View>
                <Text style={st.lessonTitle}>{active.title}</Text>
                <Text style={st.lessonSub} numberOfLines={2}>
                  {active.note.comment}
                </Text>
                <View style={{ marginTop: 14 }}>
                  <TextLink label="이 날의 수업노트 읽기 →" onPress={() => setTab('note')} color={C.clay} />
                </View>
              </View>
            ) : null}

            <View style={{ marginTop: 30 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>PREVIOUS CLASSES</Text>
                <Meta style={{ color: C.ink40 }}>{child.lessons.length} FILMS</Meta>
              </View>
              <Rule />
              {child.lessons.map((l) => {
                const on = l.id === activeId;
                return (
                  <View key={l.id}>
                    <Pressable
                      onPress={() => pickLesson(l.id)}
                      style={({ pressed }) => [st.row, { opacity: pressed ? 0.6 : 1 }]}
                    >
                      <View style={{ width: 46 }}>
                        <Text style={[st.rowDate, on && { color: C.clay }]}>{shortDate(l.date)}</Text>
                        <Text style={st.rowDur}>{l.duration}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[st.rowTitle, on && { color: C.clay }]}>{l.note.topic}</Text>
                        <Text style={st.rowMeta}>
                          {l.videoUri ? '선생님 업로드 영상' : '수업 기록 영상'}
                        </Text>
                      </View>
                      <View style={[st.dot, on && { backgroundColor: C.clay, borderColor: C.clay }]} />
                    </Pressable>
                    <Rule />
                  </View>
                );
              })}
            </View>
            <Text style={st.separation}>
              영상은 {child.name}의 방에만 올라옵니다. 다른 아이의 계정에서는 보이지 않습니다.
            </Text>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>LESSON NOTES</Text>
              <Meta style={{ color: C.ink40 }}>BY BOMI</Meta>
            </View>
            <Rule />
            {child.lessons.map((l, idx) => {
              const open = expanded === l.id;
              return (
                <View key={l.id}>
                  <Pressable onPress={() => setExpanded(open ? null : l.id)} style={{ paddingTop: 18, paddingBottom: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[eyebrow, { color: idx === 0 ? C.clay : C.ink40, letterSpacing: 0.4 }]}>
                        {koreanDate(l.date)}
                      </Text>
                      <Meta style={{ color: C.ink40 }}>{open ? '−' : '+'}</Meta>
                    </View>
                    <Text style={st.noteTitle}>{l.note.topic}</Text>
                  </Pressable>

                  {open ? (
                    <View style={{ paddingBottom: 22 }}>
                      <Text style={[body, { marginTop: 4 }]}>{l.note.comment}</Text>

                      <View style={{ marginTop: 20 }}>
                        <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2, marginBottom: 8 }]}>
                          TODAY'S EXPRESSIONS
                        </Text>
                        {l.note.expressions.map((e) => (
                          <View key={e.en} style={st.expRow}>
                            <Text style={st.expEn}>{e.en}</Text>
                            <Text style={st.expKo}>{e.ko}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={st.mission}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Sparkle size={6} color={C.sage} />
                          <Text style={[eyebrow, { marginLeft: 7, fontSize: 8.5, letterSpacing: 2 }]}>
                            5 MINUTES AT HOME
                          </Text>
                        </View>
                        <Text style={st.missionText}>{l.note.mission}</Text>
                      </View>

                      <Text style={st.sign}>— 보미</Text>
                    </View>
                  ) : null}
                  <Rule />
                </View>
              );
            })}
            <Text style={st.separation}>
              노트는 수업이 끝난 뒤 선생님이 직접 남깁니다. 저장되는 즉시 이 방에 반영됩니다.
            </Text>
          </>
        )}

        <Colophon note={`PRIVATE · ${child.nameEn.toUpperCase()}`} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  childName: {
    fontFamily: F.krSerif,
    fontSize: 23,
    lineHeight: 32,
    color: C.ink,
    marginTop: 6,
    letterSpacing: -0.3,
  },
  tagline: {
    fontFamily: F.krSans,
    fontSize: 11,
    color: C.ink55,
    marginTop: 3,
  },
  stage: {
    height: 196,
    borderWidth: S.hair,
    borderColor: C.ruleStrong,
    backgroundColor: C.paperShade,
    padding: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  stageGridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(28,26,23,0.07)',
  },
  stageGridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(28,26,23,0.07)',
  },
  stageTop: { flexDirection: 'row', justifyContent: 'space-between' },
  playWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: S.hair,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,247,242,0.72)',
  },
  triangle: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: C.ink,
    marginLeft: 3,
  },
  pauseBar: { width: 3, height: 12, backgroundColor: C.ink },
  stageBottom: {},
  stageTitle: {
    fontFamily: F.serif,
    fontSize: 20,
    letterSpacing: -0.3,
    color: C.ink,
  },
  progressTrack: { height: 1, backgroundColor: C.rule, marginTop: 10 },
  progressFill: { height: 1, backgroundColor: C.clay },
  videoBox: {
    height: 196,
    borderWidth: S.hair,
    borderColor: C.ruleStrong,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  lessonTitle: {
    fontFamily: F.krSerif,
    fontSize: 19,
    lineHeight: 28,
    color: C.ink,
    marginTop: 6,
  },
  lessonSub: { ...body, fontSize: 12, marginTop: 4, color: C.ink55 },
  row: { paddingVertical: 13, flexDirection: 'row', alignItems: 'center' },
  rowDate: { fontFamily: F.mono, fontSize: 11, color: C.ink, letterSpacing: 0.4 },
  rowDur: { fontFamily: F.mono, fontSize: 9, color: C.ink40, marginTop: 3 },
  rowTitle: { fontFamily: F.krSans, fontSize: 13.5, color: C.ink },
  rowMeta: { fontFamily: F.krSans, fontSize: 10.5, color: C.ink40, marginTop: 3 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: S.hair,
    borderColor: C.ruleStrong,
    marginLeft: 8,
  },
  separation: {
    fontFamily: F.krSans,
    fontSize: 10.5,
    lineHeight: 17,
    color: C.ink40,
    marginTop: 22,
  },
  noteTitle: {
    fontFamily: F.krSerif,
    fontSize: 18,
    lineHeight: 27,
    color: C.ink,
    marginTop: 5,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 11,
    borderTopWidth: S.hair,
    borderTopColor: C.rule,
  },
  expEn: { fontFamily: F.serif, fontSize: 19, color: C.ink, letterSpacing: -0.2 },
  expKo: { fontFamily: F.krSans, fontSize: 11.5, color: C.ink55, marginLeft: 12 },
  mission: {
    marginTop: 22,
    paddingVertical: 16,
    borderTopWidth: S.hair,
    borderBottomWidth: S.hair,
    borderColor: C.ruleStrong,
  },
  missionText: { fontFamily: F.krSans, fontSize: 12, lineHeight: 20, color: C.ink70 },
  sign: { fontFamily: F.serifItalic, fontSize: 15, color: C.ink55, marginTop: 16 },
});
