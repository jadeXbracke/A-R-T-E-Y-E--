import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../src/lib/theme-context';
import { fonts } from '../../src/theme';

const TABS: Array<{ name: string; label: string }> = [
  { name: 'index', label: 'TODAY' },
  { name: 'voortgang', label: 'GROWTH' },
  { name: 'gezondheid', label: 'BODY' },
  { name: 'kennis', label: 'KNOWLEDGE' },
  { name: 'agenda', label: 'AGENDA' },
  { name: 'instellingen', label: 'MORE' },
];

// Text-only tab bar: letter-spaced caps, a single closed dot under the
// active tab — the circle motif instead of icons.
function Bar({ state, navigation }: BottomTabBarProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1, borderTopColor: palette.hairline,
        backgroundColor: palette.bg,
        paddingBottom: insets.bottom + 8, paddingTop: 12,
      }}
    >
      {state.routes.map((route, i) => {
        const active = state.index === i;
        const label = TABS.find(t => t.name === route.name)?.label ?? route.name;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={{ flex: 1, alignItems: 'center', gap: 5 }}
          >
            <Text
              style={{
                fontFamily: fonts.sansMedium, fontSize: 9, letterSpacing: 1.2,
                color: active ? palette.ink : palette.dim,
              }}
            >
              {label}
            </Text>
            <View
              style={{
                width: 4, height: 4, borderRadius: 2,
                backgroundColor: active ? palette.ink : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={props => <Bar {...props} />}>
      {TABS.map(t => <Tabs.Screen key={t.name} name={t.name} />)}
    </Tabs>
  );
}
