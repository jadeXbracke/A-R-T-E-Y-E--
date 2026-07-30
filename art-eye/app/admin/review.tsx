import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Kicker, Loading } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { fmtRange } from '../../src/lib/dates';
import { Exhibition } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

export default function AdminReviewQueue() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [pending, setPending] = useState<Exhibition[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (profile?.role === 'admin') {
        api.listPending().then((p) => alive && setPending(p));
      }
      return () => {
        alive = false;
      };
    }, [profile])
  );

  if (profile?.role !== 'admin') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top + space.xl,
          paddingHorizontal: space.page,
        }}
      >
        <Text style={type.serifHeading}>Host only</Text>
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
        <View>
          <Kicker style={{ marginBottom: 10 }}>EDITORS’ DESK</Kicker>
          <Text style={type.serifHeading}>In review</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Hairline />

      {pending === null ? (
        <Loading />
      ) : pending.length === 0 ? (
        <EmptyState>The desk is clear. New submissions will wait for you here.</EmptyState>
      ) : (
        pending.map((e) => (
          <Pressable
            key={e.id}
            style={styles.row}
            onPress={() => router.push(`/admin/${e.id}`)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowDates}>{fmtRange(e.start_date, e.end_date)}</Text>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {e.title}
              </Text>
              <Text style={styles.rowVenue} numberOfLines={1}>
                {e.artists.toUpperCase()} · {e.venue?.name.toUpperCase() ?? 'NEW VENUE'}
              </Text>
            </View>
            <Text style={styles.review}>REVIEW</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ink,
    marginTop: space.m,
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
  rowDates: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.ink, marginBottom: 3 },
  rowTitle: { ...type.serifTitle, fontSize: 15, letterSpacing: 2.2 },
  rowVenue: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.ink,
    marginTop: 4,
  },
  review: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.red,
    textDecorationLine: 'underline',
  },
});
