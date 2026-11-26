import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F, S, body, eyebrow } from '../theme';
import { Field, Header, PrimaryButton, TextLink } from '../components/ui';
import { Account, ApiError } from '../lib/api';
import { useStore } from '../store';
import { Role } from '../types';

const COPY: Record<Role, { folio: string; eyebrow: string; title: string; lead: string; aside: string; switch: string }> = {
  parent: {
    folio: '02 — PARENT',
    eyebrow: 'PRIVATE ROOM',
    title: '어머님, 오늘의 방입니다.',
    lead: '아이마다 계정이 따로 있습니다.\n로그인한 아이의 영상과 노트만 열립니다.',
    aside: '계정이 다르면 다른 아이의 영상과 수업노트는 열리지 않습니다.\n아이의 기록은 그 아이의 방에만 쌓입니다.',
    switch: '선생님이신가요? →',
  },
  teacher: {
    folio: '03 — STUDIO',
    eyebrow: 'TEACHER STUDIO',
    title: '선생님 로그인.',
    lead: '선생님 계정으로만 열리는 관리자 화면입니다.\n아이 등록과 영상·수업노트는 여기서만 할 수 있습니다.',
    aside: '선생님 계정은 앱 관리자만 발급합니다.\n비밀번호를 잊으셨다면 Supabase 프로젝트에서 다시 정할 수 있습니다.',
    switch: '어머님 로그인이신가요? →',
  },
};

export default function LoginScreen({
  mode,
  onBack,
  onSwitch,
  onSignup,
  onSuccess,
}: {
  mode: Role;
  onBack: () => void;
  onSwitch: () => void;
  onSignup: () => void;
  onSuccess: (account: Account) => void;
}) {
  const { signIn } = useStore();
  const copy = COPY[mode];
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const account = await signIn(id, pw);
      onSuccess(account);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '로그인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio={copy.folio} onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 26, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../../assets/brand-heart.png')}
          style={{ width: 92, height: 82, marginBottom: 14 }}
          resizeMode="contain"
        />
        <Text style={[eyebrow, { color: C.clay }]}>{copy.eyebrow}</Text>
        <Text style={s.title}>{copy.title}</Text>
        <Text style={s.lead}>{copy.lead}</Text>

        <View style={{ marginTop: 30 }}>
          <Field
            label={mode === 'teacher' ? 'TEACHER ID' : "MOTHER'S ID"}
            placeholder="아이디"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            value={id}
            onChangeText={(t) => {
              setId(t);
              setError('');
            }}
          />
          <Field
            label="PASSWORD"
            placeholder="비밀번호"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            value={pw}
            onChangeText={(t) => {
              setPw(t);
              setError('');
            }}
            onSubmitEditing={submit}
            returnKeyType="go"
          />
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <PrimaryButton label={busy ? '확인 중…' : '로그인'} onPress={submit} disabled={busy} />

        <View style={{ marginTop: 26 }}>
          <TextLink label={copy.switch} onPress={onSwitch} color={C.clay} />
        </View>

        {mode === 'parent' ? (
          <View style={{ marginTop: 14 }}>
            <TextLink label="어머님 회원가입 →" onPress={onSignup} color={C.sage} />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', marginTop: 30 }}>
          <View style={{ width: 1, backgroundColor: C.sage, marginRight: 14, opacity: 0.5 }} />
          <Text style={s.privacy}>{copy.aside}</Text>
        </View>
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
  error: {
    fontFamily: F.krSans,
    fontSize: 12,
    lineHeight: 19,
    color: C.clay,
    marginBottom: 14,
    marginTop: -6,
  },
  privacy: {
    flex: 1,
    fontFamily: F.krSans,
    fontSize: 11.5,
    lineHeight: 19,
    color: C.ink55,
  },
});
