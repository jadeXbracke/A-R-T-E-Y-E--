import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExhibitionGridCell, ExhibitionRow, HeroCarousel } from '../../components/exhibition';
import { Dot, EmptyState, Hairline, Loading, Mono, MonoLink } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { data } from '../../lib/data';
import { daysUntil, isClosingSoon, isOnNow, todayStr } from '../../lib/dates';
import { useFocusLoad } from '../../lib/hooks';
import { colors, space, type } from '../../lib/theme';
import { Exhibition } from '../../lib/types';

type Filter = 'all' | 'opening' | 'closing' | 'museums' | 'galleries';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'opening', label: 'Opening soon' },
  { key: 'closing', label: 'Closing soon' },
  { key: 'museums', label: 'Museums' },
  { key: 'galleries', label: 'Galleries' },
];

export default function AgendaScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>('all');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');

  const { data: exhibitions, loading } = useFocusLoad(() => data.listExhibitions(), []);
  const { data: seenIds } = useFocusLoad(
    async () => (profile ? (await data.listVisits(profile.id)).map((v) => v.exhibition_id) : []),
    [profile?.id]
  );

  const seen = useMemo(() => new Set(seenIds ?? []), [seenIds]);

  const current = useMemo(() => {
    const t = todayStr();
    const rows = (exhibitions ?? []).filter((e) => e.end_date >= t);
    // on-now first (closing soonest first), then upcoming by start date
    return rows.sort((a, b) => {
      const aOn = isOnNow(a) ? 0 : 1;
      const bOn = isOnNow(b) ? 0 : 1;
      if (aOn !== bOn) return aOn - bOn;
      return aOn === 0 ? a.end_date.localeCompare(b.end_date) : a.start_date.localeCompare(b.start_date);
    });
  }, [exhibitions]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'opening':
        return current.filter((e) => daysUntil(e.start_date) > 0);
      case 'closing':
        return current.filter((e) => isClosingSoon(e));
      case 'museums':
        return current.filter((e) => e.venue?.type === 'museum');
      case 'galleries':
        return current.filter((e) => e.venue?.type === 'gallery');
      default:
        return current;
    }
  }, [current, filter]);

  const featured = useMemo(() => current.filter((e) => e.is_featured), [current]);

  const gridWidth = (width - space.screenX * 2 - 12) / 2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* wordmark */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: space.screenX,
            paddingTop: space.m,
            paddingBottom: space.m,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[type.capsLarge, { fontSize: 15, letterSpacing: 4 }]}>ART EYE</Text>
            <Dot size={7} />
          </View>
          <MonoLink label="Submit" onPress={() => router.push('/submit')} />
        </View>
        <Hairline />

        {/* The Sydney Edit — curated weekly */}
        <View style={{ paddingHorizontal: space.screenX, paddingTop: space.l, paddingBottom: space.m }}>
          <Mono style={{ color: colors.accent }}>CURATOR’S PICKS</Mono>
          <Text style={[type.serifLarge, { fontSize: 30, marginTop: 6 }]}>The Sydney Edit</Text>
          <Mono style={{ marginTop: 4 }}>CURATED WEEKLY</Mono>
        </View>
        <HeroCarousel featured={featured} />

        {/* On now */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingHorizontal: space.screenX,
            paddingTop: space.xl,
            paddingBottom: space.m,
          }}
        >
          <Text style={type.serifHeading}>On now</Text>
          <View style={{ flexDirection: 'row', gap: space.m, paddingBottom: 6 }}>
            <MonoLink label="List" active={layout === 'list'} onPress={() => setLayout('list')} />
            <MonoLink label="Grid" active={layout === 'grid'} onPress={() => setLayout('grid')} />
          </View>
        </View>

        {/* mono text filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: space.l, paddingHorizontal: space.screenX, paddingBottom: space.m }}
        >
          {FILTERS.map((f) => (
            <MonoLink key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>
        <Hairline />

        {loading && !exhibitions ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState>
            Nothing here under this filter right now. The agenda turns over every week — look again soon.
          </EmptyState>
        ) : layout === 'list' ? (
          <View>
            {filtered.map((e: Exhibition) => (
              <ExhibitionRow key={e.id} e={e} seen={seen.has(e.id)} />
            ))}
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              paddingHorizontal: space.screenX,
              paddingTop: space.l,
            }}
          >
            {filtered.map((e: Exhibition) => (
              <ExhibitionGridCell key={e.id} e={e} seen={seen.has(e.id)} width={gridWidth} />
            ))}
          </View>
        )}

        <View style={{ height: space.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
