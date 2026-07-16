import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExhibitionRow } from '../../components/exhibition-rows';
import { EmptyState, Hairline, InkBar, MonoLabel } from '../../components/ui';
import { useApp } from '../../lib/app-context';
import { colors, PAGE_PAD, type } from '../../theme';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, exhibitions, watchlistIds, visits } = useApp();

  const wanted = useMemo(
    () =>
      watchlistIds
        .map((id) => exhibitions.find((e) => e.id === id))
        .filter((e): e is NonNullable<typeof e> => !!e),
    [watchlistIds, exhibitions],
  );
  const seenIds = useMemo(() => new Set(visits.map((v) => v.exhibition_id)), [visits]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.head, { paddingTop: insets.top + 18 }]}>
        <MonoLabel>YOUR CURATION</MonoLabel>
        <Text style={[type.serifHeading, { marginTop: 8 }]}>Want to see</Text>
      </View>
      <Hairline />

      {!profile ? (
        <View style={{ paddingHorizontal: PAGE_PAD }}>
          <EmptyState body="Sign in to start curating. Everything you want to see, kept in one place." />
          <InkBar label="SIGN IN" onPress={() => router.push('/auth')} />
        </View>
      ) : wanted.length === 0 ? (
        <EmptyState body="Nothing saved yet. When an exhibition catches your eye, add it here — this is the list you curate for yourself." />
      ) : (
        <View style={{ paddingHorizontal: PAGE_PAD }}>
          {wanted.map((e) => (
            <ExhibitionRow key={e.id} exhibition={e} seen={seenIds.has(e.id)} />
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 18,
  },
});
