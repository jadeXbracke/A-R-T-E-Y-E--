import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '../lib/api';
import type { Exhibition, SubmissionInput, VenueType } from '../lib/types';
import { colors, PAGE_PAD, type } from '../theme';
import { Field, InkBar, MonoLabel, TextLink } from './ui';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export interface SubmissionFormValues {
  venue_name: string;
  venue_type: VenueType;
  venue_address: string;
  title: string;
  artists: string;
  start_date: string;
  end_date: string;
  opening: string; // "YYYY-MM-DD HH:MM" or ''
  description: string;
  image_url: string | null;
  submitter_email: string;
}

export function valuesFromExhibition(e: Exhibition): SubmissionFormValues {
  return {
    venue_name: e.venue?.name ?? '',
    venue_type: e.venue?.type ?? 'gallery',
    venue_address: e.venue?.address ?? '',
    title: e.title,
    artists: e.artists,
    start_date: e.start_date,
    end_date: e.end_date,
    opening: e.opening_datetime
      ? e.opening_datetime.slice(0, 16).replace('T', ' ')
      : '',
    description: e.description ?? '',
    image_url: e.image_url,
    submitter_email: e.submitter_email ?? '',
  };
}

const EMPTY: SubmissionFormValues = {
  venue_name: '',
  venue_type: 'gallery',
  venue_address: '',
  title: '',
  artists: '',
  start_date: '',
  end_date: '',
  opening: '',
  description: '',
  image_url: null,
  submitter_email: '',
};

export function toSubmissionInput(v: SubmissionFormValues): SubmissionInput {
  return {
    venue_name: v.venue_name,
    venue_type: v.venue_type,
    venue_address: v.venue_address || undefined,
    title: v.title,
    artists: v.artists,
    start_date: v.start_date,
    end_date: v.end_date,
    opening_datetime: v.opening ? v.opening.replace(' ', 'T') + ':00+10:00' : null,
    description: v.description || undefined,
    image_url: v.image_url,
    submitter_email: v.submitter_email || undefined,
  };
}

export function validate(v: SubmissionFormValues, askEmail: boolean): string | null {
  if (!v.title.trim()) return 'TITLE IS REQUIRED';
  if (!v.artists.trim()) return 'ARTIST(S) IS REQUIRED';
  if (!v.venue_name.trim()) return 'VENUE IS REQUIRED';
  if (!DATE_RE.test(v.start_date)) return 'START DATE MUST BE YYYY-MM-DD';
  if (!DATE_RE.test(v.end_date)) return 'END DATE MUST BE YYYY-MM-DD';
  if (v.end_date < v.start_date) return 'END DATE IS BEFORE START DATE';
  if (v.opening && !DATETIME_RE.test(v.opening))
    return 'OPENING MUST BE YYYY-MM-DD HH:MM';
  if (askEmail && !v.submitter_email.trim()) return 'CONTACT EMAIL IS REQUIRED';
  return null;
}

/**
 * The shared submission form — used by the venue-owner tab, the public
 * no-account form, owner edits and admin edits before approval.
 */
export function SubmissionForm({
  initial,
  askEmail = false,
  submitLabel,
  onSubmit,
}: {
  initial?: SubmissionFormValues;
  askEmail?: boolean;
  submitLabel: string;
  onSubmit: (values: SubmissionFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<SubmissionFormValues>(initial ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SubmissionFormValues>(key: K, value: SubmissionFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setError(null);
      try {
        const url = await api.uploadImage(result.assets[0].uri);
        set('image_url', url);
      } catch (e) {
        setError(
          (e instanceof Error ? e.message : 'Image upload failed.').toUpperCase(),
        );
      }
    }
  };

  const submit = async () => {
    const problem = validate(values, askEmail);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit(values);
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : 'Something went wrong.').toUpperCase(),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Field
        label="EXHIBITION TITLE"
        value={values.title}
        onChangeText={(t) => set('title', t)}
        placeholder="As it appears on the wall"
      />
      <Field
        label="ARTIST(S)"
        value={values.artists}
        onChangeText={(t) => set('artists', t)}
        placeholder="Name, Name"
      />
      <Field
        label="VENUE"
        value={values.venue_name}
        onChangeText={(t) => set('venue_name', t)}
        placeholder="Gallery or museum name"
      />
      <MonoLabel style={{ marginBottom: 10 }}>VENUE TYPE</MonoLabel>
      <View style={styles.linkRow}>
        <TextLink
          label="GALLERY"
          active={values.venue_type === 'gallery'}
          onPress={() => set('venue_type', 'gallery')}
        />
        <TextLink
          label="MUSEUM"
          active={values.venue_type === 'museum'}
          onPress={() => set('venue_type', 'museum')}
        />
      </View>
      <Field
        label="VENUE ADDRESS (OPTIONAL)"
        value={values.venue_address}
        onChangeText={(t) => set('venue_address', t)}
        placeholder="Street, suburb"
        style={{ marginTop: 24 }}
      />
      <Field
        label="OPENS (YYYY-MM-DD)"
        value={values.start_date}
        onChangeText={(t) => set('start_date', t)}
        placeholder="2026-08-01"
        autoCapitalize="none"
      />
      <Field
        label="CLOSES (YYYY-MM-DD)"
        value={values.end_date}
        onChangeText={(t) => set('end_date', t)}
        placeholder="2026-09-12"
        autoCapitalize="none"
      />
      <Field
        label="OPENING NIGHT (OPTIONAL — YYYY-MM-DD HH:MM)"
        value={values.opening}
        onChangeText={(t) => set('opening', t)}
        placeholder="2026-08-01 18:00"
        autoCapitalize="none"
      />
      <Field
        label="DESCRIPTION"
        value={values.description}
        onChangeText={(t) => set('description', t)}
        placeholder="A few lines on the show"
        multiline
      />
      {askEmail ? (
        <Field
          label="YOUR CONTACT EMAIL"
          value={values.submitter_email}
          onChangeText={(t) => set('submitter_email', t)}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      ) : null}

      <MonoLabel style={{ marginBottom: 10 }}>IMAGE</MonoLabel>
      {values.image_url ? (
        <View style={{ marginBottom: 12 }}>
          <Image
            source={values.image_url}
            style={styles.preview}
            contentFit="cover"
          />
        </View>
      ) : null}
      <View style={styles.linkRow}>
        <TextLink
          label={values.image_url ? 'REPLACE IMAGE' : 'ADD IMAGE'}
          onPress={pickImage}
        />
        {values.image_url ? (
          <TextLink label="REMOVE" onPress={() => set('image_url', null)} />
        ) : null}
      </View>

      {error ? (
        <Text style={[type.monoSmall, { color: colors.red, marginTop: 20 }]}>{error}</Text>
      ) : null}

      <View style={{ marginTop: 32 }}>
        <InkBar label={submitLabel} onPress={submit} busy={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linkRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
  },
  preview: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: colors.hairline,
  },
});

export const FORM_PAGE_PAD = PAGE_PAD;
