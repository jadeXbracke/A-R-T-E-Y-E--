import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Loading, MonoLink } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { isOnNow, todayStr } from '../../src/lib/dates';
import { Exhibition, Venue, VenueType } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

type VenueFilter = 'all' | VenueType;

const FILTERS: { value: VenueFilter; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'museum', label: 'MUSEUMS' },
  { value: 'gallery', label: 'GALLERIES' },
  { value: 'ari', label: 'ARIS' },
];

export default function VenuesScreen() {
  const insets = useSafeAreaInsets();
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [filter, setFilter] = useState<VenueFilter>('all');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([api.listVenues(), api.listApprovedExhibitions()]).then(([v, e]) => {
        if (!alive) return;
        setVenues(v.filter((x) => !x.is_fixture));
        setExhibitions(e);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  // venue id → number of exhibitions currently on view there
  const onNowCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of exhibitions) {
      if (isOnNow(e.start_date, e.end_date)) {
        map.set(e.venue_id, (map.get(e.venue_id) ?? 0) + 1);
      }
    }
    return map;
  }, [exhibitions]);

  // venue id → number of upcoming exhibitions
  const upcomingCount = useMemo(() => {
    const t = todayStr();
    const map = new Map<string, number>();
    for (const e of exhibitions) {
      if (e.start_date > t) map.set(e.venue_id, (map.get(e.venue_id) ?? 0) + 1);
    }
    return map;
  }, [exhibitions]);

  const list = useMemo(() => {
    const all = (venues ?? []).filter((v) => filter === 'all' || v.type === filter);
    // venues with something on view first, then alphabetical
    return all.sort((a, b) => {
      const aOn = onNowCount.get(a.id) ?? 0;
      const bOn = onNowCount.get(b.id) ?? 0;
      if (aOn !== bOn) return bOn - aOn;
      return a.name.localeCompare(b.name);
    });
  }, [venues, filter, onNowCount]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>THE SYDNEY REGISTER</Text>
        <Text style={type.serifHeading}>Venues</Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <MonoLink
            key={f.value}
            label={f.label}
            active={filter === f.value}
            onPress={() => setFilter(f.value)}
          />
        ))}
      </View>
      <Hairline />

      {venues === null ? (
        <Loading />
      ) : list.length === 0 ? (
        <EmptyState>No venues here yet.</EmptyState>
      ) : (
        list.map((v) => {
          const on = onNowCount.get(v.id) ?? 0;
          const soon = upcomingCount.get(v.id) ?? 0;
          return (
            <Pressable key={v.id} style={styles.row} onPress={() => router.push(`/venue/${v.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {v.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {v.type.toUpperCase()}
                  {v.suburb ? ` · ${v.suburb.toUpperCase()}` : ''}
                </Text>
              </View>
              {on > 0 ? (
                <Text style={styles.onNow}>
                  {on} ON NOW
                </Text>
              ) : soon > 0 ? (
                <Text style={styles.upcoming}>{soon} COMING UP</Text>
              ) : null}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.page, paddingBottom: space.m },
  kicker: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.grey,
    marginBottom: 10,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowName: { ...type.serifTitle, fontSize: 20 },
  rowMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.grey,
    marginTop: 4,
  },
  onNow: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.red,
  },
  upcoming: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.grey,
  },
});
