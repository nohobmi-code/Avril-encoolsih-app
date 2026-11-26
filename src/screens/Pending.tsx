import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F, S, body, eyebrow } from '../theme';
import { Header, PrimaryButton, Rule, Sparkle, TextLink } from '../components/ui';
import { shortDate, useStore } from '../store';
import { SignupRequest } from '../types';

export default function PendingScreen({
  request,
  onLogout,
}: {
  request?: SignupRequest;
  onLogout: () => void;
}) {
  const { pending, reload } = useStore();
  const req = pending ?? request ?? null;
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const rejected = req?.status === 'rejected';

  const check = async () => {
    if (busy) return;
    setBusy(true);
    setMsg('');
    try {
      await reload();
      // 승인되면 App이 환영 화면으로 넘긴다. 아직이면 여기 남는다.
      setMsg('아직 승인 전입니다. 선생님이 확인하면 이 계정으로 방이 열립니다.');
    } catch {
      setMsg('지금은 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const rows: [string, string][] = req
    ? [
        ['아이 이름', req.child_name],
        ['나이 · 반', req.age_label || '—'],
        ['어머님 아이디', req.username],
        ['신청일', shortDate(req.created_at.slice(0, 10))],
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio="02 — PARENT" onBack={onLogout} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 30, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Sparkle size={8} color={rejected ? C.clay : C.sage} />
          <Text style={[eyebrow, { marginLeft: 9, color: rejected ? C.clay : C.sage }]}>
            {rejected ? 'NOT APPROVED' : 'WAITING FOR APPROVAL'}
          </Text>
        </View>

        <Text style={s.title}>
          {rejected ? '신청이 승인되지 않았습니다.' : '선생님 승인을 기다리고 있습니다.'}
        </Text>
        <Text style={s.lead}>
          {rejected
            ? '이번 신청은 방이 열리지 않았습니다.\n아이 이름과 아이디를 다시 확인해 선생님께 문의해 주세요.'
            : '신청이 선생님께 도착했습니다.\n선생님이 확인하면 이 계정으로 아이의 방이 열립니다.'}
        </Text>

        {req ? (
          <View style={s.card}>
            {rows.map(([label, value], i) => (
              <View key={label}>
                {i > 0 ? <Rule /> : null}
                <View style={s.row}>
                  <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 1.6, width: 92 }]}>{label}</Text>
                  <Text style={s.value}>{value}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {!rejected ? (
          <PrimaryButton label={busy ? '확인하는 중…' : '승인 확인'} onPress={check} disabled={busy} />
        ) : null}

        {msg ? <Text style={s.msg}>{msg}</Text> : null}

        <View style={{ marginTop: 18 }}>
          <TextLink label="로그아웃" onPress={onLogout} color={C.ink40} />
        </View>

        <View style={{ flexDirection: 'row', marginTop: 28 }}>
          <View style={{ width: 1, backgroundColor: C.ruleStrong, marginRight: 14 }} />
          <Text style={s.note}>
            승인 전에는 아이의 영상과 수업노트, 다른 아이의 기록이 하나도 보이지 않습니다.{'\n'}
            선생님이 승인하면 앱을 다시 열거나 「승인 확인」을 눌러 주세요.
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
    marginTop: 14,
    letterSpacing: -0.3,
  },
  lead: { ...body, fontSize: 12.5, lineHeight: 21, marginTop: 8 },
  card: {
    marginTop: 26,
    marginBottom: 24,
    borderTopWidth: S.hair,
    borderBottomWidth: S.hair,
    borderColor: C.ruleStrong,
    backgroundColor: C.paperShade,
    paddingHorizontal: 14,
  },
  row: { flexDirection: 'row', alignItems: 'baseline', paddingVertical: 13 },
  value: { flex: 1, fontFamily: F.krSans, fontSize: 13, color: C.ink },
  msg: {
    fontFamily: F.krSans,
    fontSize: 11.5,
    lineHeight: 19,
    color: C.clay,
    marginTop: 14,
  },
  note: {
    flex: 1,
    fontFamily: F.krSans,
    fontSize: 10.5,
    lineHeight: 18,
    color: C.ink40,
  },
});
