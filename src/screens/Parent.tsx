import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { C, F, S, body, eyebrow } from '../theme';
import { Colophon, Field, Header, Meta, PrimaryButton, Rule, Sparkle, Tabs, TextLink } from '../components/ui';
import { ApiError, MIN_PASSWORD, changePassword, listLessons, videoUrl } from '../lib/api';
import { koreanDate, meaningOf, shortDate, useStore } from '../store';
import { Lesson } from '../types';

/* ── 영상 재생 ─────────────────────────────────────────────
   웹은 <video>, 앱은 expo-video. 서명 URL은 4시간짜리다. */

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function WebVideo({ uri }: { uri: string }) {
  return React.createElement('video', {
    src: uri,
    controls: true,
    playsInline: true,
    preload: 'metadata',
    style: { width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' },
  });
}

function NativeVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = false;
    p.loop = false;
  });
  return <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls />;
}

/** 아직 영상이 없을 때의 필름 프레임 — 인쇄물의 빈 칸처럼. */
function EmptyStage({ title, caption }: { title: string; caption: string }) {
  return (
    <View style={st.stage}>
      <View style={st.stageGridH} />
      <View style={st.stageGridV} />
      <View style={st.stageTop}>
        <Meta style={{ color: C.ink40 }}>CLASS RECORD</Meta>
        <Meta style={{ color: C.ink40 }}>NO FILM</Meta>
      </View>
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <View style={st.filmGate}>
          <Sparkle size={9} color={C.ink40} />
        </View>
        <Text style={st.emptyTitle}>{title}</Text>
        <Text style={st.emptyCaption}>{caption}</Text>
      </View>
      <View style={st.stageBottom}>
        <View style={st.progressTrack} />
      </View>
    </View>
  );
}

export default function ParentScreen({ onLogout }: { onLogout: () => void }) {
  const { student, profile } = useStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stage, setStage] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tab, setTab] = useState<'video' | 'note'>('video');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState('');

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const name = student?.name ?? '';

  const submitPassword = async () => {
    if (pwBusy) return;
    setPwMsg('');
    if (pw.length < MIN_PASSWORD) {
      setPwMsg(`비밀번호는 ${MIN_PASSWORD}자 이상으로 정해 주세요.`);
      return;
    }
    if (pw !== pw2) {
      setPwMsg('두 비밀번호가 서로 다릅니다.');
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(pw);
      setPw('');
      setPw2('');
      setPwOpen(false);
      setPwMsg('비밀번호를 바꿨습니다. 다음 로그인부터 새 비밀번호를 쓰시면 됩니다.');
    } catch (e) {
      setPwMsg(e instanceof ApiError ? e.message : '비밀번호를 바꾸지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setPwBusy(false);
    }
  };

  const load = useCallback(async () => {
    if (!student) {
      setStage('error');
      return;
    }
    setStage('loading');
    try {
      const rows = await listLessons(student.id);
      setLessons(rows);
      setActiveId((prev) => prev ?? rows[0]?.id ?? null);
      setExpanded((prev) => prev ?? rows[0]?.id ?? null);
      setStage('ready');
    } catch {
      setStage('error');
    }
  }, [student]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = lessons.find((l) => l.id === activeId) ?? lessons[0] ?? null;

  // 서명 URL — 비공개 버킷이라 매번 새로 발급받는다.
  useEffect(() => {
    let alive = true;
    setUrl(null);
    setUrlError('');
    if (!active?.video_path) return;
    videoUrl(active.video_path)
      .then((u) => alive && setUrl(u))
      .catch((e) => alive && setUrlError(e instanceof ApiError ? e.message : '영상을 열지 못했습니다.'));
    return () => {
      alive = false;
    };
  }, [active?.video_path]);

  const hasVideo = Boolean(active?.video_path);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio={`02 — ${name || 'PARENT'}`} onBack={onLogout} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 아이 신원 */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={[eyebrow, { color: C.clay }]}>
              {student?.age_label ? student.age_label : 'AVRIL ENCOOLISH'}
              {lessons.length ? ` · ${count(lessons.length, 'RECORD', 'RECORDS')}` : ''}
            </Text>
            <Text style={st.childName}>{name}의 방</Text>
            <Text style={st.tagline}>
              {active ? `최근 수업 ${koreanDate(active.lesson_date)}` : '선생님이 남긴 기록이 여기에 쌓입니다.'}
            </Text>
          </View>
          <TextLink label="로그아웃" onPress={onLogout} color={C.ink40} />
        </View>

        <View style={{ marginTop: 20, marginBottom: 18 }}>
          <Tabs
            value={tab}
            onChange={(k) => setTab(k as 'video' | 'note')}
            items={[
              { key: 'video', label: '수업 영상', sub: `영상 ${lessons.length}` },
              { key: 'note', label: '수업노트', sub: `노트 ${lessons.length}` },
            ]}
          />
        </View>

        {stage === 'loading' ? (
          <Text style={st.quiet}>불러오는 중…</Text>
        ) : stage === 'error' ? (
          <View>
            <Text style={st.errorText}>기록을 불러오지 못했습니다.</Text>
            <View style={{ marginTop: 12 }}>
              <TextLink label="다시 시도" onPress={() => void load()} color={C.clay} />
            </View>
          </View>
        ) : lessons.length === 0 ? (
          <>
            <EmptyStage
              title="아직 올라온 기록이 없어요."
              caption={'선생님이 수업을 마치면\n이 방에 영상과 노트가 도착합니다.'}
            />
            <Text style={st.separation}>
              {name}의 방은 {profile?.username ? '어머님 계정' : '이 계정'}으로만 열립니다. 다른 아이의 기록은 보이지 않습니다.
            </Text>
          </>
        ) : tab === 'video' ? (
          <>
            {hasVideo ? (
              <View style={st.videoBox}>
                {url ? (
                  Platform.OS === 'web' ? (
                    <WebVideo uri={url} />
                  ) : (
                    <NativeVideo uri={url} />
                  )
                ) : (
                  <View style={st.videoPending}>
                    <Text style={st.videoPendingText}>{urlError || '영상을 준비하는 중…'}</Text>
                  </View>
                )}
              </View>
            ) : (
              <EmptyStage title="이 날은 영상이 없습니다." caption={'수업노트만 남아 있어요.\n노트 탭에서 읽어 보세요.'} />
            )}

            {active ? (
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[eyebrow, { color: C.ink40, letterSpacing: 0.4 }]}>{koreanDate(active.lesson_date)}</Text>
                  <Meta style={{ color: C.ink40 }}>UPLOADED BY BOMI</Meta>
                </View>
                <Text style={st.lessonTitle}>{active.title}</Text>
                {active.summary ? (
                  <Text style={st.lessonSub} numberOfLines={2}>
                    {active.summary}
                  </Text>
                ) : null}
                <View style={{ marginTop: 14 }}>
                  <TextLink label="이 날의 수업노트 읽기 →" onPress={() => setTab('note')} color={C.clay} />
                </View>
              </View>
            ) : null}

            <View style={{ marginTop: 30 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>PREVIOUS CLASSES</Text>
                <Meta style={{ color: C.ink40 }}>{count(lessons.length, 'FILM', 'FILMS')}</Meta>
              </View>
              <Rule />
              {lessons.map((l) => {
                const on = l.id === active?.id;
                return (
                  <View key={l.id}>
                    <Pressable
                      onPress={() => setActiveId(l.id)}
                      style={({ pressed }) => [st.row, { opacity: pressed ? 0.6 : 1 }]}
                    >
                      <View style={{ width: 46 }}>
                        <Text style={[st.rowDate, on && { color: C.clay }]}>{shortDate(l.lesson_date)}</Text>
                        <Text style={st.rowDur}>{l.video_path ? 'FILM' : 'NOTE'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[st.rowTitle, on && { color: C.clay }]}>{l.title}</Text>
                        <Text style={st.rowMeta}>{l.video_path ? '선생님 업로드 영상' : '수업 기록'}</Text>
                      </View>
                      <View style={[st.dot, on && { backgroundColor: C.clay, borderColor: C.clay }]} />
                    </Pressable>
                    <Rule />
                  </View>
                );
              })}
            </View>
            <Text style={st.separation}>
              영상은 {name}의 방에만 올라옵니다. 다른 아이의 계정에서는 보이지 않습니다.
            </Text>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>LESSON NOTES</Text>
              <Meta style={{ color: C.ink40 }}>BY BOMI</Meta>
            </View>
            <Rule />
            {lessons.map((l, idx) => {
              const open = expanded === l.id;
              return (
                <View key={l.id}>
                  <Pressable
                    onPress={() => setExpanded(open ? null : l.id)}
                    style={{ paddingTop: 18, paddingBottom: 14 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[eyebrow, { color: idx === 0 ? C.clay : C.ink40, letterSpacing: 0.4 }]}>
                        {koreanDate(l.lesson_date)}
                      </Text>
                      <Meta style={{ color: C.ink40 }}>{open ? '−' : '+'}</Meta>
                    </View>
                    <Text style={st.noteTitle}>{l.title}</Text>
                  </Pressable>

                  {open ? (
                    <View style={{ paddingBottom: 22 }}>
                      {l.summary ? <Text style={[body, { marginTop: 4 }]}>{l.summary}</Text> : null}

                      {l.words?.length ? (
                        <View style={{ marginTop: 20 }}>
                          <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2, marginBottom: 8 }]}>
                            TODAY'S EXPRESSIONS
                          </Text>
                          {l.words.map((w) => (
                            <View key={w} style={st.expRow}>
                              <Text style={st.expEn}>{w}</Text>
                              <Text style={st.expKo}>{meaningOf(w)}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {l.homework ? (
                        <View style={st.mission}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Sparkle size={6} color={C.sage} />
                            <Text style={[eyebrow, { marginLeft: 7, fontSize: 8.5, letterSpacing: 2 }]}>
                              5 MINUTES AT HOME
                            </Text>
                          </View>
                          <Text style={st.missionText}>{l.homework}</Text>
                        </View>
                      ) : null}

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

        {/* 어머님 계정 — 초기 비밀번호를 받은 어머님이 직접 바꾼다. */}
        <View style={{ marginTop: 34 }}>
          <Rule />
          <View style={{ paddingTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>ACCOUNT</Text>
              <Meta style={{ color: C.ink40 }}>{profile?.username?.toUpperCase()}</Meta>
            </View>
            {pwOpen ? (
              <View style={{ marginTop: 14 }}>
                <Field
                  label="새 비밀번호"
                  hint={`${MIN_PASSWORD}자 이상`}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  value={pw}
                  onChangeText={(t) => {
                    setPw(t);
                    setPwMsg('');
                  }}
                />
                <Field
                  label="새 비밀번호 확인"
                  secureTextEntry
                  autoCapitalize="none"
                  value={pw2}
                  onChangeText={(t) => {
                    setPw2(t);
                    setPwMsg('');
                  }}
                />
                {pwMsg ? <Text style={st.pwMsg}>{pwMsg}</Text> : null}
                <PrimaryButton
                  label={pwBusy ? '바꾸는 중…' : '비밀번호 바꾸기'}
                  tone="ink"
                  onPress={submitPassword}
                  disabled={pwBusy}
                />
                <View style={{ marginTop: 14 }}>
                  <TextLink label="닫기" onPress={() => setPwOpen(false)} color={C.ink40} />
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                <TextLink label="비밀번호 변경 →" onPress={() => setPwOpen(true)} color={C.clay} />
                {pwMsg ? <Text style={st.pwMsg}>{pwMsg}</Text> : null}
              </View>
            )}
          </View>
        </View>

        <Colophon note={`PRIVATE · ${name}`} />
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
  stageBottom: {},
  filmGate: {
    width: 44,
    height: 44,
    borderWidth: S.hair,
    borderColor: C.ruleStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,247,242,0.72)',
  },
  emptyTitle: {
    fontFamily: F.krSans,
    fontSize: 12.5,
    color: C.ink70,
    marginTop: 14,
    textAlign: 'center',
  },
  emptyCaption: {
    fontFamily: F.krSans,
    fontSize: 10.5,
    lineHeight: 17,
    color: C.ink40,
    marginTop: 6,
    textAlign: 'center',
  },
  progressTrack: { height: 1, backgroundColor: C.rule, marginTop: 10 },
  videoBox: {
    height: 196,
    borderWidth: S.hair,
    borderColor: C.ruleStrong,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  videoPending: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  videoPendingText: {
    fontFamily: F.krSans,
    fontSize: 11.5,
    lineHeight: 18,
    color: 'rgba(250,247,242,0.72)',
    textAlign: 'center',
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
  quiet: { fontFamily: F.krSans, fontSize: 12, color: C.ink40, paddingVertical: 30 },
  errorText: { fontFamily: F.krSans, fontSize: 12.5, color: C.clay, paddingVertical: 20 },
  pwMsg: {
    fontFamily: F.krSans,
    fontSize: 11.5,
    lineHeight: 18,
    color: C.clay,
    marginTop: 8,
    marginBottom: 10,
  },
});
