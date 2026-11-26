import React, { useEffect, useState } from 'react';
import { Platform, StatusBar as RNStatusBar, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Fraunces_300Light,
  Fraunces_300Light_Italic,
  Fraunces_400Regular,
} from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';

import { C } from './src/theme';
import { StoreProvider, useStore } from './src/store';
import { Screen } from './src/types';
import EntryScreen from './src/screens/Entry';
import KidsScreen from './src/screens/Kids';
import LoginScreen from './src/screens/Login';
import SignupScreen from './src/screens/Signup';
import PendingScreen from './src/screens/Pending';
import WelcomeScreen from './src/screens/Welcome';
import ParentScreen from './src/screens/Parent';
import TeacherScreen from './src/screens/Teacher';
import TeacherRoomScreen from './src/screens/TeacherRoom';

function Router() {
  const { ready, profile, student, pending, signOut } = useStore();
  const [screen, setScreen] = useState<Screen>({ name: 'entry' });

  // 세션이 끊기면 잠긴 화면에서 스스로 빠져나온다.
  useEffect(() => {
    const locked =
      screen.name === 'parent' || screen.name === 'teacher' || screen.name === 'teacherRoom' || screen.name === 'welcome';
    if (!locked) return;
    if (!profile) setScreen({ name: 'entry' });
    else if (profile.role === 'parent' && screen.name === 'teacher') setScreen({ name: 'entry' });
  }, [profile, screen]);

  // 승인 대기 화면에 있는 동안 승인이 나면 바로 환영 화면으로.
  useEffect(() => {
    if (screen.name !== 'pending') return;
    if (profile?.role === 'parent' && student) setScreen({ name: 'welcome' });
    else if (profile?.role === 'teacher') setScreen({ name: 'teacher' });
  }, [profile, student, screen.name]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.paper }} />;

  switch (screen.name) {
    case 'kids':
      return <KidsScreen onBack={() => setScreen({ name: 'entry' })} />;

    case 'login':
      return (
        <LoginScreen
          mode={screen.mode}
          onBack={() => setScreen({ name: 'entry' })}
          onSwitch={() => setScreen({ name: 'login', mode: screen.mode === 'parent' ? 'teacher' : 'parent' })}
          onSignup={() => setScreen({ name: 'signup' })}
          onSuccess={(account) =>
            setScreen(
              account.profile?.role === 'teacher'
                ? { name: 'teacher' }
                : account.pending
                  ? { name: 'pending', request: account.pending }
                  : { name: 'welcome' },
            )
          }
        />
      );

    case 'signup':
      return (
        <SignupScreen
          onBack={() => setScreen({ name: 'login', mode: 'parent' })}
          onDone={(request) => setScreen({ name: 'pending', request })}
        />
      );

    case 'pending':
      return (
        <PendingScreen
          request={screen.request}
          onLogout={async () => {
            await signOut();
            setScreen({ name: 'entry' });
          }}
        />
      );

    case 'welcome':
      return (
        <WelcomeScreen
          name={student?.name ?? ''}
          onDone={() => setScreen({ name: 'parent' })}
        />
      );

    case 'parent':
      return (
        <ParentScreen
          onLogout={async () => {
            await signOut();
            setScreen({ name: 'entry' });
          }}
        />
      );

    case 'teacher':
      return (
        <TeacherScreen
          onBack={() => setScreen({ name: 'entry' })}
          onEnterRoom={(studentId) => setScreen({ name: 'teacherRoom', studentId })}
          onSignOut={async () => {
            await signOut();
            setScreen({ name: 'entry' });
          }}
        />
      );

    case 'teacherRoom':
      return (
        <TeacherRoomScreen
          studentId={screen.studentId}
          onBack={() => setScreen({ name: 'teacher' })}
        />
      );

    default:
      return (
        <EntryScreen
          onKids={() => setScreen({ name: 'kids' })}
          onParent={() =>
            setScreen(
              profile?.role === 'parent'
                ? { name: 'parent' }
                : pending
                  ? { name: 'pending' }
                  : { name: 'login', mode: 'parent' },
            )
          }
          onTeacher={() =>
            setScreen(profile?.role === 'teacher' ? { name: 'teacher' } : { name: 'login', mode: 'teacher' })
          }
        />
      );
  }
}

function Shell() {
  const insets = useSafeAreaInsets();
  const top = Platform.OS === 'web' ? 0 : Math.max(insets.top, Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0);
  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <View style={styles.frame}>
        <Router />
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    Fraunces_300Light,
    Fraunces_300Light_Italic,
    Fraunces_400Regular,
    Inter_400Regular,
    Inter_500Medium,
  });

  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper, alignItems: 'center' },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    backgroundColor: C.paper,
    ...(Platform.OS === 'web' ? ({ overflow: 'hidden' } as any) : null),
  },
});
