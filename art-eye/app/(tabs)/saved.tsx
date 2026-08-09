import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExhibitionRow } from '../../src/components/exhibition';
import { EmptyState, Hairline, Kicker, Loading, MonoLink } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { daysUntil } from '../../src/lib/dates';
import { Exhibition } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = useState<Exhibition[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (!profile) {
        setItems([]);
        return;
      }
      (async () => {
        const [ids, all] = await Promise.all([
          api.listWatchlist(profile.id),
          api.listApprovedExhibitions(),
        ]);
        // soonest-closing first, so nothing slips away unseen
        if (alive) {
          setItems(
            all
              .filter((e) => ids.includes(e.id))
              .sort((a, b) => (a.end_date < b.end_date ? -1 : 1))
          );
        }
      })();
      return () => {
        alive = false;
      };
    }, [profile])
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={{ paddingHorizontal: space.page, paddingBottom: space.m }}>
        <Kicker style={{ marginBottom: 10 }}>YOUR LIST</Kicker>
        <Text style={type.serifHeading}>Want to see</Text>
      </View>
      <Hairline />

      {!profile ? (
        <View style={{ paddingHorizontal: space.page, paddingTop: space.xl }}>
          <Text style={styles.signedOut}>
            Sign in to keep a list of what not to miss — and a record of what you saw.
          </Text>
          <MonoLink
            label="SIGN IN"
            active
            onPress={() => router.push('/auth')}
            style={{ alignSelf: 'flex-start', marginTop: space.l }}
          />
        </View>
      ) : items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState>
          Nothing saved yet. When an exhibition catches your eye, keep it here — the list of
          what not to miss.
        </EmptyState>
      ) : (
        items.map((e, i) => {
          const left = daysUntil(e.end_date);
          const closing =
            left < 0 ? null : left === 0 ? 'CLOSES TODAY' : left <= 7 ? `CLOSES IN ${left} DAY${left > 1 ? 'S' : ''}` : null;
          return (
            <View key={e.id}>
              {i > 0 && <Hairline style={{ marginHorizontal: space.page }} />}
              {closing && <Text style={styles.closing}>● {closing}</Text>}
              <ExhibitionRow exhibition={e} />
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  closing: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.red,
    paddingHorizontal: space.page,
    paddingTop: space.m,
    marginBottom: -6,
  },
  signedOut: {
    fontFamily: fonts.serif, letterSpacing: 2.2, textTransform: 'uppercase',
    fontSize: 16,
    lineHeight: 26,
    color: colors.ink,
  },
});
