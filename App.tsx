import React, { useState } from 'react';
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
import WelcomeScreen from './src/screens/Welcome';
import ParentScreen from './src/screens/Parent';
import TeacherScreen from './src/screens/Teacher';
import TeacherRoomScreen from './src/screens/TeacherRoom';

function Router() {
  const { children } = useStore();
  const [screen, setScreen] = useState<Screen>({ name: 'entry' });

  switch (screen.name) {
    case 'kids':
      return <KidsScreen onBack={() => setScreen({ name: 'entry' })} />;

    case 'login':
      return (
        <LoginScreen
          onBack={() => setScreen({ name: 'entry' })}
          onSuccess={(childId) => setScreen({ name: 'welcome', childId })}
        />
      );

    case 'welcome': {
      const child = children[screen.childId];
      return (
        <WelcomeScreen
          name={child.name}
          nameEn={child.nameEn}
          onDone={() => setScreen({ name: 'parent', childId: screen.childId })}
        />
      );
    }

    case 'parent':
      return (
        <ParentScreen
          childId={screen.childId}
          onLogout={() => setScreen({ name: 'entry' })}
        />
      );

    case 'teacher':
      return (
        <TeacherScreen
          onBack={() => setScreen({ name: 'entry' })}
          onEnterRoom={(childId) => setScreen({ name: 'teacherRoom', childId })}
        />
      );

    case 'teacherRoom':
      return (
        <TeacherRoomScreen
          childId={screen.childId}
          onBack={() => setScreen({ name: 'teacher' })}
          onPreview={() => setScreen({ name: 'welcome', childId: screen.childId })}
        />
      );

    default:
      return (
        <EntryScreen
          onKids={() => setScreen({ name: 'kids' })}
          onParent={() => setScreen({ name: 'login' })}
          onTeacher={() => setScreen({ name: 'teacher' })}
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
