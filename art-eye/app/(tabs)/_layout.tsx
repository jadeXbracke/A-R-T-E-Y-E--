import { router, Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetRow, SideSheet } from '../../src/components/side-sheet';
import { useAuth } from '../../src/lib/auth';
import { colors, fonts } from '../../src/theme';

// Four core tabs; everything else lives in the side menu (MENU, far right).
const LABELS: Record<string, string> = {
  index: 'AGENDA',
  venues: 'VENUES',
  feed: 'FEED',
  saved: 'SAVED',
};

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit(opts: { type: string; target?: string; canPreventDefault?: boolean }): unknown;
    navigate(name: string): void;
  };
}

function MonoTabBar({ state, navigation, onMenu }: TabBarProps & { onMenu: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            style={styles.item}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              }) as { defaultPrevented?: boolean };
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          >
            <Text style={[styles.label, focused && { color: colors.ink }]}>
              {LABELS[route.name] ?? route.name.toUpperCase()}
            </Text>
            <View
              style={[styles.rule, focused && { backgroundColor: colors.red }]}
            />
          </Pressable>
        );
      })}
      <Pressable style={styles.item} onPress={onMenu}>
        <Text style={styles.label}>MENU ☰</Text>
        <View style={styles.rule} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { profile } = useAuth();
  const [menu, setMenu] = useState(false);

  const go = (path: string) => {
    setMenu(false);
    router.push(path);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
        }}
        tabBar={(props) => <MonoTabBar {...props} onMenu={() => setMenu(true)} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="venues" />
        <Tabs.Screen name="feed" />
        <Tabs.Screen name="saved" />
      </Tabs>

      <SideSheet title="ART EYE — MENU" visible={menu} onClose={() => setMenu(false)}>
        <SheetRow label="SEARCH" onPress={() => go('/search')} />
        <SheetRow label="＋ POST" accent onPress={() => go(profile ? '/new-post' : '/auth')} />
        <SheetRow label="FAIRS" onPress={() => go('/fairs')} />
        <SheetRow label="SUBMIT AN EXHIBITION" onPress={() => go('/submit')} />
        <SheetRow label="CURATOR — YOUR RECORD" onPress={() => go('/curator')} />
        <SheetRow label="MESSAGES" onPress={() => go(profile ? '/messages' : '/auth')} />
        <SheetRow label="ACTIVITY" onPress={() => go(profile ? '/activity' : '/auth')} />
        <SheetRow
          label={profile ? 'YOUR PROFILE' : 'SIGN IN'}
          onPress={() => go(profile ? `/profile/${profile.id}` : '/auth')}
        />
        <SheetRow label="PRIVACY & TERMS" onPress={() => go('/privacy')} />
      </SideSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 14,
  },
  item: { flex: 1, alignItems: 'center' },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.ink,
    paddingBottom: 6,
  },
  rule: { height: 2, alignSelf: 'stretch', marginHorizontal: 18, backgroundColor: 'transparent' },
});
