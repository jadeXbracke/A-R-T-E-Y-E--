import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

import { useApp } from '../../lib/app-context';
import { colors, type } from '../../theme';

/**
 * Custom tab bar: hairline top rule, mono uppercase labels, red
 * active-state underline. No icons — wall-label typography only.
 */
function MonoTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        // href is an expo-router extension on tab options
        if ((options as { href?: string | null }).href === null) return null;
        const label = (options.title ?? route.name).toUpperCase();
        const active = state.index === index;
        return (
          <Pressable
            key={route.key}
            testID={`tab-${label}`}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!active && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
          >
            <Text
              numberOfLines={1}
              style={[
                type.monoButton,
                {
                  fontSize: 9,
                  letterSpacing: 0.8,
                  color: active ? colors.ink : colors.grey,
                },
              ]}
            >
              {label}
            </Text>
            <View
              style={[
                styles.underline,
                { backgroundColor: active ? colors.red : 'transparent' },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { profile } = useApp();
  const isVenueOwner = profile?.role === 'venue_owner';
  const isAdmin = profile?.role === 'admin';

  return (
    <Tabs
      tabBar={(props) => <MonoTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="saved" options={{ title: 'Want to see' }} />
      <Tabs.Screen
        name="submit"
        options={{ title: 'Submit', href: isVenueOwner ? undefined : null }}
      />
      <Tabs.Screen
        name="review"
        options={{ title: 'Review', href: isAdmin ? undefined : null }}
      />
      <Tabs.Screen name="curator" options={{ title: 'Curator' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.bg,
    paddingTop: 14,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  underline: {
    height: 1,
    alignSelf: 'stretch',
    marginHorizontal: 18,
    marginTop: 5,
  },
});
