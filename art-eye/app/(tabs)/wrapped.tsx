import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hairline, Kicker, Loading } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { shareText } from '../../src/lib/share';
import { computeWrapped, WrappedStats } from '../../src/lib/stats';
import { Exhibition } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

const VENUE_TYPE_LABEL: Record<string, string> = {
  gallery: 'commercial galleries',
  museum: 'museums',
  ari: 'artist-run spaces',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function WrappedScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [stats, setStats] = useState<WrappedStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (!profile) return;
      (async () => {
        const visits = await api.listVisits(profile.id);
        if (!alive) return;
        const seenYears = [...new Set(visits.map((v) => Number(v.visit_date.slice(0, 4))))].sort(
          (a, b) => b - a
        );
        setYears(seenYears.length ? seenYears : [new Date().getFullYear()]);
        const exMap = new Map<string, Exhibition>();
        await Promise.all(
          visits.map(async (v) => {
            const e = await api.getExhibition(v.exhibition_id);
            if (e) exMap.set(e.id, e);
          })
        );
        if (!alive) return;
        setStats(computeWrapped(visits, exMap, year));
      })();
      return () => {
        alive = false;
      };
    }, [profile, year])
  );

  if (!profile) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Sign in first</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <Kicker>YOUR YEAR</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space.page }}>
        <View style={styles.yearRow}>
          {years.map((y) => (
            <Pressable key={y} onPress={() => setYear(y)} hitSlop={6}>
              <Text style={[styles.yearLabel, y === year && styles.yearLabelActive]}>{y}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[type.serifHeading, { fontSize: 34, marginTop: space.s }]}>{year} Wrapped</Text>
      </View>
      <Hairline style={{ marginTop: space.l }} />

      {!stats ? (
        <Loading />
      ) : stats.totalVisits === 0 ? (
        <Text style={styles.empty}>Nothing logged in {year} yet.</Text>
      ) : (
        <View style={{ paddingHorizontal: space.page }}>
          <Text style={styles.headline}>
            You saw {stats.totalVisits} exhibition{stats.totalVisits === 1 ? '' : 's'} across{' '}
            {stats.uniqueVenues} venue{stats.uniqueVenues === 1 ? '' : 's'} in {year}.
          </Text>

          <Row label="AVERAGE RATING" value={`${stats.avgRating} / 5`} />
          {stats.topVenueType && (
            <Row
              label="MOSTLY AT"
              value={(VENUE_TYPE_LABEL[stats.topVenueType] ?? stats.topVenueType).toUpperCase()}
            />
          )}
          {stats.busiestMonth && <Row label="BUSIEST MONTH" value={stats.busiestMonth.toUpperCase()} />}
          {stats.favouriteShow && (
            <Row
              label="TOP RATED"
              value={`${stats.favouriteShow.title.toUpperCase()} (${stats.favouriteShow.rating}/5)`}
            />
          )}
          {stats.firstVisit && (
            <Row label="FIRST OF THE YEAR" value={stats.firstVisit.title.toUpperCase()} />
          )}

          <Pressable
            onPress={() =>
              shareText(
                `${year} Wrapped`,
                `${profile.display_name} on ART EYE — ${year} Wrapped: ${stats.totalVisits} show${
                  stats.totalVisits === 1 ? '' : 's'
                } seen across ${stats.uniqueVenues} venue${stats.uniqueVenues === 1 ? '' : 's'}.`
              )
            }
            hitSlop={8}
            style={{ marginTop: space.l, alignSelf: 'flex-start' }}
          >
            <Text style={styles.share}>SHARE YOUR YEAR ↗</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page, gap: space.m },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  yearRow: { flexDirection: 'row', gap: space.l, marginTop: space.l },
  yearLabel: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1.4, color: colors.ink, opacity: 0.4 },
  yearLabelActive: { opacity: 1, textDecorationLine: 'underline' },
  empty: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingVertical: space.l,
  },
  headline: { ...type.serifBody, fontSize: 19, lineHeight: 28, marginTop: space.l, marginBottom: space.l },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    gap: space.m,
  },
  rowLabel: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, color: colors.ink, opacity: 0.6 },
  rowValue: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.6, color: colors.ink, textAlign: 'right', flexShrink: 1 },
  share: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.6, color: colors.ink },
});
