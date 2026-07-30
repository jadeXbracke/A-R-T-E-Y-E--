import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExhibitionRow } from '../../src/components/exhibition';
import { Hairline, Kicker, Loading } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { CuratedList, Exhibition } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

const ROLE_LABEL = { artist: 'ARTIST', gallerist: 'GALLERY OWNER', curator: 'EDITORS' } as const;

export default function CuratedListPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<CuratedList | null | undefined>(undefined);
  const [shows, setShows] = useState<Exhibition[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([api.listCuratedLists(), api.listApprovedExhibitions()]).then(([lists, all]) => {
        if (!alive) return;
        const g = lists.find((x) => x.id === id) ?? null;
        setList(g);
        if (g) {
          const byId = new Map(all.map((e) => [e.id, e]));
          setShows(g.exhibition_ids.map((eid) => byId.get(eid)).filter((e): e is Exhibition => !!e));
        }
      });
      return () => {
        alive = false;
      };
    }, [id])
  );

  if (list === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Loading />
      </View>
    );
  }
  if (list === null) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>List not found</Text>
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
        <Kicker>CURATED BY {ROLE_LABEL[list.curator_role]}</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: space.page }}>
        <Text style={[type.serifHeading, { marginBottom: 6 }]}>{list.title}</Text>
        <Text style={styles.curator}>{list.curator_name.toUpperCase()}</Text>
        {!!list.intro && <Text style={styles.intro}>{list.intro}</Text>}
      </View>
      <Hairline style={{ marginBottom: space.s }} />

      {shows.map((e, i) => (
        <View key={e.id}>
          {i > 0 && <Hairline style={{ marginHorizontal: space.page }} />}
          <ExhibitionRow exhibition={e} />
        </View>
      ))}
      {shows.length === 0 && (
        <Text style={styles.empty}>The shows in this list have closed — it retires itself.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  curator: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.red,
    marginBottom: space.s,
  },
  intro: { ...type.serifBody, color: colors.ink, marginBottom: space.l },
  empty: {
    fontFamily: fonts.serif, letterSpacing: 2, textTransform: 'uppercase',
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
    padding: space.page,
  },
});
