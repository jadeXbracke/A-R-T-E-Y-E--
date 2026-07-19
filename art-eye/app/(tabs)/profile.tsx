import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Header } from '../../src/components/Header';
import {
  BodyItalic,
  HeadingXL,
  Mono,
  MonoLabelMuted,
  MonoMuted,
  SerifItalic,
} from '../../src/components/Type';
import { EmptyState, Hairline, RatingDots, TextLink } from '../../src/components/kit';
import { imageSource } from '../../src/data/placeholders';
import { shortDate } from '../../src/lib/format';
import { useAppState } from '../../src/state/AppState';
import { color, font, space } from '../../src/theme';
import { PROFILE_TYPE_LABELS } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, exhibitions, watchlist, visits, refreshUserData, signOut } =
    useAppState();

  useFocusEffect(
    useCallback(() => {
      if (profile) refreshUserData();
    }, [profile, refreshUserData]),
  );

  const byId = useMemo(
    () => new Map(exhibitions.map((e) => [e.id, e])),
    [exhibitions],
  );

  const avg = useMemo(() => {
    if (visits.length === 0) return null;
    return visits.reduce((s, v) => s + v.rating, 0) / visits.length;
  }, [visits]);

  if (!profile) {
    return (
      <View style={styles.screen}>
        <Header />
        <View style={styles.head}>
          <MonoLabelMuted>CURATOR</MonoLabelMuted>
          <HeadingXL style={{ marginTop: space.s }}>Your record</HeadingXL>
        </View>
        <EmptyState
          text="Your eye deserves a record. Sign in to begin your curation."
          action={{ label: 'SIGN IN', onPress: () => router.push('/auth/sign-in') }}
        />
        <View style={{ alignItems: 'center' }}>
          <TextLink label="CREATE AN ACCOUNT" onPress={() => router.push('/auth/sign-up')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <MonoLabelMuted>CURATOR</MonoLabelMuted>
          <HeadingXL style={{ marginTop: space.s }}>{profile.display_name}</HeadingXL>
          <Mono style={styles.typeLine}>
            {`${PROFILE_TYPE_LABELS[profile.profile_type]} — ${profile.city.toUpperCase()}`}
          </Mono>
        </View>

        <View style={styles.stats}>
          <Stat value={String(visits.length)} label="SEEN" />
          <View style={styles.statDivider} />
          <Stat value={String(watchlist.size)} label="WANT TO SEE" />
          <View style={styles.statDivider} />
          <Stat value={avg ? avg.toFixed(1) : '—'} label="AVG" />
        </View>

        <View style={styles.logHead}>
          <MonoLabelMuted>YOUR CURATION</MonoLabelMuted>
        </View>
        {visits.length === 0 ? (
          <EmptyState text="Your log is empty. Every exhibition you see becomes part of your record — your eye on the art world, kept." />
        ) : (
          <View>
            {visits.map((v) => {
              const e = byId.get(v.exhibition_id);
              if (!e) return null;
              return (
                <Pressable
                  key={v.exhibition_id}
                  style={styles.entry}
                  onPress={() => router.push(`/exhibition/${e.id}`)}
                >
                  <Image
                    source={imageSource(e.image_url)}
                    style={styles.thumb}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <MonoMuted style={{ fontSize: 10 }}>
                      {`SEEN ${shortDate(v.visit_date)} · ${e.venue?.name.toUpperCase() ?? ''}`}
                    </MonoMuted>
                    <SerifItalic numberOfLines={2} style={{ marginTop: 4 }}>
                      {e.title}
                    </SerifItalic>
                    <RatingDots value={v.rating} size={9} style={{ marginTop: 7 }} />
                    {v.reflection ? (
                      <BodyItalic style={styles.note}>“{v.reflection}”</BodyItalic>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <Hairline style={{ marginTop: space.xl }} />
        <View style={styles.links}>
          {profile.role === 'venue_owner' ? (
            <TextLink label="YOUR VENUE — SUBMISSIONS" onPress={() => router.push('/venue')} />
          ) : null}
          {profile.role === 'admin' ? (
            <TextLink label="ADMIN — APPROVALS" onPress={() => router.push('/admin')} />
          ) : null}
          <TextLink label="SUBMIT AN EXHIBITION" onPress={() => router.push('/submit')} />
          <TextLink
            label="SIGN OUT"
            muted
            onPress={async () => {
              await signOut();
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Mono style={styles.statValue}>{value}</Mono>
      <MonoLabelMuted style={{ fontSize: 9, marginTop: 4 }}>{label}</MonoLabelMuted>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
  },
  head: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
  },
  typeLine: {
    color: color.grey,
    marginTop: space.s,
    letterSpacing: 1.4,
  },
  stats: {
    flexDirection: 'row',
    marginTop: space.l,
    marginHorizontal: space.gutter,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
    paddingVertical: space.m,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: color.hairline,
  },
  statValue: {
    fontFamily: font.monoMedium,
    fontSize: 20,
    color: color.ink,
  },
  logHead: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    paddingBottom: space.s,
  },
  entry: {
    flexDirection: 'row',
    gap: space.m,
    paddingHorizontal: space.gutter,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  thumb: {
    width: 56,
    height: 70,
    backgroundColor: color.hairline,
  },
  note: {
    marginTop: space.s,
    fontSize: 16,
    lineHeight: 22,
    color: color.ink,
  },
  links: {
    paddingHorizontal: space.gutter,
    paddingVertical: space.xl,
    gap: space.l,
    paddingBottom: space.xxl,
  },
});
