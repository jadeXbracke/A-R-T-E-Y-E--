import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ExhibitionDraft, VENUE_TYPES, VenueType } from '../lib/types';
import { colors, fonts, space } from '../theme';
import { Field, InkBar, Kicker, MonoLink } from './ui';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export interface ExhibitionFormValues {
  title: string;
  artists: string;
  venue_name: string;
  venue_type: VenueType;
  venue_address: string;
  start_date: string;
  end_date: string;
  opening_date: string;
  opening_time: string;
  description: string;
  image_url: string | null;
  video_url: string;
}

export function draftFromValues(v: ExhibitionFormValues): ExhibitionDraft {
  return {
    title: v.title,
    artists: v.artists,
    venue_name: v.venue_name,
    venue_type: v.venue_type,
    venue_address: v.venue_address,
    start_date: v.start_date,
    end_date: v.end_date,
    opening_datetime:
      v.opening_date && v.opening_time
        ? `${v.opening_date}T${v.opening_time}:00+10:00`
        : null,
    description: v.description,
    image_url: v.image_url,
    video_url: v.video_url.trim() || null,
  };
}

export function emptyValues(): ExhibitionFormValues {
  return {
    title: '',
    artists: '',
    venue_name: '',
    venue_type: 'gallery',
    venue_address: '',
    start_date: '',
    end_date: '',
    opening_date: '',
    opening_time: '',
    description: '',
    image_url: null,
    video_url: '',
  };
}

export function validate(v: ExhibitionFormValues, venueLocked: boolean): string | null {
  if (!v.title.trim()) return 'A title is required.';
  if (!v.artists.trim()) return 'Name the artist or artists.';
  if (!venueLocked && !v.venue_name.trim()) return 'A venue is required.';
  if (!DAY_RE.test(v.start_date)) return 'Start date must be YYYY-MM-DD.';
  if (!DAY_RE.test(v.end_date)) return 'End date must be YYYY-MM-DD.';
  if (v.end_date < v.start_date) return 'The end date falls before the start date.';
  if (v.opening_date && !DAY_RE.test(v.opening_date)) return 'Opening date must be YYYY-MM-DD.';
  if (v.opening_date && !TIME_RE.test(v.opening_time)) return 'Opening time must be HH:MM.';
  if (!v.description.trim()) return 'A short description is required.';
  return null;
}

export function ExhibitionForm({
  values,
  onChange,
  onSubmit,
  submitLabel,
  busy,
  error,
  venueLocked = false,
}: {
  values: ExhibitionFormValues;
  onChange: (v: ExhibitionFormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  busy: boolean;
  error: string | null;
  venueLocked?: boolean;
}) {
  const [picking, setPicking] = useState(false);
  const set = (patch: Partial<ExhibitionFormValues>) => onChange({ ...values, ...patch });

  const pickImage = async () => {
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        set({ image_url: result.assets[0].uri });
      }
    } finally {
      setPicking(false);
    }
  };

  return (
    <View>
      <Field
        label="EXHIBITION TITLE"
        value={values.title}
        onChangeText={(t) => set({ title: t })}
        placeholder="e.g. Places of Delight"
      />
      <Field
        label="ARTIST OR ARTISTS"
        value={values.artists}
        onChangeText={(t) => set({ artists: t })}
        placeholder="e.g. Robby Bennett"
      />

      {!venueLocked && (
        <>
          <Field
            label="VENUE"
            value={values.venue_name}
            onChangeText={(t) => set({ venue_name: t })}
            placeholder="e.g. Cassandra Bird"
          />
          <Kicker style={{ marginBottom: 10 }}>VENUE TYPE</Kicker>
          <View style={{ flexDirection: 'row', gap: space.m, marginBottom: space.l }}>
            {VENUE_TYPES.map((vt) => (
              <MonoLink
                key={vt.value}
                label={vt.label}
                active={values.venue_type === vt.value}
                onPress={() => set({ venue_type: vt.value })}
              />
            ))}
          </View>
          <Field
            label="VENUE ADDRESS — SYDNEY"
            value={values.venue_address}
            onChangeText={(t) => set({ venue_address: t })}
            placeholder="Street, suburb"
          />
        </>
      )}

      <View style={{ flexDirection: 'row', gap: space.l }}>
        <Field
          label="OPENS (YYYY-MM-DD)"
          value={values.start_date}
          onChangeText={(t) => set({ start_date: t })}
          placeholder="2026-07-22"
          autoCapitalize="none"
          style={{ flex: 1 }}
        />
        <Field
          label="CLOSES (YYYY-MM-DD)"
          value={values.end_date}
          onChangeText={(t) => set({ end_date: t })}
          placeholder="2026-08-15"
          autoCapitalize="none"
          style={{ flex: 1 }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: space.l }}>
        <Field
          label="OPENING NIGHT — DATE"
          value={values.opening_date}
          onChangeText={(t) => set({ opening_date: t })}
          placeholder="Optional"
          autoCapitalize="none"
          style={{ flex: 1 }}
        />
        <Field
          label="TIME (HH:MM)"
          value={values.opening_time}
          onChangeText={(t) => set({ opening_time: t })}
          placeholder="18:00"
          autoCapitalize="none"
          style={{ flex: 1 }}
        />
      </View>

      <Kicker style={{ marginBottom: 8 }}>DESCRIPTION</Kicker>
      <TextInput
        value={values.description}
        onChangeText={(t) => set({ description: t })}
        placeholder="A few lines on the exhibition."
        placeholderTextColor={colors.grey}
        multiline
        style={styles.description}
      />

      <Kicker style={{ marginTop: space.l, marginBottom: 10 }}>IMAGE</Kicker>
      {values.image_url && !values.image_url.startsWith('asset:') && (
        <Image
          source={{ uri: values.image_url }}
          style={styles.preview}
          contentFit="cover"
        />
      )}
      <MonoLink
        label={picking ? 'OPENING LIBRARY…' : values.image_url ? 'REPLACE IMAGE' : 'ADD IMAGE'}
        active
        onPress={pickImage}
        style={{ alignSelf: 'flex-start', marginBottom: space.xl }}
      />

      <Field
        label="VIDEO URL — OPTIONAL"
        value={values.video_url}
        onChangeText={(t) => set({ video_url: t })}
        autoCapitalize="none"
        keyboardType="url"
        placeholder="Link to a short clip (.mp4) — plays as a muted moving background"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <InkBar label={submitLabel} onPress={onSubmit} busy={busy} />
      <Text style={styles.reviewNote}>
        Submissions appear in the agenda once reviewed by our editors.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    fontFamily: fonts.serif,
    fontSize: 18,
    lineHeight: 26,
    color: colors.ink,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingBottom: 12,
  },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.hairline,
    marginBottom: space.m,
  },
  error: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.red,
    marginBottom: space.m,
  },
  reviewNote: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.grey,
    marginTop: space.m,
  },
});
