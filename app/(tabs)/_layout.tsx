import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HairRule } from '@/components/ui';
import { color, font } from '@/theme';

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
}

const LABELS: Record<string, string> = {
  index: 'AGENDA',
  watchlist: 'WANT TO SEE',
  curator: 'CURATOR',
};

/** Mono text tab bar — no icons, hairline top rule, red underline on active. */
function MonoTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: color.white }}>
      <HairRule />
      <View
        style={{
          flexDirection: 'row',
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 14,
        }}
      >
        {state.routes.map((route, i) => {
          const active = state.index === i;
          const label = LABELS[route.name] ?? route.name.toUpperCase();
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={{ flex: 1, alignItems: 'center' }}
              hitSlop={8}
            >
              <Text
                style={{
                  fontFamily: font.monoMedium,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: active ? color.ink : color.grey,
                  textDecorationLine: active ? 'underline' : 'none',
                  textDecorationColor: color.red,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <MonoTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: color.white },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="watchlist" />
      <Tabs.Screen name="curator" />
    </Tabs>
  );
}
