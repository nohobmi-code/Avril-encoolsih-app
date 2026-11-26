import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F, S, body, eyebrow } from '../theme';
import { Colophon, Field, Header, Meta, PrimaryButton, Rule, Sparkle, TextLink } from '../components/ui';
import { ApiError, StudentRow, changePassword, createStudent, listStudents } from '../lib/api';
import { shortDate, useStore } from '../store';

const EMPTY = { name: '', ageLabel: '', username: '', password: '' };

export default function TeacherScreen({
  onBack,
  onEnterRoom,
  onSignOut,
}: {
  onBack: () => void;
  onEnterRoom: (studentId: string) => void;
  onSignOut: () => void;
}) {
  const { profile, reload } = useStore();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      setStudents(await listStudents());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '아이 목록을 불러오지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitStudent = async () => {
    if (saving) return;
    setFormError('');
    setSaving(true);
    try {
      const student = await createStudent(form);
      setNotice(`${student.name}의 방을 만들었습니다. 어머님께 아이디 「${student.parent_username}」와 정하신 비밀번호를 전해 주세요.`);
      setForm(EMPTY);
      setOpen(false);
      await load();
      await reload();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : '아이를 등록하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = async () => {
    if (pwBusy) return;
    setPwMsg('');
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
      setPwMsg('비밀번호를 바꿨습니다.');
    } catch (e) {
      setPwMsg(e instanceof ApiError ? e.message : '비밀번호를 바꾸지 못했습니다.');
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio="03 — STUDIO" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 26, paddingBottom: 44 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={[eyebrow, { color: C.clay }]}>TEACHER STUDIO</Text>
          <TextLink label="로그아웃" onPress={onSignOut} color={C.ink40} />
        </View>
        <Text style={s.title}>오늘의 방을 고르세요.</Text>
        <Text style={s.lead}>
          아이의 방에 들어가 그날의 영상과 노트를 올립니다.{'\n'}
          올린 기록은 그 아이의 어머님 계정에만 나타납니다.
        </Text>

        {notice ? (
          <View style={s.notice}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Sparkle size={6} color={C.sage} />
              <Text style={[eyebrow, { marginLeft: 7, fontSize: 8.5, letterSpacing: 2, color: C.sage }]}>SAVED</Text>
            </View>
            <Text style={s.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, marginBottom: 8 }}>
          <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>MY STUDENTS</Text>
          <Meta style={{ color: C.ink40 }}>{students.length} {students.length === 1 ? 'ROOM' : 'ROOMS'}</Meta>
        </View>
        <Rule />

        {busy ? (
          <Text style={s.quiet}>불러오는 중…</Text>
        ) : error ? (
          <View style={{ paddingVertical: 18 }}>
            <Text style={s.error}>{error}</Text>
            <View style={{ marginTop: 10 }}>
              <TextLink label="다시 시도" onPress={() => void load()} color={C.clay} />
            </View>
          </View>
        ) : students.length === 0 ? (
          <Text style={s.quiet}>아직 등록된 아이가 없습니다. 아래에서 첫 아이를 등록해 주세요.</Text>
        ) : (
          students.map((c) => (
            <View key={c.id}>
              <Pressable
                onPress={() => onEnterRoom(c.id)}
                style={({ pressed }) => [s.row, { opacity: pressed ? 0.6 : 1 }]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={s.name}>{c.name}</Text>
                    {c.age_label ? <Text style={s.meta}>{c.age_label}</Text> : null}
                  </View>
                  <Text style={s.line}>어머님 아이디 · {c.parent_username}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Sparkle size={5} color={C.sage} />
                    <Meta style={{ color: C.ink40, marginLeft: 6 }}>
                      {c.lastDate ? `최근 ${shortDate(c.lastDate)}` : '아직 기록 없음'} · 노트 {c.lessonCount}편
                    </Meta>
                  </View>
                </View>
                <Text style={s.arrow}>→</Text>
              </Pressable>
              <Rule />
            </View>
          ))
        )}

        {/* 새 학생 등록 */}
        <View style={{ marginTop: 26 }}>
          {open ? (
            <View style={s.formBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>NEW STUDENT</Text>
                <TextLink label="닫기" onPress={() => setOpen(false)} color={C.ink40} />
              </View>

              <Field
                label="아이 이름"
                placeholder="예: 지우"
                value={form.name}
                onChangeText={(t) => {
                  setForm((f) => ({ ...f, name: t }));
                  setFormError('');
                }}
              />
              <Field
                label="나이 · 반"
                hint="선택"
                placeholder="예: 6세 · 화목"
                value={form.ageLabel}
                onChangeText={(t) => setForm((f) => ({ ...f, ageLabel: t }))}
              />
              <Field
                label="어머님 아이디"
                hint="영문 소문자·숫자 3~24자"
                placeholder="예: jiwoo2026"
                autoCapitalize="none"
                autoCorrect={false}
                value={form.username}
                onChangeText={(t) => {
                  setForm((f) => ({ ...f, username: t.replace(/\s/g, '').toLowerCase() }));
                  setFormError('');
                }}
              />
              <Field
                label="어머님 비밀번호"
                hint="6자 이상"
                placeholder="정하신 비밀번호"
                secureTextEntry
                autoCapitalize="none"
                value={form.password}
                onChangeText={(t) => {
                  setForm((f) => ({ ...f, password: t }));
                  setFormError('');
                }}
              />

              {formError ? <Text style={s.error}>{formError}</Text> : null}

              <PrimaryButton
                label={saving ? '만드는 중…' : '이 아이의 방 만들기'}
                onPress={submitStudent}
                disabled={saving}
              />
              <Text style={s.formNote}>
                아이디와 비밀번호는 어머님께 직접 전해 주세요. 앱에는 어떤 아이디가 있는지 표시되지 않습니다.
              </Text>
            </View>
          ) : (
            <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [s.addRow, { opacity: pressed ? 0.6 : 1 }]}>
              <Text style={s.addPlus}>＋</Text>
              <Text style={s.addLabel}>새 학생 등록</Text>
              <Text style={s.arrow}>→</Text>
            </Pressable>
          )}
        </View>

        <Text style={s.note}>
          방은 아이마다 따로 있습니다. 한 아이의 영상과 노트는 다른 아이의 계정으로 옮겨지지 않습니다.
        </Text>

        {/* 선생님 계정 */}
        <View style={{ marginTop: 30 }}>
          <Rule />
          <View style={{ paddingTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>TEACHER ACCOUNT</Text>
              <Meta style={{ color: C.ink40 }}>{profile?.username?.toUpperCase()}</Meta>
            </View>
            {pwOpen ? (
              <View style={{ marginTop: 14 }}>
                <Field
                  label="새 비밀번호"
                  hint="6자 이상"
                  secureTextEntry
                  autoCapitalize="none"
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
                {pwMsg ? <Text style={[s.error, { marginTop: 0 }]}>{pwMsg}</Text> : null}
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
                <TextLink label="선생님 비밀번호 변경 →" onPress={() => setPwOpen(true)} color={C.clay} />
                {pwMsg ? <Text style={[s.quiet, { paddingVertical: 8 }]}>{pwMsg}</Text> : null}
              </View>
            )}
          </View>
        </View>

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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: S.hair,
    borderColor: C.ruleStrong,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  addPlus: { fontFamily: F.krSans, fontSize: 14, color: C.clay, marginRight: 10 },
  addLabel: { flex: 1, fontFamily: F.krSans, fontSize: 13, color: C.ink },
  formBox: {
    borderWidth: S.hair,
    borderColor: C.ruleStrong,
    padding: 16,
    backgroundColor: C.paperShade,
  },
  formNote: {
    fontFamily: F.krSans,
    fontSize: 10.5,
    lineHeight: 17,
    color: C.ink40,
    marginTop: 12,
  },
  note: {
    fontFamily: F.krSans,
    fontSize: 10.5,
    lineHeight: 17,
    color: C.ink40,
    marginTop: 22,
  },
  quiet: { fontFamily: F.krSans, fontSize: 12, color: C.ink40, paddingVertical: 20 },
  error: { fontFamily: F.krSans, fontSize: 12, lineHeight: 19, color: C.clay, marginBottom: 12, marginTop: 4 },
  notice: {
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: S.hair,
    borderTopColor: C.ruleStrong,
  },
  noticeText: { fontFamily: F.krSans, fontSize: 12, lineHeight: 20, color: C.ink70, marginTop: 4 },
});
