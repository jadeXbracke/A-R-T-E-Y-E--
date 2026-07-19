import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ExhibitionGrid } from '../../src/components/ExhibitionGrid';
import { ExhibitionRow } from '../../src/components/ExhibitionRow';
import { Header } from '../../src/components/Header';
import { HeroCarousel } from '../../src/components/HeroCarousel';
import { BodyItalic, HeadingXL, MonoMuted } from '../../src/components/Type';
import { EmptyState, TextLink } from '../../src/components/kit';
import {
  daysUntil,
  isClosingSoon,
  isOnNow,
  isOpeningSoon,
} from '../../src/lib/format';
import { useAppState } from '../../src/state/AppState';
import { color, space } from '../../src/theme';
import type { Exhibition } from '../../src/types';

type Filter = 'all' | 'opening' | 'closing' | 'museums' | 'galleries';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'opening', label: 'OPENING SOON' },
  { key: 'closing', label: 'CLOSING SOON' },
  { key: 'museums', label: 'MUSEUMS' },
  { key: 'galleries', label: 'GALLERIES' },
];

const HEADINGS: Record<Filter, string> = {
  all: 'On now',
  opening: 'Opening soon',
  closing: 'Closing soon',
  museums: 'Museums',
  galleries: 'Galleries',
};

export default function AgendaScreen() {
  const router = useRouter();
  const { exhibitions, visits, refreshAgenda } = useAppState();
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');

  useFocusEffect(
    useCallback(() => {
      refreshAgenda();
    }, [refreshAgenda]),
  );

  const seenIds = useMemo(() => new Set(visits.map((v) => v.exhibition_id)), [visits]);

  const current = useMemo(
    () => exhibitions.filter((e) => daysUntil(e.end_date) >= 0),
    [exhibitions],
  );

  const featured = useMemo(
    () => current.filter((e) => e.is_featured),
    [current],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case 'opening':
        return current.filter((e) => isOpeningSoon(e));
      case 'closing':
        return current.filter((e) => isClosingSoon(e));
      case 'museums':
        return current.filter((e) => isOnNow(e) && e.venue?.type === 'museum');
      case 'galleries':
        return current.filter((e) => isOnNow(e) && e.venue?.type === 'gallery');
      default:
        return current.filter((e) => isOnNow(e));
    }
  }, [current, filter]);

  const open = (e: Exhibition) => router.push(`/exhibition/${e.id}`);

  return (
    <View style={styles.screen}>
      <Header tagline="YOUR EYE ON THE ART WORLD" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: space.l }}>
          <HeroCarousel
            exhibitions={featured}
            kicker="THE SYDNEY EDIT — CURATED WEEKLY"
            onPress={open}
          />
        </View>

        <View style={styles.sectionHead}>
          <HeadingXL>{HEADINGS[filter]}</HeadingXL>
          <View style={styles.viewToggle}>
            <TextLink label="LIST" active={view === 'list'} muted={view !== 'list'} onPress={() => setView('list')} />
            <TextLink label="GRID" active={view === 'grid'} muted={view !== 'grid'} onPress={() => setView('grid')} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => (
            <TextLink
              key={f.key}
              label={f.label}
              active={filter === f.key}
              muted={filter !== f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <EmptyState text="Nothing here this week. The agenda turns over quickly — look again soon." />
        ) : view === 'list' ? (
          <View style={styles.list}>
            {filtered.map((e) => (
              <ExhibitionRow
                key={e.id}
                exhibition={e}
                seen={seenIds.has(e.id)}
                onPress={() => open(e)}
              />
            ))}
          </View>
        ) : (
          <ExhibitionGrid exhibitions={filtered} seenIds={seenIds} onPress={open} />
        )}

        <View style={styles.footer}>
          <BodyItalic style={{ color: color.grey, textAlign: 'center' }}>
            Showing somewhere we haven’t seen?
          </BodyItalic>
          <View style={{ marginTop: space.m, alignItems: 'center' }}>
            <TextLink label="SUBMIT AN EXHIBITION" onPress={() => router.push('/submit')} />
          </View>
          <MonoMuted style={styles.colophon}>SYDNEY — JULY 2026</MonoMuted>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    paddingBottom: space.m,
  },
  viewToggle: {
    flexDirection: 'row',
    columnGap: space.m,
    paddingBottom: 6,
  },
  filters: {
    flexDirection: 'row',
    columnGap: space.l,
    paddingHorizontal: space.gutter,
    paddingBottom: space.m,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  footer: {
    paddingVertical: space.xxl,
    paddingHorizontal: space.gutter,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  colophon: {
    textAlign: 'center',
    marginTop: space.xl,
    letterSpacing: 2,
    fontSize: 9,
  },
});
