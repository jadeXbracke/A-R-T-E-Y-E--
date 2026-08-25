// MARK Premium — same quiet register as the rest of the app. No urgency
// language, no countdown timers: what it is, what it costs, one choice.
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Hairline, Label, Wordmark } from '../src/components/ui';
import { DEMO_MODE } from '../src/lib/api';
import { PRICING, useEntitlements } from '../src/lib/entitlements';
import { useTheme } from '../src/lib/theme-context';
import { space, type } from '../src/theme';

const INCLUDED = [
  'Apple Health / Google Fit sync',
  'Send blocks to your calendar',
  'Cycle registration',
  'Correlation insights',
  'Data export',
  'Accent colours',
];

export default function Paywall() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { premium, setPremium } = useEntitlements();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space.xl, paddingHorizontal: space.page }}>
      <Wordmark />
      <Text style={[type.heading, { color: palette.inkDeep, marginTop: space.xl }]}>Premium</Text>
      <Body dim style={{ marginTop: space.s }}>
        The habits, the daily marks and the week view stay free, always. Premium adds the
        modules around them.
      </Body>

      <View style={{ marginTop: space.xl }}>
        {INCLUDED.map(f => (
          <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.ink }} />
            <Body>{f}</Body>
          </View>
        ))}
      </View>

      <Hairline />

      {premium ? (
        <Body dim>
          {DEMO_MODE
            ? 'Everything is unlocked in this build so you can try it all.'
            : 'You have Premium. Thank you for supporting MARK.'}
        </Body>
      ) : (
        <View style={{ gap: space.m }}>
          <Button label={PRICING.monthly} onPress={() => setPremium(true)} />
          <Button label={`${PRICING.yearly} · two months free`} onPress={() => setPremium(true)} />
          <Body dim style={{ fontSize: 11 }}>
            Purchases run through the App Store / Play Store (RevenueCat) in the
            store build; this development build simply toggles the flag.
          </Body>
        </View>
      )}

      <Pressable onPress={() => router.back()} style={{ marginTop: space.xl }}>
        <Label>← back</Label>
      </Pressable>
    </View>
  );
}
