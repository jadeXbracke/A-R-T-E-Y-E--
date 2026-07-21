import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExhibitionGridItem, ExhibitionRow } from '../../src/components/exhibition';
import { HeroCarousel } from '../../src/components/hero-carousel';
import { SearchBar } from '../../src/components/search-bar';
import { EmptyState, Hairline, Kicker, Lift, Loading, MonoLink } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { daysUntil, isOnNow, todayStr } from '../../src/lib/dates';
import { useAuth } from '../../src/lib/auth';
import { AgendaFilter, CuratedList, Exhibition } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

const FILTERS: { value: AgendaFilter; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'opening_soon', label: 'OPENING SOON' },
  { value: 'closing_soon', label: 'CLOSING SOON' },
  { value: 'museums', label: 'MUSEUMS' },
  { value: 'galleries', label: 'GALLERIES' },
  { value: 'aris', label: 'ARIS' },
];

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [exhibitions, setExhibitions] = useState<Exhibition[] | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<AgendaFilter>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [curated, setCurated] = useState<CuratedList[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      api.listApprovedExhibitions().then((list) => alive && setExhibitions(list));
      api.listCuratedLists().then((lists) => alive && setCurated(lists));
      if (profile) {
        api.listVisits(profile.id).then(
          (v) => alive && setSeenIds(new Set(v.map((x) => x.exhibition_id)))
        );
      } else {
        setSeenIds(new Set());
      }
      return () => {
        alive = false;
      };
    }, [profile])
  );

  const featured = useMemo(
    () => (exhibitions ?? []).filter((e) => e.is_featured),
    [exhibitions]
  );

  const agenda = useMemo(() => {
    const t = todayStr();
    const all = (exhibitions ?? []).filter((e) => e.end_date >= t);
    switch (filter) {
      case 'opening_soon':
        return all
          .filter((e) => e.start_date > t)
          .sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
      case 'closing_soon':
        return all
          .filter((e) => isOnNow(e.start_date, e.end_date) && daysUntil(e.end_date) <= 21)
          .sort((a, b) => (a.end_date < b.end_date ? -1 : 1));
      case 'museums':
        return all.filter((e) => e.venue?.type === 'museum');
      case 'galleries':
        return all.filter((e) => e.venue?.type === 'gallery');
      case 'aris':
        return all.filter((e) => e.venue?.type === 'ari');
      default:
        return all.sort((a, b) => (a.end_date < b.end_date ? -1 : 1));
    }
  }, [exhibitions, filter]);

  const heading = filter === 'opening_soon' ? 'Opening soon' : 'On now';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.header}>
        <Text style={styles.wordmark}>ART EYE</Text>
        <Text style={styles.tagline}>YOUR EYE ON THE ART WORLD — SYDNEY</Text>
      </View>
      <Hairline style={{ marginBottom: space.l }} />

      {exhibitions === null ? (
        <Loading />
      ) : (
        <>
          <HeroCarousel exhibitions={featured} />

          <SearchBar
            style={{ marginHorizontal: space.page, marginTop: space.xl }}
          />

          <View style={styles.sectionHead}>
            <Text style={type.serifHeading}>{heading}</Text>
            <View style={{ flexDirection: 'row', gap: space.m }}>
              <MonoLink label="LIST" active={view === 'list'} onPress={() => setView('list')} />
              <MonoLink label="GRID" active={view === 'grid'} onPress={() => setView('grid')} />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {FILTERS.map((f) => (
              <MonoLink
                key={f.value}
                label={f.label}
                active={filter === f.value}
                onPress={() => setFilter(f.value)}
              />
            ))}
          </ScrollView>

          {curated.length > 0 && (
            <View style={{ marginBottom: space.m }}>
              <Kicker style={{ paddingHorizontal: space.page, marginBottom: space.s }}>
                CURATED — BY ARTISTS, GALLERISTS & EDITORS
              </Kicker>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: space.page, gap: space.m }}
              >
                {curated.map((g) => (
                  <Lift key={g.id} style={styles.curatedCard} onPress={() => router.push(`/guide/${g.id}`)}>
                    <Text style={styles.curatedRole}>
                      {g.curator_role.toUpperCase()} · {g.exhibition_ids.length} SHOWS
                    </Text>
                    <Text style={styles.curatedTitle} numberOfLines={2}>
                      {g.title}
                    </Text>
                    <Text style={styles.curatedName} numberOfLines={1}>
                      {g.curator_name.toUpperCase()}
                    </Text>
                  </Lift>
                ))}
              </ScrollView>
            </View>
          )}

          {agenda.length === 0 ? (
            <EmptyState>
              Nothing here just now. The agenda turns over weekly — check back soon.
            </EmptyState>
          ) : view === 'list' ? (
            <View>
              {agenda.map((e, i) => (
                <View key={e.id}>
                  {i > 0 && <Hairline style={{ marginHorizontal: space.page }} />}
                  <ExhibitionRow exhibition={e} seen={seenIds.has(e.id)} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.grid}>
              {agenda.map((e) => (
                <ExhibitionGridItem key={e.id} exhibition={e} seen={seenIds.has(e.id)} />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  curatedCard: {
    width: 230,
    borderWidth: 1,
    borderColor: colors.ink,
    padding: space.m,
  },
  curatedRole: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.red,
    marginBottom: 8,
  },
  curatedTitle: { ...type.serifTitle, fontSize: 19, marginBottom: 8 },
  curatedName: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.grey,
  },
  header: {
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  wordmark: { ...type.wordmark, marginBottom: 6 },
  tagline: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.grey,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: space.page,
    marginTop: space.xl,
    marginBottom: space.m,
  },
  filters: {
    gap: space.m,
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: space.page,
    columnGap: 0,
  },
});
