import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Kicker, Loading, MonoLink } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { Venue } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

export default function VenueRegister() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (profile?.role === 'admin') {
        api.listVenues().then((v) => alive && setVenues(v));
      }
      return () => {
        alive = false;
      };
    }, [profile])
  );

  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      !q
        ? venues
        : (venues ?? []).filter((v) =>
            [v.name, v.suburb ?? '', v.type, v.address ?? '']
              .some((f) => f.toLowerCase().includes(q))
          ),
    [venues, q]
  );

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.guard}>
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
          <Kicker style={{ marginBottom: 10 }}>HOST CONTROL</Kicker>
          <Text style={type.serifHeading}>Venue register</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: space.page, marginBottom: space.m }}>
        <MonoLink
          label="＋ ADD A VENUE"
          active
          onPress={() => router.push('/admin/venues/new')}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
      <View style={{ paddingHorizontal: space.page, marginBottom: space.m }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search the register — name, suburb, address…"
          placeholderTextColor={colors.grey}
          autoCorrect={false}
          style={styles.search}
        />
      </View>
      <Hairline />

      {shown === null ? (
        <Loading />
      ) : shown.length === 0 ? (
        <EmptyState>
          {q ? `Nothing in the register matches “${query.trim()}”.` : 'No venues yet. Add the first one.'}
        </EmptyState>
      ) : (
        shown.map((v) => (
          <Pressable
            key={v.id}
            style={styles.row}
            onPress={() => router.push(`/admin/venues/${v.id}`)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {v.name}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {v.type.toUpperCase()}
                {v.suburb ? ` · ${v.suburb.toUpperCase()}` : ''}
                {v.is_claimed ? ' · CLAIMED' : ''}
                {v.is_fixture ? ' · HIDDEN' : ''}
              </Text>
            </View>
            <Text style={styles.edit}>EDIT</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
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
  search: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowTitle: { ...type.serifTitle, fontSize: 20 },
  rowMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.ink,
    marginTop: 4,
  },
  edit: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.red,
    textDecorationLine: 'underline',
  },
});
