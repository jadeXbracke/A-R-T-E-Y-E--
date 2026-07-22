import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExhibitionRow } from '../src/components/exhibition';
import { Hairline, Kicker, Lift } from '../src/components/ui';
import { api } from '../src/lib/api';
import { areaForSuburb } from '../src/lib/areas';
import { Exhibition, Venue } from '../src/lib/types';
import { colors, fonts, space, type } from '../src/theme';

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);

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

  const q = norm(query.trim());

  const venueHits = useMemo(() => {
    if (q.length < 2) return [];
    return venues
      .filter((v) =>
        [v.name, v.suburb ?? '', v.category ?? '', v.type, areaForSuburb(v.suburb)]
          .some((f) => norm(f).includes(q))
      )
      .slice(0, 20);
  }, [venues, q]);

  const showHits = useMemo(() => {
    if (q.length < 2) return [];
    return exhibitions
      .filter((e) =>
        [e.title, e.artists, e.venue?.name ?? '', e.venue?.suburb ?? '']
          .some((f) => norm(f).includes(q))
      )
      .slice(0, 20);
  }, [exhibitions, q]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space.m,
        paddingBottom: insets.bottom + space.xl,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.head}>
        <Kicker>SEARCH</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space.page }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Artist, exhibition, venue or suburb…"
          placeholderTextColor={colors.grey}
          autoFocus
          autoCorrect={false}
          style={styles.input}
        />
      </View>
      <Hairline style={{ marginTop: space.m }} />

      {q.length < 2 ? (
        <Text style={styles.hint}>
          Type at least two letters — search covers every venue in the register and every show in
          the agenda.
        </Text>
      ) : venueHits.length === 0 && showHits.length === 0 ? (
        <Text style={styles.hint}>Nothing found for “{query.trim()}”.</Text>
      ) : (
        <>
          {showHits.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>EXHIBITIONS</Text>
                <Text style={styles.sectionCount}>{showHits.length}</Text>
              </View>
              {showHits.map((e) => (
                <ExhibitionRow key={e.id} exhibition={e} />
              ))}
            </>
          )}

          {venueHits.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>VENUES</Text>
                <Text style={styles.sectionCount}>{venueHits.length}</Text>
              </View>
              {venueHits.map((v) => (
                <Lift key={v.id} style={styles.row} onPress={() => router.push(`/venue/${v.id}`)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {v.name}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {v.type.toUpperCase()}
                      {v.suburb ? ` · ${v.suburb.toUpperCase()}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.open}>OPEN →</Text>
                </Lift>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ink,
  },
  input: {
    ...type.serifHeading,
    fontSize: 26,
    color: colors.ink,
    paddingVertical: 6,
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.6,
    lineHeight: 18,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingTop: space.l,
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
    color: colors.ink,
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
    color: colors.ink,
    marginTop: 4,
  },
  open: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.red,
  },
});
