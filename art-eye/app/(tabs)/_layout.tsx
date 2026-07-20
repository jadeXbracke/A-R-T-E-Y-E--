import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../src/theme';

const LABELS: Record<string, string> = {
  index: 'AGENDA',
  saved: 'SAVED',
  submit: 'SUBMIT',
  curator: 'CURATOR',
};

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit(opts: { type: string; target?: string; canPreventDefault?: boolean }): unknown;
    navigate(name: string): void;
  };
}

function MonoTabBar({ state, navigation }: TabBarProps) {
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
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
      tabBar={(props) => <MonoTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="submit" />
      <Tabs.Screen name="curator" />
    </Tabs>
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
    letterSpacing: 1.8,
    color: colors.grey,
    paddingBottom: 6,
  },
  rule: { height: 2, alignSelf: 'stretch', marginHorizontal: 18, backgroundColor: 'transparent' },
});
