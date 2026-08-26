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
  { name: 'kennis', label: 'MIND' },
];
// More lives outside the tab bar (app/instellingen.tsx) — reached from the
// small entry point next to the wordmark on every screen, not a 5th tab.

export const RAIL_WIDTH = 60;

// Text-only navigation: letter-spaced caps, a single closed dot marking the
// active tab — the circle motif instead of icons. Placement is a setting:
// the classic bottom bar, or an editorial side rail (left/right) with the
// labels reading upwards.
function BottomBar({ state, navigation }: BottomTabBarProps) {
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
                color: active ? palette.inkDeep : palette.dim,
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

function SideRail({ state, navigation, side }: BottomTabBarProps & { side: 'left' | 'right' }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        position: 'absolute', top: 0, bottom: 0, [side]: 0,
        width: RAIL_WIDTH,
        backgroundColor: palette.bg,
        borderLeftWidth: side === 'right' ? 1 : 0,
        borderRightWidth: side === 'left' ? 1 : 0,
        borderColor: palette.hairline,
        alignItems: 'center', justifyContent: 'center', gap: 34,
      }}
    >
      {state.routes.map((route, i) => {
        const active = state.index === i;
        const label = TABS.find(t => t.name === route.name)?.label ?? route.name;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={{ alignItems: 'center', gap: 6 }}
          >
            {/* 96×20 label rotated into a 20×96 column, reading upwards */}
            <View style={{ width: 20, height: 96, alignItems: 'center', justifyContent: 'center' }}>
              <View
                style={{
                  width: 96, height: 20,
                  alignItems: 'center', justifyContent: 'center',
                  transform: [{ rotate: '-90deg' }],
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.sansMedium, fontSize: 9, letterSpacing: 1.6,
                    color: active ? palette.inkDeep : palette.dim,
                  }}
                >
                  {label}
                </Text>
              </View>
            </View>
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
  const { nav } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          paddingLeft: nav === 'left' ? RAIL_WIDTH : 0,
          paddingRight: nav === 'right' ? RAIL_WIDTH : 0,
        },
      }}
      tabBar={props => nav === 'bottom'
        ? <BottomBar {...props} />
        : <SideRail {...props} side={nav} />}
    >
      {TABS.map(t => <Tabs.Screen key={t.name} name={t.name} />)}
    </Tabs>
  );
}
