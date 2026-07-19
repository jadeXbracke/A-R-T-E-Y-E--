import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { imageSource } from '../data/placeholders';
import { color, space } from '../theme';
import type { Exhibition, ExhibitionInput, VenueType } from '../types';
import { Field, OptionRow } from './Field';
import { MonoLabel, MonoLabelMuted } from './Type';
import { FormNote, TextLink } from './kit';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/;

export function emptyInput(): ExhibitionInput {
  return {
    venue_name: '',
    venue_type: 'gallery',
    venue_address: '',
    title: '',
    artists: '',
    start_date: '',
    end_date: '',
    opening_datetime: null,
    description: '',
    image_url: null,
  };
}

export function inputFromExhibition(e: Exhibition): ExhibitionInput {
  return {
    venue_name: e.venue?.name ?? '',
    venue_type: e.venue?.type ?? 'gallery',
    venue_address: e.venue?.address ?? '',
    title: e.title,
    artists: e.artists,
    start_date: e.start_date,
    end_date: e.end_date,
    opening_datetime: e.opening_datetime,
    description: e.description,
    image_url: e.image_url,
  };
}

export function validateInput(input: ExhibitionInput): string | null {
  if (!input.venue_name.trim()) return 'The venue name is missing.';
  if (!input.title.trim()) return 'The exhibition title is missing.';
  if (!input.artists.trim()) return 'Name at least one artist.';
  if (!DATE_RE.test(input.start_date)) return 'Start date should read YYYY-MM-DD.';
  if (!DATE_RE.test(input.end_date)) return 'End date should read YYYY-MM-DD.';
  if (input.end_date < input.start_date) return 'The end date comes before the start.';
  return null;
}

/**
 * The exhibition submission form — mono labels, hairline fields,
 * square edges. Shared by the public form, venue owners and the admin desk.
 */
export function ExhibitionForm({
  input,
  onChange,
  lockVenue = false,
}: {
  input: ExhibitionInput;
  onChange: (next: ExhibitionInput) => void;
  lockVenue?: boolean;
}) {
  const [opening, setOpening] = useState(
    input.opening_datetime ? input.opening_datetime.slice(0, 16).replace('T', ' ') : '',
  );
  const [openingError, setOpeningError] = useState('');

  const set = <K extends keyof ExhibitionInput>(key: K, value: ExhibitionInput[K]) =>
    onChange({ ...input, [key]: value });

  const setOpeningText = (text: string) => {
    setOpening(text);
    const trimmed = text.trim();
    if (!trimmed) {
      setOpeningError('');
      set('opening_datetime', null);
      return;
    }
    if (DATETIME_RE.test(trimmed)) {
      setOpeningError('');
      set('opening_datetime', `${trimmed.replace(' ', 'T')}:00+10:00`);
    } else {
      setOpeningError('USE YYYY-MM-DD HH:MM, OR LEAVE BLANK');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      set('image_url', result.assets[0].uri);
    }
  };

  return (
    <View>
      {!lockVenue ? (
        <>
          <Field
            label="VENUE"
            value={input.venue_name}
            onChangeText={(t) => set('venue_name', t)}
            placeholder="e.g. Roslyn Oxley9 Gallery"
          />
          <OptionRow<VenueType>
            label="VENUE TYPE"
            options={[
              { value: 'gallery', label: 'GALLERY' },
              { value: 'museum', label: 'MUSEUM' },
            ]}
            value={input.venue_type}
            onChange={(v) => set('venue_type', v)}
          />
          <Field
            label="VENUE ADDRESS"
            value={input.venue_address}
            onChangeText={(t) => set('venue_address', t)}
            placeholder="Street and suburb, Sydney"
          />
        </>
      ) : null}

      <Field
        label="EXHIBITION TITLE"
        serif
        value={input.title}
        onChangeText={(t) => set('title', t)}
        placeholder="The title, as the venue prints it"
      />
      <Field
        label="ARTISTS"
        value={input.artists}
        onChangeText={(t) => set('artists', t)}
        placeholder="Names, separated by commas"
      />
      <View style={styles.dates}>
        <Field
          label="OPENS (YYYY-MM-DD)"
          value={input.start_date}
          onChangeText={(t) => set('start_date', t.trim())}
          placeholder="2026-07-22"
          autoCapitalize="none"
          style={{ flex: 1 }}
        />
        <Field
          label="CLOSES (YYYY-MM-DD)"
          value={input.end_date}
          onChangeText={(t) => set('end_date', t.trim())}
          placeholder="2026-08-15"
          autoCapitalize="none"
          style={{ flex: 1 }}
        />
      </View>
      <Field
        label="OPENING NIGHT — OPTIONAL (YYYY-MM-DD HH:MM)"
        value={opening}
        onChangeText={setOpeningText}
        placeholder="2026-07-22 18:00"
        autoCapitalize="none"
      />
      <FormNote text={openingError} error />
      <Field
        label="DESCRIPTION"
        serif
        multiline
        value={input.description}
        onChangeText={(t) => set('description', t)}
        placeholder="A few lines on what the visitor will find."
      />

      <MonoLabelMuted>IMAGE</MonoLabelMuted>
      {input.image_url ? (
        <View style={styles.imageRow}>
          <Image
            source={imageSource(input.image_url)}
            style={styles.imagePreview}
            contentFit="cover"
          />
          <TextLink label="REMOVE" muted onPress={() => set('image_url', null)} />
        </View>
      ) : (
        <Pressable onPress={pickImage} style={styles.imagePick}>
          <MonoLabel style={{ color: color.ink }}>CHOOSE FROM LIBRARY</MonoLabel>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dates: {
    flexDirection: 'row',
    columnGap: space.l,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.l,
    marginTop: space.m,
    marginBottom: space.l,
  },
  imagePreview: {
    width: 96,
    height: 120,
    backgroundColor: color.hairline,
  },
  imagePick: {
    borderWidth: 1,
    borderColor: color.ink,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: space.m,
    marginBottom: space.l,
  },
});
