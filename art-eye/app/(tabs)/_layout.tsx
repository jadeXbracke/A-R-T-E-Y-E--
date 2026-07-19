import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MonoLabel } from '../../src/components/Type';
import { color, space } from '../../src/theme';

const LABELS: Record<string, string> = {
  agenda: 'AGENDA',
  curation: 'WANT TO SEE',
  profile: 'CURATOR',
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.s) }]}>
      {state.routes.map((route, i) => {
        const active = state.index === i;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
          >
            <View
              style={[
                styles.tabInner,
                { borderBottomColor: active ? color.red : 'transparent' },
              ]}
            >
              <MonoLabel style={{ color: active ? color.ink : color.grey }}>
                {LABELS[route.name] ?? route.name.toUpperCase()}
              </MonoLabel>
            </View>
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
        sceneStyle: { backgroundColor: color.paper },
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="curation" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: color.hairline,
    backgroundColor: color.paper,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: 2,
  },
});
