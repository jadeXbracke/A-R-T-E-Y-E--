import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExhibitionCell, ExhibitionRow } from '../../components/exhibition-rows';
import { EmptyState, Hairline, TextLink } from '../../components/ui';
import { useApp } from '../../lib/app-context';
import { applyFilter, dateRange, FILTERS, type AgendaFilter } from '../../lib/format';
import type { Exhibition } from '../../lib/types';
import { colors, PAGE_PAD, type } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_W * 1.12);

function HeroCarousel({ picks }: { picks: Exhibition[] }) {
  const router = useRouter();
  const listRef = useRef<FlatList<Exhibition>>(null);
  const [slide, setSlide] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== slide) setSlide(i);
  };

  if (picks.length === 0) return null;

  return (
    <View>
      <View style={styles.heroKicker}>
        <Text style={type.monoLabel}>THE SYDNEY EDIT — CURATED WEEKLY</Text>
      </View>
      <FlatList
        ref={listRef}
        data={picks}
        keyExtractor={(e) => e.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/exhibition/${item.id}`)}
            style={{ width: SCREEN_W }}
          >
            <Image
              source={item.image_url ?? undefined}
              style={{ width: SCREEN_W, height: HERO_H, backgroundColor: colors.hairline }}
              contentFit="cover"
              transition={250}
            />
            <View style={styles.heroOverlay}>
              <Text style={[type.capsArtistLarge, styles.heroShadow]}>
                {item.artists}
              </Text>
              <Text style={[type.serifTitleLarge, styles.heroTitle, styles.heroShadow]}>
                {item.title}
              </Text>
            </View>
            <View style={styles.heroMeta}>
              <Text style={type.monoSmall}>
                {item.venue?.name?.toUpperCase()} · {dateRange(item)}
              </Text>
            </View>
          </Pressable>
        )}
      />
      {/* underlined artist-name tabs marking the active slide */}
      <View style={styles.heroTabs}>
        {picks.map((p, i) => (
          <TextLink
            key={p.id}
            label={p.artists.split(',')[0].toUpperCase()}
            active={i === slide}
            onPress={() =>
              listRef.current?.scrollToOffset({ offset: i * SCREEN_W, animated: true })
            }
          />
        ))}
      </View>
      <Hairline />
    </View>
  );
}

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const { exhibitions, visits, refreshAgenda } = useApp();
  const [filter, setFilter] = useState<AgendaFilter>('all');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [refreshing, setRefreshing] = useState(false);

  const seenIds = useMemo(
    () => new Set(visits.map((v) => v.exhibition_id)),
    [visits],
  );
  const picks = useMemo(
    () => exhibitions.filter((e) => e.is_featured),
    [exhibitions],
  );
  const agenda = useMemo(
    () => applyFilter(exhibitions, filter),
    [exhibitions, filter],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAgenda();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="never"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
    >
      {/* masthead */}
      <View style={[styles.masthead, { paddingTop: insets.top + 14 }]}>
        <Text style={type.wordmark}>ART EYE</Text>
        <Text style={type.monoLabel}>SYDNEY</Text>
      </View>
      <View style={{ paddingHorizontal: PAGE_PAD, paddingBottom: 12 }}>
        <Text style={type.monoSmall}>YOUR EYE ON THE ART WORLD</Text>
      </View>
      <Hairline />

      <HeroCarousel picks={picks} />

      {/* filters — underlined mono text links, never pills */}
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
            onPress={() => setFilter(f.key)}
          />
        ))}
      </ScrollView>
      <Hairline />

      {/* On now */}
      <View style={styles.onNowHead}>
        <Text style={type.serifHeading}>On now</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TextLink label="LIST" active={layout === 'list'} onPress={() => setLayout('list')} />
          <TextLink label="GRID" active={layout === 'grid'} onPress={() => setLayout('grid')} />
        </View>
      </View>

      {agenda.length === 0 ? (
        <EmptyState body="Nothing here this week. The agenda is curated — check back as new exhibitions are approved." />
      ) : layout === 'list' ? (
        <View style={{ paddingHorizontal: PAGE_PAD }}>
          {agenda.map((e) => (
            <ExhibitionRow key={e.id} exhibition={e} seen={seenIds.has(e.id)} />
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {agenda.map((e) => (
            <View key={e.id} style={{ width: (SCREEN_W - PAGE_PAD * 2 - 16) / 2 }}>
              <ExhibitionCell exhibition={e} seen={seenIds.has(e.id)} />
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  masthead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 6,
  },
  heroKicker: {
    paddingHorizontal: PAGE_PAD,
    paddingVertical: 14,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 36,
    paddingHorizontal: 24,
    backgroundColor: colors.scrim,
  },
  heroTitle: {
    color: colors.bg,
    fontSize: 34,
    textAlign: 'center',
    marginTop: 8,
  },
  heroShadow: {
    textShadowColor: 'rgba(19,18,17,0.45)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
  heroMeta: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 12,
  },
  heroTabs: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: PAGE_PAD,
    paddingTop: 14,
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  filters: {
    gap: 20,
    paddingHorizontal: PAGE_PAD,
    paddingVertical: 16,
  },
  onNowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: PAGE_PAD,
    paddingTop: 24,
    paddingBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: PAGE_PAD,
  },
});
