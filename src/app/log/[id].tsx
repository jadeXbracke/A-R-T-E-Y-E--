import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Hairline, InkBar, MonoLabel, RatingDots } from '../../components/ui';
import { api } from '../../lib/api';
import { useApp } from '../../lib/app-context';
import type { Exhibition } from '../../lib/types';
import { colors, fonts, PAGE_PAD, type } from '../../theme';

/**
 * The "mark as seen" flow — YOUR RATING (five dots that fill red),
 * YOUR NOTE (serif textarea), full-width ink save bar.
 */
export default function LogVisit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { exhibitions, visits, markSeen } = useApp();

  const existing = useMemo(
    () => visits.find((v) => v.exhibition_id === id) ?? null,
    [visits, id],
  );

  const cached = exhibitions.find((e) => e.id === id) ?? null;
  const [exhibition, setExhibition] = useState<Exhibition | null>(cached);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [note, setNote] = useState(existing?.reflection ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!exhibition && id) {
      api.getExhibition(id).then((e) => e && setExhibition(e));
    }
  }, [exhibition, id]);

  const save = async () => {
    if (!id || rating === 0) {
      setError('CHOOSE A RATING FIRST');
      return;
    }
    setBusy(true);
    try {
      await markSeen(id, rating, note);
      router.back();
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : 'Could not save your visit.').toUpperCase(),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <MonoLabel style={{ marginTop: 24 }}>MARK AS SEEN</MonoLabel>
        {exhibition ? (
          <>
            <Text style={[type.serifTitleLarge, { marginTop: 10 }]}>
              {exhibition.title}
            </Text>
            <Text style={[type.capsArtist, { fontSize: 11, marginTop: 6 }]}>
              {exhibition.artists}
            </Text>
            <Text style={[type.monoSmall, { marginTop: 6 }]}>
              {exhibition.venue?.name?.toUpperCase()}
            </Text>
          </>
        ) : null}

        <Hairline style={{ marginVertical: 28 }} />

        <MonoLabel style={{ marginBottom: 14 }}>YOUR RATING</MonoLabel>
        <RatingDots rating={rating} size={22} gap={14} onSelect={setRating} />

        <MonoLabel style={{ marginTop: 36, marginBottom: 10 }}>YOUR NOTE</MonoLabel>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What stayed with you?"
          placeholderTextColor={colors.grey}
          multiline
          style={styles.note}
        />
        <Text style={[type.serifQuote, { color: colors.grey, fontSize: 15, marginTop: 12 }]}>
          A line is enough. This is your record, not a review for anyone else.
        </Text>

        {error ? (
          <Text style={[type.monoSmall, { color: colors.red, marginTop: 18 }]}>{error}</Text>
        ) : null}

        <View style={{ marginTop: 36 }}>
          <InkBar label="SAVE TO YOUR CURATION" onPress={save} busy={busy} disabled={rating === 0} />
        </View>
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text onPress={() => router.back()} style={[type.monoButton, { color: colors.grey, fontSize: 11 }]}>
            CANCEL
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 48,
  },
  note: {
    fontFamily: fonts.serif,
    fontSize: 18,
    lineHeight: 27,
    color: colors.ink,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: 8,
    borderRadius: 0,
  },
});
