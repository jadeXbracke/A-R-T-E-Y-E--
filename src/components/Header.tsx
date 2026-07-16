import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, space } from '@/theme';
import { HairRule, SeenDot } from './ui';

/** Masthead: ART EYE wordmark with the signature red dot. */
export function Masthead({ subtitle }: { subtitle?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 10, backgroundColor: color.white }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingBottom: 12,
        }}
      >
        <Text
          style={{
            fontFamily: font.capsBold,
            fontSize: 15,
            letterSpacing: 5,
            color: color.ink,
          }}
        >
          ART EYE
        </Text>
        <SeenDot size={7} />
      </View>
      {subtitle ? (
        <Text
          style={{
            fontFamily: font.mono,
            fontSize: 9,
            letterSpacing: 2,
            color: color.grey,
            textAlign: 'center',
            marginTop: -6,
            paddingBottom: 10,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      <HairRule />
    </View>
  );
}

/** Sub-screen top bar: ← BACK plus a mono screen label. */
export function BackBar({ title, right }: { title?: string; right?: React.ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, backgroundColor: color.white }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space.gutter,
          paddingBottom: 12,
        }}
      >
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10}>
          <Text style={{ fontFamily: font.monoMedium, fontSize: 11, letterSpacing: 1.2, color: color.ink }}>
            ← BACK
          </Text>
        </Pressable>
        <Text style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 2, color: color.grey }}>
          {title ?? ''}
        </Text>
        <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
      </View>
      <HairRule />
    </View>
  );
}
