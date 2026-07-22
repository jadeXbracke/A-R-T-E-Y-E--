import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Kicker, Loading, MonoLink } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { fmtRange } from '../../../src/lib/dates';
import { Exhibition } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

export default function ManageExhibitions() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [shows, setShows] = useState<Exhibition[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const reload = useCallback(() => {
    if (profile?.role === 'admin') api.listAllExhibitions().then(setShows);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      !q
        ? shows
        : (shows ?? []).filter((e) =>
            [e.title, e.artists, e.venue?.name ?? '', e.status]
              .some((f) => f.toLowerCase().includes(q))
          ),
    [shows, q]
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

  const mutate = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
      reload();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = (e: Exhibition) =>
    mutate(e.id, () => api.adminUpdateExhibition(e.id, { is_featured: !e.is_featured }));

  const toggleHidden = (e: Exhibition) =>
    mutate(e.id, () => api.adminUpdateExhibition(e.id, { is_fixture: !e.is_fixture }));

  const confirmDelete = (e: Exhibition) =>
    Alert.alert('Delete this exhibition?', `“${e.title}” will be removed. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => mutate(e.id, () => api.deleteExhibition(e.id)),
      },
    ]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <View>
          <Kicker style={{ marginBottom: 10 }}>HOST CONTROL</Kicker>
          <Text style={type.serifHeading}>Exhibitions</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: space.page, marginBottom: space.m }}>
        <MonoLink
          label="＋ ADD AN EXHIBITION"
          active
          onPress={() => router.push('/admin/exhibitions/new')}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
      <View style={{ paddingHorizontal: space.page, marginBottom: space.m }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search — title, artist, venue, status…"
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
          {q ? `No exhibitions match “${query.trim()}”.` : 'No exhibitions yet. Add the first one.'}
        </EmptyState>
      ) : (
        shown.map((e) => (
          <View key={e.id} style={styles.row}>
            <Text style={styles.rowDates}>{fmtRange(e.start_date, e.end_date)}</Text>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {e.title}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {(e.venue?.name ?? 'NO VENUE').toUpperCase()} · {e.status.toUpperCase()}
              {e.is_featured ? ' · PICK' : ''}
              {e.is_fixture ? ' · HIDDEN' : ''}
            </Text>
            <View style={styles.actions}>
              <MonoLink label="EDIT" onPress={() => router.push(`/admin/${e.id}`)} />
              <MonoLink
                label={e.is_featured ? 'UNPICK' : 'PICK'}
                active={e.is_featured}
                onPress={() => toggleFeatured(e)}
              />
              <MonoLink
                label={e.is_fixture ? 'SHOW' : 'HIDE'}
                onPress={() => toggleHidden(e)}
              />
              <MonoLink label="DELETE" color={colors.red} onPress={() => confirmDelete(e)} />
            </View>
            {busyId === e.id && <Text style={styles.saving}>SAVING…</Text>}
          </View>
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
    color: colors.grey,
    marginTop: space.m,
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
  row: {
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowDates: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.grey, marginBottom: 3 },
  rowTitle: { ...type.serifTitle, fontSize: 20 },
  rowMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.grey,
    marginTop: 4,
    marginBottom: space.s,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.l, marginTop: 4 },
  saving: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.grey,
    marginTop: space.s,
  },
});
