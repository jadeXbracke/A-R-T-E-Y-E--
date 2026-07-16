import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AgendaItem, ExhibitionListRow } from '@/components/exhibition';
import { Masthead } from '@/components/Header';
import { EmptyState, HairRule, InkButton, MonoLabel } from '@/components/ui';
import { useStore } from '@/lib/store';
import { color, space, type } from '@/theme';

export default function WatchlistScreen() {
  const router = useRouter();
  const { user, exhibitions, venueById, watchlist, visits } = useStore();

  const items: AgendaItem[] = useMemo(() => {
    const seen = new Set(visits.map((v) => v.exhibition_id));
    return exhibitions
      .filter((e) => watchlist.has(e.id))
      .map((e) => ({ exhibition: e, venue: venueById(e.venue_id), seen: seen.has(e.id) }));
  }, [exhibitions, watchlist, visits, venueById]);

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <Masthead subtitle="YOUR EYE ON THE ART WORLD" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 22 }}>
          <MonoLabel>YOUR CURATION</MonoLabel>
          <Text style={[type.displaySerif, { marginTop: 6 }]}>Want to see</Text>
        </View>

        {!user ? (
          <View style={{ paddingHorizontal: space.gutter, paddingTop: 40, gap: 24 }}>
            <Text style={[type.noteSerif, { color: color.grey }]}>
              Sign in to start curating. The exhibitions you want to see, kept in one place.
            </Text>
            <InkButton label="SIGN IN" onPress={() => router.push('/auth')} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState text="Nothing here yet. When an exhibition catches your eye, keep it — this is where your curation begins." />
        ) : (
          <View style={{ paddingHorizontal: space.gutter, marginTop: 8 }}>
            {items.map((item, i) => (
              <View key={item.exhibition.id}>
                {i > 0 && <HairRule />}
                <ExhibitionListRow item={item} />
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
