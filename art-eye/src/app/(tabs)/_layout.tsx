import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import { colors, type } from '../../lib/theme';

// Minimal shape of the react-navigation tab-bar props we use (the package is a
// transitive dependency of expo-router, so we avoid importing its types directly).
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; href?: unknown } }>;
  navigation: { navigate: (name: string) => void };
}

/** Square, hairline-topped mono tab bar with red active underlines. */
function MonoTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.hairline,
        backgroundColor: colors.paper,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {state.routes.map((route, index) => {
        const options = descriptors[route.key].options;
        if (options.href === null) return null;
        // the review tab is admin-only (expo-router strips `href` from
        // descriptor options when a custom tabBar is used, so gate here too)
        if (route.name === 'admin' && profile?.role !== 'admin') return null;
        const label = (options.title ?? route.name).toUpperCase();
        const active = state.index === index;
        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            onPress={() => navigation.navigate(route.name)}
            style={{ flex: 1, alignItems: 'center', paddingTop: 14, paddingBottom: 6 }}
          >
            <View
              style={{
                paddingBottom: 4,
                borderBottomWidth: 1,
                borderBottomColor: active ? colors.accent : 'transparent',
              }}
            >
              <Text
                style={[
                  type.mono,
                  { fontSize: 10, letterSpacing: 1.6, color: active ? colors.ink : colors.grey },
                ]}
              >
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  return (
    <Tabs
      tabBar={(props) => <MonoTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.paper } }}
    >
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="saved" options={{ title: 'Want to see' }} />
      <Tabs.Screen name="profile" options={{ title: 'Curator' }} />
      <Tabs.Screen name="admin" options={{ title: 'Review', href: isAdmin ? undefined : null }} />
    </Tabs>
  );
}
