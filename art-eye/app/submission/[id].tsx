import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  draftFromValues,
  ExhibitionForm,
  ExhibitionFormValues,
  validate,
} from '../../src/components/exhibition-form';
import { Hairline, Kicker } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Exhibition } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

export function valuesFromExhibition(e: Exhibition): ExhibitionFormValues {
  const opening = e.opening_datetime ? new Date(e.opening_datetime) : null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    title: e.title,
    artists: e.artists,
    venue_name: e.venue?.name ?? '',
    venue_type: e.venue?.type ?? 'gallery',
    venue_address: e.venue?.address ?? '',
    start_date: e.start_date,
    end_date: e.end_date,
    opening_date: opening
      ? `${opening.getFullYear()}-${pad(opening.getMonth() + 1)}-${pad(opening.getDate())}`
      : '',
    opening_time: opening ? `${pad(opening.getHours())}:${pad(opening.getMinutes())}` : '',
    description: e.description,
    image_url: e.image_url,
  };
}

export default function EditSubmission() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [values, setValues] = useState<ExhibitionFormValues | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getExhibition(id).then((e) => e && setValues(valuesFromExhibition(e)));
  }, [id]);

  const save = async () => {
    if (!values || !profile) return;
    const message = validate(values, true);
    if (message) {
      setError(message);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let imageUrl = values.image_url;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('asset:') && !imageUrl.startsWith('file:')) {
        imageUrl = await api.uploadImage(imageUrl);
      } else if (imageUrl?.startsWith('file:')) {
        imageUrl = await api.uploadImage(imageUrl);
      }
      const d = draftFromValues({ ...values, image_url: imageUrl });
      await api.updateSubmission(
        id,
        {
          title: d.title,
          artists: d.artists,
          start_date: d.start_date,
          end_date: d.end_date,
          opening_datetime: d.opening_datetime,
          description: d.description,
          image_url: d.image_url,
        },
        profile.id
      );
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

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
        <View>
          <Kicker style={{ marginBottom: 10 }}>EDIT SUBMISSION</Kicker>
          <Text style={[type.serifHeading, { fontSize: 28 }]} numberOfLines={1}>
            {values?.title || '…'}
          </Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.cancel}>CANCEL</Text>
        </Pressable>
      </View>
      <Hairline style={{ marginBottom: space.l }} />
      {values && (
        <View style={{ paddingHorizontal: space.page }}>
          <Text style={styles.note}>
            Edited submissions return to review before reappearing in the agenda.
          </Text>
          <ExhibitionForm
            values={values}
            onChange={setValues}
            onSubmit={save}
            submitLabel="SAVE — RETURN TO REVIEW"
            busy={busy}
            error={error}
            venueLocked
          />
        </View>
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
    gap: space.m,
  },
  cancel: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.grey,
    textDecorationLine: 'underline',
  },
  note: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.grey,
    marginBottom: space.l,
  },
});
