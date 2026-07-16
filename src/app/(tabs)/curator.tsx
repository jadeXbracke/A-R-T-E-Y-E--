import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EmptyState,
  Hairline,
  InkBar,
  MonoLabel,
  RatingDots,
  TextLink,
} from '../../components/ui';
import { useApp } from '../../lib/app-context';
import { diaryDate } from '../../lib/format';
import { PROFILE_TYPE_LABELS } from '../../lib/types';
import { colors, PAGE_PAD, type } from '../../theme';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[type.serifTitleLarge, { fontSize: 26 }]}>{value}</Text>
      <Text style={[type.monoLabel, { marginTop: 4, fontSize: 10 }]}>{label}</Text>
    </View>
  );
}

export default function CuratorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, exhibitions, watchlistIds, visits, signOut } = useApp();

  const avg = useMemo(() => {
    if (visits.length === 0) return '—';
    return (visits.reduce((s, v) => s + v.rating, 0) / visits.length).toFixed(1);
  }, [visits]);

  const log = useMemo(
    () =>
      visits.map((v) => ({
        visit: v,
        exhibition: exhibitions.find((e) => e.id === v.exhibition_id),
      })),
    [visits, exhibitions],
  );

  if (!profile) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[styles.head, { paddingTop: insets.top + 18 }]}>
          <MonoLabel>CURATOR</MonoLabel>
          <Text style={[type.serifHeading, { marginTop: 8 }]}>Your record</Text>
        </View>
        <Hairline />
        <View style={{ paddingHorizontal: PAGE_PAD }}>
          <EmptyState body="Your eye on the art world starts here. Create an account to curate what you want to see and keep a record of what you saw." />
          <InkBar label="SIGN IN OR CREATE ACCOUNT" onPress={() => router.push('/auth')} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.head, { paddingTop: insets.top + 18 }]}>
        <MonoLabel>CURATOR</MonoLabel>
        <Text style={[type.serifHeading, { marginTop: 8 }]}>{profile.display_name}</Text>
        <Text style={[type.monoSmall, { marginTop: 8 }]}>
          {PROFILE_TYPE_LABELS[profile.profile_type].toUpperCase()} — {profile.city.toUpperCase()}
        </Text>
      </View>
      <Hairline />

      {/* stat line */}
      <View style={styles.stats}>
        <Stat label="SEEN" value={String(visits.length)} />
        <View style={styles.statDivider} />
        <Stat label="WANT TO SEE" value={String(watchlistIds.length)} />
        <View style={styles.statDivider} />
        <Stat label="AVG" value={avg} />
      </View>
      <Hairline />

      {/* diary */}
      <View style={{ paddingHorizontal: PAGE_PAD, paddingTop: 26 }}>
        <MonoLabel style={{ marginBottom: 6 }}>YOUR CURATION</MonoLabel>
      </View>
      {log.length === 0 ? (
        <EmptyState body="Your log is empty. Every exhibition you see becomes part of your record — your eye on the art world, kept." />
      ) : (
        <View style={{ paddingHorizontal: PAGE_PAD }}>
          {log.map(({ visit, exhibition }) => (
            <Pressable
              key={visit.exhibition_id}
              onPress={() => router.push(`/exhibition/${visit.exhibition_id}`)}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <View style={styles.entry}>
                <Image
                  source={exhibition?.image_url ?? undefined}
                  style={styles.entryThumb}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={type.monoSmall}>
                    {diaryDate(visit.visit_date)}
                    {exhibition?.venue ? ` · ${exhibition.venue.name.toUpperCase()}` : ''}
                  </Text>
                  <Text style={[type.serifTitle, { marginTop: 4 }]} numberOfLines={2}>
                    {exhibition?.title ?? 'Exhibition'}
                  </Text>
                  <View style={{ marginTop: 8 }}>
                    <RatingDots rating={visit.rating} size={8} gap={6} />
                  </View>
                  {visit.reflection ? (
                    <Text style={[type.serifQuote, { fontSize: 15, marginTop: 10 }]}>
                      “{visit.reflection}”
                    </Text>
                  ) : null}
                </View>
              </View>
              <Hairline />
            </Pressable>
          ))}
        </View>
      )}

      {/* account */}
      <View style={styles.account}>
        {profile.role === 'venue_owner' ? (
          <TextLink label="MY SUBMISSIONS" onPress={() => router.push('/my-submissions')} />
        ) : null}
        <TextLink
          label="SUBMIT AN EXHIBITION"
          onPress={() =>
            router.push(profile.role === 'venue_owner' ? '/(tabs)/submit' : '/submit-public')
          }
        />
        <TextLink label="SIGN OUT" onPress={signOut} />
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: PAGE_PAD,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.hairline,
  },
  entry: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 20,
  },
  entryThumb: {
    width: 64,
    height: 80,
    backgroundColor: colors.hairline,
  },
  account: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 32,
    gap: 18,
    alignItems: 'flex-start',
  },
});
