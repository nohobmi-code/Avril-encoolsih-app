import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { C, F, S, body, eyebrow } from '../theme';
import { Colophon, Field, Header, Meta, PrimaryButton, Rule, Sparkle, TextLink } from '../components/ui';
import { koreanDate, meaningOf, todayISO, useStore } from '../store';
import { ChildId } from '../types';

const mmss = (ms?: number | null) => {
  if (!ms) return '12:00';
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${`${total % 60}`.padStart(2, '0')}`;
};

export default function TeacherRoomScreen({
  childId,
  onBack,
  onPreview,
}: {
  childId: ChildId;
  onBack: () => void;
  onPreview: () => void;
}) {
  const { children, publish } = useStore();
  const child = children[childId];
  const todays = child.lessons.find((l) => l.date === todayISO()) ?? child.lessons[0];

  const [topic, setTopic] = useState(todays?.note.topic ?? '');
  const [words, setWords] = useState((todays?.note.words ?? []).join(', '));
  const [comment, setComment] = useState(todays?.note.comment ?? '');
  const [mission, setMission] = useState(todays?.note.mission ?? '');
  const [video, setVideo] = useState<{ uri: string; name: string; duration?: number | null } | null>(null);
  const [hint, setHint] = useState('');
  const [done, setDone] = useState(false);

  const pickVideo = async (from: 'library' | 'camera') => {
    setHint('');
    try {
      if (Platform.OS !== 'web') {
        const perm =
          from === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setHint('카메라·사진 접근 권한이 필요합니다. 기기 설정에서 허용해 주세요.');
          return;
        }
      }
      const res =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 300, quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      setVideo({ uri: a.uri, name: a.fileName || 'class-video.mp4', duration: a.duration });
    } catch {
      setHint('영상을 불러오지 못했습니다. 다시 시도해 주세요.');
    }
  };

  const save = () => {
    if (!topic.trim() || !comment.trim()) {
      setHint('오늘의 주제와 관찰 코멘트를 먼저 적어 주세요.');
      return;
    }
    const list = words
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);
    publish(childId, {
      note: {
        topic: topic.trim(),
        comment: comment.trim(),
        words: list,
        expressions: list.map((w) => ({ en: w, ko: meaningOf(w) })),
        mission: mission.trim(),
      },
      videoUri: video?.uri,
      videoName: video?.name,
      duration: mmss(video?.duration),
    });
    setHint('');
    setDone(true);
  };

  const loadToday = () => {
    setTopic(todays?.note.topic ?? '');
    setWords((todays?.note.words ?? []).join(', '));
    setComment(todays?.note.comment ?? '');
    setMission(todays?.note.mission ?? '');
    setDone(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header folio={`03 — ${child.nameEn.toUpperCase()}`} onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 22, paddingBottom: 44 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[eyebrow, { color: C.clay }]}>{child.nameEn.toUpperCase()}'S ROOM</Text>
          <Meta style={{ color: C.ink40 }}>{koreanDate(todayISO())}</Meta>
        </View>

        <Text style={s.title}>{child.name} 전용 방</Text>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <View style={{ width: 1, backgroundColor: C.sage, opacity: 0.5, marginRight: 12 }} />
          <Text style={s.privacy}>
            여기 올린 영상과 노트는 {child.name}의 어머님 계정에만 보입니다.{'\n'}
            다른 아이의 방으로는 복사되지 않습니다.
          </Text>
        </View>

        {/* 01 영상 */}
        <View style={{ marginTop: 28, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>01 · CLASS VIDEO</Text>
          <Meta style={{ color: video ? C.clay : C.ink40 }}>{video ? 'READY' : 'MP4 · MOV'}</Meta>
        </View>
        <View style={{ marginTop: 10 }}>
          <View style={s.upload}>
            {video ? (
              <View>
                <Text style={s.fileName}>{video.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Sparkle size={5} color={C.clay} />
                  <Meta style={{ color: C.clay, marginLeft: 6 }}>{mmss(video.duration)} · 올릴 준비됨</Meta>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 14 }}>
                  <TextLink label="다른 영상 선택" onPress={() => pickVideo('library')} />
                  <View style={{ width: 18 }} />
                  <TextLink label="지우기" onPress={() => setVideo(null)} color={C.ink40} />
                </View>
              </View>
            ) : (
              <View>
                <Text style={s.uploadTitle}>오늘 찍은 수업 영상을 올리세요.</Text>
                <Text style={s.uploadSub}>아이의 방에만 저장되고, 어머님만 볼 수 있습니다.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                  <Pressable onPress={() => pickVideo('library')}>
                    <Text style={s.pick}>갤러리에서 선택</Text>
                  </Pressable>
                  {Platform.OS !== 'web' ? (
                    <>
                      <View style={{ width: 1, height: 10, backgroundColor: C.ruleStrong, marginHorizontal: 14 }} />
                      <Pressable onPress={() => pickVideo('camera')}>
                        <Text style={s.pick}>촬영하기</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 02 노트 */}
        <View style={{ marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>02 · LESSON NOTE</Text>
          <TextLink label="오늘 노트 불러오기" onPress={loadToday} color={C.ink40} />
        </View>

        <View style={{ marginTop: 18 }}>
          <Field
            label="TODAY'S TOPIC"
            value={topic}
            onChangeText={setTopic}
            placeholder="Short a — cat · hat · map"
            multiline
            minLines={1}
          />
          <Field
            label="KEY WORDS"
            hint="콤마로 구분"
            value={words}
            onChangeText={setWords}
            placeholder="cat, hat, map"
            autoCapitalize="none"
          />
          <Field
            label="OBSERVATION · 성향과 강점"
            value={comment}
            onChangeText={setComment}
            placeholder="오늘 아이가 보인 장면과 강점을 적어 주세요."
            multiline
          />
          <Field
            label="HOME MISSION · 5분"
            value={mission}
            onChangeText={setMission}
            placeholder="집에서 부모님과 해볼 짧은 놀이"
            multiline
          />
        </View>

        {hint ? <Text style={s.hint}>{hint}</Text> : null}

        <PrimaryButton label={done ? '다시 올리기' : '이 방에 올리기'} onPress={save} />

        <Text style={s.footNote}>
          저장하면 {child.name}의 어머님 계정에 즉시 반영됩니다.
        </Text>

        {done ? (
          <View style={s.done}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkle size={7} color={C.sage} />
              <Text style={[eyebrow, { marginLeft: 8, color: C.sage, fontSize: 8.5, letterSpacing: 2 }]}>
                DELIVERED
              </Text>
            </View>
            <Text style={s.doneTitle}>올렸습니다.</Text>
            <Text style={s.doneBody}>
              {child.name}의 어머님 계정에 영상과 노트가 도착했습니다.{'\n'}
              다른 아이의 방에는 아무것도 나타나지 않습니다.
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <TextLink label="어머님 화면 미리보기 →" onPress={onPreview} color={C.clay} />
            </View>
          </View>
        ) : null}

        <Colophon note={`STUDIO · ${child.nameEn.toUpperCase()}`} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  title: {
    fontFamily: F.krSerif,
    fontSize: 26,
    lineHeight: 38,
    color: C.ink,
    marginTop: 10,
    letterSpacing: -0.3,
  },
  privacy: {
    flex: 1,
    fontFamily: F.krSans,
    fontSize: 11,
    lineHeight: 18,
    color: C.ink55,
  },
  upload: {
    borderWidth: S.hair,
    borderColor: C.ruleStrong,
    padding: 16,
    backgroundColor: C.paperShade,
  },
  uploadTitle: {
    fontFamily: F.krSans,
    fontSize: 13,
    color: C.ink,
  },
  uploadSub: {
    fontFamily: F.krSans,
    fontSize: 10.5,
    lineHeight: 17,
    color: C.ink40,
    marginTop: 5,
  },
  pick: {
    fontFamily: F.krSans,
    fontSize: 12,
    color: C.clay,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(164,87,47,0.4)',
  },
  fileName: {
    fontFamily: F.serif,
    fontSize: 18,
    color: C.ink,
    letterSpacing: -0.2,
  },
  hint: {
    fontFamily: F.krSans,
    fontSize: 11.5,
    color: C.clay,
    marginBottom: 12,
    marginTop: -4,
  },
  footNote: {
    fontFamily: F.krSans,
    fontSize: 10.5,
    color: C.ink40,
    marginTop: 12,
    textAlign: 'center',
  },
  done: {
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: S.hair,
    borderTopColor: C.ruleStrong,
  },
  doneTitle: {
    fontFamily: F.krSerif,
    fontSize: 20,
    color: C.ink,
    marginTop: 10,
  },
  doneBody: {
    ...body,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 6,
  },
});
