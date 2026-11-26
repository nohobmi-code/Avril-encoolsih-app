import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F, S, body, eyebrow } from '../theme';
import { Field, Header, PrimaryButton, TextLink } from '../components/ui';
import { ApiError, MIN_PASSWORD, USERNAME_RE } from '../lib/api';
import { useStore } from '../store';
import { SignupRequest } from '../types';

export default function SignupScreen({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: (request: SignupRequest) => void;
}) {
  const { signUp } = useStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setError('');
    const uname = id.trim().toLowerCase();
    if (!name.trim()) {
      setError('아이 이름을 적어 주세요.');
      return;
    }
    if (!USERNAME_RE.test(uname)) {
      setError('사용할 아이디는 영문 소문자·숫자로 3~24자입니다. (예: mina2026)');
      return;
    }
    if (pw.length < MIN_PASSWORD) {
      setError(`비밀번호는 ${MIN_PASSWORD}자 이상으로 정해 주세요.`);
      return;
    }
    if (pw !== pw2) {
      setError('두 비밀번호가 서로 다릅니다.');
      return;
    }
    setBusy(true);
    try {
      const request = await signUp({ childName: name, ageLabel: age, username: uname, password: pw });
      onDone(request);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '가입 신청을 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio="02 — PARENT" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../../assets/brand-heart.png')}
          style={{ width: 76, height: 68, marginBottom: 12 }}
          resizeMode="contain"
        />
        <Text style={[eyebrow, { color: C.clay }]}>NEW ROOM</Text>
        <Text style={s.title}>아이의 방을 신청합니다.</Text>
        <Text style={s.lead}>
          아이마다 방이 하나씩 있습니다.{'\n'}
          신청을 보내면 선생님이 확인한 뒤 방을 열어 드립니다.
        </Text>

        <View style={{ marginTop: 28 }}>
          <Field
            label="아이 이름"
            placeholder="예: 지우"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError('');
            }}
          />
          <Field
            label="나이 · 반"
            hint="선택"
            placeholder="예: 6세 · 화목"
            value={age}
            onChangeText={setAge}
          />
          <Field
            label="사용할 아이디"
            hint="영문 소문자·숫자 3~24자"
            placeholder="예: jiwoo2026"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            value={id}
            onChangeText={(t) => {
              setId(t.replace(/\s/g, '').toLowerCase());
              setError('');
            }}
          />
          <Field
            label="비밀번호"
            hint={`${MIN_PASSWORD}자 이상`}
            placeholder="직접 정하실 비밀번호"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            value={pw}
            onChangeText={(t) => {
              setPw(t);
              setError('');
            }}
          />
          <Field
            label="비밀번호 확인"
            placeholder="한 번 더"
            secureTextEntry
            autoCapitalize="none"
            value={pw2}
            onChangeText={(t) => {
              setPw2(t);
              setError('');
            }}
            onSubmitEditing={submit}
            returnKeyType="go"
          />
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <PrimaryButton
          label={busy ? '신청을 보내는 중…' : '가입 신청 보내기'}
          onPress={submit}
          disabled={busy}
        />

        <View style={{ marginTop: 18 }}>
          <TextLink label="이미 계정이 있으신가요? 로그인 →" onPress={onBack} color={C.clay} />
        </View>

        <View style={{ flexDirection: 'row', marginTop: 30 }}>
          <View style={{ width: 1, backgroundColor: C.sage, marginRight: 14, opacity: 0.5 }} />
          <Text style={s.privacy}>
            승인 전에는 아이의 영상과 수업노트가 하나도 보이지 않습니다.{'\n'}
            아이디와 비밀번호는 직접 정하시고, 승인 뒤에 언제든 바꾸실 수 있습니다.
          </Text>
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
