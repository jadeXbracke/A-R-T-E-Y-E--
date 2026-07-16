import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { AgendaItem, ExhibitionGridItem, ExhibitionListRow, HeroCarousel } from '@/components/exhibition';
import { Masthead } from '@/components/Header';
import { EmptyState, HairRule, MonoLabel, UnderlineLink } from '@/components/ui';
import { isClosingSoon, isOnNow, isOpeningSoon, isUpcoming } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { AGENDA_FILTERS, AgendaFilter } from '@/lib/types';
import { color, space, type } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;
const GRID_GAP = 2; // hairline gaps between grid images
const GRID_W = (SCREEN_W - space.gutter * 2 - GRID_GAP) / 2;

export default function AgendaScreen() {
  const router = useRouter();
  const { exhibitions, venueById, visits } = useStore();
  const [filter, setFilter] = useState<AgendaFilter>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const seenIds = useMemo(() => new Set(visits.map((v) => v.exhibition_id)), [visits]);

  const toItem = (e: (typeof exhibitions)[number]): AgendaItem => ({
    exhibition: e,
    venue: venueById(e.venue_id),
    seen: seenIds.has(e.id),
  });

  const featured = useMemo(
    () => exhibitions.filter((e) => e.is_featured && (isOnNow(e) || isUpcoming(e))).map(toItem),
    [exhibitions, visits, venueById]
  );

  const agenda = useMemo(() => {
    const current = exhibitions.filter((e) => isOnNow(e) || isUpcoming(e));
    const filtered = current.filter((e) => {
      const venue = venueById(e.venue_id);
      switch (filter) {
        case 'opening_soon':
          return isOpeningSoon(e);
        case 'closing_soon':
          return isClosingSoon(e);
        case 'museums':
          return venue?.type === 'museum';
        case 'galleries':
          return venue?.type === 'gallery';
        default:
          return true;
      }
    });
    return filtered.map(toItem);
  }, [exhibitions, filter, visits, venueById]);

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <Masthead subtitle="YOUR EYE ON THE ART WORLD" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Curator's picks — The Sydney Edit */}
        <MonoLabel style={{ paddingHorizontal: space.gutter, paddingTop: 18, paddingBottom: 12 }}>
          THE SYDNEY EDIT — CURATED WEEKLY
        </MonoLabel>
        <HeroCarousel items={featured} />

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 20, paddingHorizontal: space.gutter, paddingVertical: 16 }}
        >
          {AGENDA_FILTERS.map((f) => (
            <UnderlineLink
              key={f.key}
              label={f.label}
              active={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>
        <HairRule style={{ marginHorizontal: space.gutter }} />

        {/* On now */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingHorizontal: space.gutter,
            paddingTop: 22,
            paddingBottom: 6,
          }}
        >
          <Text style={type.displaySerif}>On now</Text>
          <View style={{ flexDirection: 'row', gap: 16, paddingBottom: 6 }}>
            <UnderlineLink label="LIST" active={view === 'list'} onPress={() => setView('list')} />
            <UnderlineLink label="GRID" active={view === 'grid'} onPress={() => setView('grid')} />
          </View>
        </View>

        {agenda.length === 0 ? (
          <EmptyState text="Nothing under this lens right now. Widen the filter — Sydney rarely rests." />
        ) : view === 'list' ? (
          <View style={{ paddingHorizontal: space.gutter }}>
            {agenda.map((item, i) => (
              <View key={item.exhibition.id}>
                {i > 0 && <HairRule />}
                <ExhibitionListRow item={item} />
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: GRID_GAP,
              rowGap: 24,
              paddingHorizontal: space.gutter,
              paddingTop: 10,
            }}
          >
            {agenda.map((item) => (
              <ExhibitionGridItem key={item.exhibition.id} item={item} width={GRID_W} />
            ))}
          </View>
        )}

        {/* Public submission entry */}
        <HairRule style={{ marginHorizontal: space.gutter, marginTop: 28 }} />
        <Pressable
          onPress={() => router.push('/submit')}
          style={{ paddingHorizontal: space.gutter, paddingVertical: 22 }}
        >
          <MonoLabel style={{ color: color.ink }}>KNOW OF AN EXHIBITION WE'VE MISSED?</MonoLabel>
          <Text
            style={[
              type.monoAction,
              { marginTop: 8, textDecorationLine: 'underline', textDecorationColor: color.red },
            ]}
          >
            SUBMIT AN EXHIBITION
          </Text>
        </Pressable>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
