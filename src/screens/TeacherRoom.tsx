import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { C, F, S, body, eyebrow } from '../theme';
import { Colophon, Field, Header, Meta, PrimaryButton, Rule, Sparkle, TextLink } from '../components/ui';
import {
  ApiError,
  createLesson,
  deleteStudent,
  getStudent,
  listLessons,
  todayISO,
  uploadVideo,
  uploadVideoNative,
} from '../lib/api';
import { koreanDate, shortDate, useStore } from '../store';
import { Lesson, Student } from '../types';

type Picked = { name: string; size?: number; file?: File | Blob; uri?: string; mime?: string };

const mb = (bytes?: number) => (bytes ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : '');

export default function TeacherRoomScreen({
  studentId,
  onBack,
}: {
  studentId: string;
  onBack: () => void;
}) {
  const { reload } = useStore();
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const [topic, setTopic] = useState('');
  const [words, setWords] = useState('');
  const [comment, setComment] = useState('');
  const [mission, setMission] = useState('');
  const [video, setVideo] = useState<Picked | null>(null);
  const [hint, setHint] = useState('');
  const [progress, setProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, rows] = await Promise.all([getStudent(studentId), listLessons(studentId)]);
      setStudent(s);
      setLessons(rows);
    } catch {
      setHint('아이 방을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickVideo = async (from: 'library' | 'camera') => {
    setHint('');
    setProgress('');
    try {
      if (Platform.OS === 'web') {
        inputRef.current?.click();
        return;
      }
      const perm =
        from === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setHint('카메라·사진 접근 권한이 필요합니다. 기기 설정에서 허용해 주세요.');
        return;
      }
      const res =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 600, quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      setVideo({
        uri: a.uri,
        name: a.fileName || `class-${Date.now()}.mp4`,
        size: a.fileSize,
        mime: a.mimeType ?? 'video/mp4',
      });
    } catch {
      setHint('영상을 불러오지 못했습니다. 다시 시도해 주세요.');
    }
  };

  const save = async () => {
    if (saving) return;
    setHint('');
    setDone(false);
    if (!topic.trim()) {
      setHint('오늘의 주제를 먼저 적어 주세요.');
      return;
    }
    setSaving(true);
    try {
      let path: string | null = null;
      if (video) {
        setProgress(video.size ? `영상을 올리는 중… (${mb(video.size)})` : '영상을 올리는 중…');
        path = video.file
          ? await uploadVideo(studentId, video.file, video.name)
          : await uploadVideoNative(studentId, video.uri!, video.name, video.mime ?? 'video/mp4');
      }
      setProgress('노트를 저장하는 중…');
      const list = words
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);
      await createLesson({
        studentId,
        title: topic,
        summary: comment,
        homework: mission,
        words: list,
        videoPath: path,
      });
      setProgress('');
      setTopic('');
      setWords('');
      setComment('');
      setMission('');
      setVideo(null);
      setDone(true);
      await load();
    } catch (e) {
      setProgress('');
      setHint(e instanceof ApiError ? e.message : '저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const removeRoom = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteStudent(studentId);
      await reload();
      onBack();
    } catch (e) {
      setHint(e instanceof ApiError ? e.message : '아이 방을 지우지 못했습니다.');
      setDeleting(false);
    }
  };

  const name = student?.name ?? '';

  const webInput =
    Platform.OS === 'web'
      ? React.createElement('input', {
          ref: inputRef,
          type: 'file',
          accept: 'video/*',
          style: { display: 'none' },
          onChange: (e: any) => {
            const f: File | undefined = e?.target?.files?.[0];
            if (f) setVideo({ file: f, name: f.name, size: f.size, mime: f.type });
            if (e?.target) e.target.value = '';
          },
        })
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      {webInput}
      <Header folio={`03 — ${name || 'STUDIO'}`} onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: S.pad, paddingTop: 22, paddingBottom: 44 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[eyebrow, { color: C.clay }]}>{student?.age_label ? student.age_label : 'STUDENT ROOM'}</Text>
          <Meta style={{ color: C.ink40 }}>{koreanDate(todayISO())}</Meta>
        </View>

        <Text style={s.title}>{name} 전용 방</Text>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <View style={{ width: 1, backgroundColor: C.sage, opacity: 0.5, marginRight: 12 }} />
          <Text style={s.privacy}>
            여기 올린 영상과 노트는 {name}의 어머님 계정에만 보입니다.{'\n'}
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
                  <Meta style={{ color: C.clay, marginLeft: 6 }}>
                    {mb(video.size) ? `${mb(video.size)} · ` : ''}올릴 준비됨
                  </Meta>
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
                    <Text style={s.pick}>{Platform.OS === 'web' ? '영상 파일 선택' : '갤러리에서 선택'}</Text>
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
          <Meta style={{ color: C.ink40 }}>BY BOMI</Meta>
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
        {progress ? <Text style={s.progress}>{progress}</Text> : null}

        <PrimaryButton
          label={saving ? '올리는 중…' : done ? '한 번 더 올리기' : '이 방에 올리기'}
          onPress={save}
          disabled={saving}
        />

        <Text style={s.footNote}>저장하면 {name}의 어머님 계정에 즉시 반영됩니다.</Text>

        {done ? (
          <View style={s.done}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkle size={7} color={C.sage} />
              <Text style={[eyebrow, { marginLeft: 8, color: C.sage, fontSize: 8.5, letterSpacing: 2 }]}>DELIVERED</Text>
            </View>
            <Text style={s.doneTitle}>올렸습니다.</Text>
            <Text style={s.doneBody}>
              {name}의 어머님 계정에 영상과 노트가 도착했습니다.{'\n'}
              다른 아이의 방에는 아무것도 나타나지 않습니다.
            </Text>
          </View>
        ) : null}

        {/* 지난 기록 */}
        <View style={{ marginTop: 34 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[eyebrow, { fontSize: 8.5, letterSpacing: 2 }]}>RECORDS IN THIS ROOM</Text>
            <Meta style={{ color: C.ink40 }}>{lessons.length}</Meta>
          </View>
          <Rule />
          {loading ? (
            <Text style={s.quiet}>불러오는 중…</Text>
          ) : lessons.length === 0 ? (
            <Text style={s.quiet}>이 방에는 아직 기록이 없습니다.</Text>
          ) : (
            lessons.map((l) => (
              <View key={l.id}>
                <View style={s.recordRow}>
                  <View style={{ width: 46 }}>
                    <Text style={s.recordDate}>{shortDate(l.lesson_date)}</Text>
                    <Text style={s.recordMeta}>{l.video_path ? 'FILM' : 'NOTE'}</Text>
                  </View>
                  <Text style={s.recordTitle}>{l.title}</Text>
                </View>
                <Rule />
              </View>
            ))
          )}
        </View>

        {/* 방 지우기 */}
        <View style={{ marginTop: 30 }}>
          <Rule />
          <View style={{ paddingTop: 14 }}>
            {confirmDelete ? (
              <View>
                <Text style={s.dangerText}>
                  {name}의 방과 모든 영상·노트를 지웁니다. 되돌릴 수 없습니다.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <PrimaryButton label={deleting ? '지우는 중…' : '정말 지우기'} onPress={removeRoom} disabled={deleting} />
                </View>
                <View style={{ marginTop: 12 }}>
                  <TextLink label=" 취소" onPress={() => setConfirmDelete(false)} color={C.ink40} />
                </View>
              </View>
            ) : (
              <TextLink label="이 방 지우기" onPress={() => setConfirmDelete(true)} color={C.ink40} />
            )}
          </View>
        </View>

        <Colophon note={`STUDIO · ${name}`} />
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
    lineHeight: 18,
    color: C.clay,
    marginBottom: 12,
    marginTop: -4,
  },
  progress: {
    fontFamily: F.krSans,
    fontSize: 11.5,
    color: C.sage,
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
  recordRow: { paddingVertical: 13, flexDirection: 'row', alignItems: 'center' },
  recordDate: { fontFamily: F.mono, fontSize: 11, color: C.ink },
  recordMeta: { fontFamily: F.mono, fontSize: 9, color: C.ink40, marginTop: 3 },
  recordTitle: { flex: 1, fontFamily: F.krSans, fontSize: 13, color: C.ink },
  quiet: { fontFamily: F.krSans, fontSize: 11.5, color: C.ink40, paddingVertical: 16 },
  dangerText: { fontFamily: F.krSans, fontSize: 12, lineHeight: 19, color: C.clay },
});
