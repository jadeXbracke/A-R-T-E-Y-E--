import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hairline, Kicker, Lift, Loading } from '../src/components/ui';
import { api } from '../src/lib/api';
import { Exhibition } from '../src/lib/types';
import { colors, fonts, space, type } from '../src/theme';

/** Start a post: pick the show you saw, then the log screen does the rest. */
export default function NewPost() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [exhibitions, setExhibitions] = useState<Exhibition[] | null>(null);

  useEffect(() => {
    api.listApprovedExhibitions().then(setExhibitions);
  }, []);

  const q = query.trim().toLowerCase();
  const hits = useMemo(() => {
    if (!exhibitions) return [];
    if (!q) return exhibitions;
    return exhibitions.filter((e) =>
      [e.title, e.artists, e.venue?.name ?? ''].some((f) => f.toLowerCase().includes(q))
    );
  }, [exhibitions, q]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.head}>
        <View>
          <Kicker style={{ marginBottom: 10 }}>WHAT DID YOU SEE?</Kicker>
          <Text style={type.serifHeading}>Post</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>CANCEL</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space.page }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search the agenda…"
          placeholderTextColor={colors.grey}
          autoCorrect={false}
          style={styles.input}
        />
      </View>
      <Hairline style={{ marginTop: space.m }} />

      {exhibitions === null ? (
        <Loading />
      ) : hits.length === 0 ? (
        <Text style={styles.hint}>Nothing found — try the artist, title or venue name.</Text>
      ) : (
        hits.map((e) => (
          <Lift key={e.id} style={styles.row} onPress={() => router.push(`/log/${e.id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {e.title}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {e.artists.toUpperCase()}
                {e.venue ? `  ·  ${e.venue.name.toUpperCase()}` : ''}
              </Text>
            </View>
            <Text style={styles.go}>POST →</Text>
          </Lift>
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
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  input: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 8,
  },
  hint: {
    fontFamily: fonts.serifItalic, letterSpacing: 1.7, textTransform: 'uppercase',
    fontSize: 12,
    lineHeight: 19,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingTop: space.l,
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
  rowTitle: { ...type.serifTitle, fontSize: 17 },
  rowMeta: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.ink, marginTop: 4 },
  go: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, color: colors.red },
});
