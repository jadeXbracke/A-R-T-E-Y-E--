import { router } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hairline, Kicker } from '../src/components/ui';
import { colors, fonts, space, type } from '../src/theme';

// Also the app-store "support contact" — change here to update it everywhere.
export const SUPPORT_EMAIL = 'jadebrack@gmail.com';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: space.l }}>
      <Kicker style={{ marginBottom: space.s }}>{title}</Kicker>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

/**
 * Privacy policy + terms of use. The web export serves this at /privacy,
 * which doubles as the privacy-policy URL app stores ask for.
 */
export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <View>
          <Kicker style={{ marginBottom: 10 }}>ART EYE</Kicker>
          <Text style={type.serifHeading}>Privacy & Terms</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Hairline style={{ marginBottom: space.l }} />

      <View style={{ paddingHorizontal: space.page }}>
        <Section title="WHAT WE COLLECT">
          Your email address and password (for your account), the profile details you choose to
          share (display name, profile type, city), and the content you create: posts, photos,
          video clips, ratings, notes, comments, likes, follows and messages. We collect nothing
          else — no advertising identifiers, no location tracking, no analytics profiles.
        </Section>

        <Section title="HOW IT'S USED">
          Your content exists to power the app itself: your feed, your profile and your
          conversations. It is never sold and never shared with third parties. Data is stored
          with our hosting provider (Supabase) and photos and clips you attach to posts are
          stored so they can be shown to people allowed to see them.
        </Section>

        <Section title="WHO SEES YOUR ACTIVITY">
          If your profile is public, your posts are visible to signed-in members. If your profile
          is private, only followers you approve see them. Direct messages are visible only to
          you and the person you're writing with.
        </Section>

        <Section title="YOUR CONTROLS">
          You can make your profile private, block anyone (they can no longer message you or see
          your activity), report posts, comments or profiles to the host, and delete your account
          from your profile page — deletion permanently removes your profile and everything you
          posted.
        </Section>

        <Section title="HOUSE RULES">
          ART EYE is for sharing what you see in galleries and museums. There is no tolerance for
          objectionable content or abusive behaviour: don't post content that is unlawful,
          hateful, threatening, or that you don't have the right to share. Reported content is
          reviewed by the host, and content or accounts that break these rules are removed.
        </Section>

        <Section title="CONTACT">
          Questions about your data, a report, or these terms? Reach the host directly — tap
          below.
        </Section>

        <Pressable onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})} hitSlop={8}>
          <Text style={styles.mail}>{SUPPORT_EMAIL.toUpperCase()} ↗</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  body: { ...type.serifBody, fontSize: 14, lineHeight: 22 },
  mail: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.red },
});
