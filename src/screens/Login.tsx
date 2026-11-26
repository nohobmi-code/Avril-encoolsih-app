import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F, S, body, eyebrow } from '../theme';
import { Field, Header, Meta, PrimaryButton, Rule } from '../components/ui';
import { DEMO_PASSWORD, useStore } from '../store';
import { ChildId } from '../types';

export default function LoginScreen({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (childId: ChildId) => void;
}) {
  const { children } = useStore();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const key = id.trim().toLowerCase();
    const found = (Object.keys(children) as ChildId[]).find(
      (k) => children[k].account === key,
    );
    if (!found || pw.trim() !== DEMO_PASSWORD) {
      setError('아이디 또는 비밀번호가 맞지 않습니다.');
      return;
    }
    setError('');
    onSuccess(found);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio="02 — PARENT" onBack={onBack} />
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
        <Text style={[eyebrow, { color: C.clay }]}>PRIVATE ROOM</Text>
        <Text style={s.title}>어머님, 오늘의 방입니다.</Text>
        <Text style={s.lead}>
          아이마다 계정이 따로 있습니다.{'\n'}
          로그인한 아이의 영상과 노트만 열립니다.
        </Text>

        <View style={{ marginTop: 30 }}>
          <Field
            label="STUDENT ID"
            placeholder="yulli"
            autoCapitalize="none"
            autoCorrect={false}
            value={id}
            onChangeText={(t) => {
              setId(t);
              setError('');
            }}
          />
          <Field
            label="PASSWORD"
            hint={`DEMO ${DEMO_PASSWORD}`}
            placeholder="••••"
            secureTextEntry
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

        <PrimaryButton label="로그인" onPress={submit} />

        <View style={{ marginTop: 30 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>DEMO ACCOUNTS</Text>
            <Meta style={{ color: C.ink40 }}>TAP TO ENTER</Meta>
          </View>
          <Rule />
          {(Object.keys(children) as ChildId[]).map((k) => {
            const c = children[k];
            return (
              <View key={k}>
                <Pressable
                  onPress={() => onSuccess(k)}
                  style={({ pressed }) => [s.accountRow, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Text style={s.accountId}>{c.account}</Text>
                  <Text style={s.accountName}>
                    {c.name} · {c.age}
                  </Text>
                  <Text style={s.accountArrow}>→</Text>
                </Pressable>
                <Rule />
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', marginTop: 26 }}>
          <View style={{ width: 1, backgroundColor: C.sage, marginRight: 14, opacity: 0.5 }} />
          <Text style={s.privacy}>
            계정이 다르면 다른 아이의 영상과 수업노트는 열리지 않습니다.{'\n'}
            아이의 기록은 그 아이의 방에만 쌓입니다.
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
  lead: {
    ...body,
    fontSize: 12.5,
    lineHeight: 21,
    marginTop: 8,
  },
  error: {
    fontFamily: F.krSans,
    fontSize: 12,
    color: C.clay,
    marginBottom: 14,
    marginTop: -6,
  },
  accountRow: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  accountId: {
    fontFamily: F.mono,
    fontSize: 12,
    letterSpacing: 0.6,
    color: C.ink,
    width: 90,
  },
  accountName: {
    flex: 1,
    fontFamily: F.krSans,
    fontSize: 12.5,
    color: C.ink70,
  },
  accountArrow: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.ink40,
  },
  privacy: {
    flex: 1,
    fontFamily: F.krSans,
    fontSize: 11.5,
    lineHeight: 19,
    color: C.ink55,
  },
});
