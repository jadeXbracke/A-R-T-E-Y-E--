import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Loading, MonoLink } from '../../src/components/ui';
import { VenueMap } from '../../src/components/venue-map';
import { api } from '../../src/lib/api';
import { Area, AREAS, areaForSuburb } from '../../src/lib/areas';
import { isOnNow, todayStr } from '../../src/lib/dates';
import { Exhibition, Venue, VenueType } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

type TypeFilter = 'all' | VenueType;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'museum', label: 'MUSEUMS' },
  { value: 'gallery', label: 'GALLERIES' },
  { value: 'ari', label: 'ARIS' },
];

const AREA_FILTERS: { value: 'all' | Area; label: string }[] = [
  { value: 'all', label: 'ALL AREAS' },
  { value: 'City & The Rocks', label: 'CITY' },
  { value: 'East', label: 'EAST' },
  { value: 'Inner West', label: 'INNER WEST' },
  { value: 'North', label: 'NORTH' },
  { value: 'Greater Sydney', label: 'GREATER SYDNEY' },
];

export default function VenuesScreen() {
  const insets = useSafeAreaInsets();
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [areaFilter, setAreaFilter] = useState<'all' | Area>('all');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [selected, setSelected] = useState<Venue | null>(null);

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

  const onNow = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of exhibitions) {
      if (isOnNow(e.start_date, e.end_date)) {
        map.set(e.venue_id, (map.get(e.venue_id) ?? 0) + 1);
      }
    }
    return map;
  }, [exhibitions]);

  const upcoming = useMemo(() => {
    const t = todayStr();
    const map = new Map<string, number>();
    for (const e of exhibitions) {
      if (e.start_date > t) map.set(e.venue_id, (map.get(e.venue_id) ?? 0) + 1);
    }
    return map;
  }, [exhibitions]);

  const filtered = useMemo(
    () =>
      (venues ?? []).filter(
        (v) =>
          (typeFilter === 'all' || v.type === typeFilter) &&
          (areaFilter === 'all' || areaForSuburb(v.suburb) === areaFilter)
      ),
    [venues, typeFilter, areaFilter]
  );

  // list view: venues grouped per district, on-view first then alphabetical
  const sections = useMemo(() => {
    const byArea = new Map<Area, Venue[]>();
    for (const v of filtered) {
      const a = areaForSuburb(v.suburb);
      if (!byArea.has(a)) byArea.set(a, []);
      byArea.get(a)!.push(v);
    }
    return AREAS.filter((a) => byArea.has(a)).map((a) => ({
      area: a,
      venues: byArea.get(a)!.sort((x, y) => {
        const xo = onNow.get(x.id) ?? 0;
        const yo = onNow.get(y.id) ?? 0;
        if ((xo > 0) !== (yo > 0)) return yo - xo;
        return x.name.localeCompare(y.name);
      }),
    }));
  }, [filtered, onNow]);

  const onNowIds = useMemo(
    () => new Set([...onNow.keys()].filter((id) => (onNow.get(id) ?? 0) > 0)),
    [onNow]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={styles.kicker}>THE SYDNEY REGISTER</Text>
            <Text style={type.serifHeading}>Venues</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: space.m }}>
            <MonoLink label="LIST" active={view === 'list'} onPress={() => setView('list')} />
            <MonoLink label="MAP" active={view === 'map'} onPress={() => setView('map')} />
          </View>
        </View>
      </View>

      <View style={styles.filters}>
        {TYPE_FILTERS.map((f) => (
          <MonoLink
            key={f.value}
            label={f.label}
            active={typeFilter === f.value}
            onPress={() => setTypeFilter(f.value)}
          />
        ))}
      </View>
      <View style={[styles.filters, { paddingBottom: space.m }]}>
        {AREA_FILTERS.map((f) => (
          <MonoLink
            key={f.value}
            label={f.label}
            active={areaFilter === f.value}
            onPress={() => {
              setAreaFilter(f.value);
              setSelected(null);
            }}
          />
        ))}
      </View>
      <Hairline />

      {venues === null ? (
        <Loading />
      ) : view === 'map' ? (
        <View style={{ paddingHorizontal: space.page, paddingTop: space.m }}>
          <VenueMap
            venues={filtered}
            onNowIds={onNowIds}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
          {selected && (
            <Pressable style={styles.mapCard} onPress={() => router.push(`/venue/${selected.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {selected.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {selected.type.toUpperCase()}
                  {selected.suburb ? ` · ${selected.suburb.toUpperCase()}` : ''}
                  {(onNow.get(selected.id) ?? 0) > 0 ? ` · ${onNow.get(selected.id)} ON NOW` : ''}
                </Text>
              </View>
              <Text style={styles.open}>OPEN →</Text>
            </Pressable>
          )}
          {!selected && (
            <Text style={styles.mapHint}>Tap a dot to see the venue.</Text>
          )}
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState>No venues match this selection.</EmptyState>
      ) : (
        sections.map((s) => (
          <View key={s.area}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{s.area.toUpperCase()}</Text>
              <Text style={styles.sectionCount}>{s.venues.length}</Text>
            </View>
            {s.venues.map((v) => {
              const on = onNow.get(v.id) ?? 0;
              const soon = upcoming.get(v.id) ?? 0;
              return (
                <Pressable
                  key={v.id}
                  style={styles.row}
                  onPress={() => router.push(`/venue/${v.id}`)}
                >
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
                    <Text style={styles.onNow}>{on} ON NOW</Text>
                  ) : soon > 0 ? (
                    <Text style={styles.upcomingTag}>{soon} COMING UP</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))
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
    paddingBottom: space.s,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingTop: space.l,
    paddingBottom: space.s,
  },
  sectionTitle: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.ink,
  },
  sectionCount: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.grey,
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
  upcomingTag: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.grey,
  },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    borderWidth: 1,
    borderColor: colors.ink,
    padding: space.m,
    marginTop: space.s,
  },
  open: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.red,
  },
  mapHint: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    color: colors.grey,
    marginTop: space.s,
  },
});
