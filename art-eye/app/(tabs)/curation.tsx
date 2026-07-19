import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ExhibitionRow } from '../../src/components/ExhibitionRow';
import { Header } from '../../src/components/Header';
import { HeadingXL, MonoLabelMuted } from '../../src/components/Type';
import { EmptyState } from '../../src/components/kit';
import { useAppState } from '../../src/state/AppState';
import { color, space } from '../../src/theme';

export default function CurationScreen() {
  const router = useRouter();
  const { profile, exhibitions, watchlist, visits, refreshUserData } = useAppState();

  useFocusEffect(
    useCallback(() => {
      if (profile) refreshUserData();
    }, [profile, refreshUserData]),
  );

  const seenIds = useMemo(() => new Set(visits.map((v) => v.exhibition_id)), [visits]);
  const wanted = useMemo(
    () => exhibitions.filter((e) => watchlist.has(e.id)),
    [exhibitions, watchlist],
  );

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <MonoLabelMuted>YOUR LIST</MonoLabelMuted>
          <HeadingXL style={{ marginTop: space.s }}>Want to see</HeadingXL>
        </View>
        {!profile ? (
          <EmptyState
            text="Sign in to start curating. Every exhibition you keep here is one you meant to see."
            action={{ label: 'SIGN IN', onPress: () => router.push('/auth/sign-in') }}
          />
        ) : wanted.length === 0 ? (
          <EmptyState
            text="Nothing on your list yet. When something in the agenda catches your eye, keep it here."
            action={{ label: 'BROWSE THE AGENDA', onPress: () => router.push('/(tabs)/agenda') }}
          />
        ) : (
          <View style={styles.list}>
            {wanted.map((e) => (
              <ExhibitionRow
                key={e.id}
                exhibition={e}
                seen={seenIds.has(e.id)}
                onPress={() => router.push(`/exhibition/${e.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
  },
  head: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    paddingBottom: space.m,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
});
