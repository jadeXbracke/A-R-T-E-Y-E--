import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { Exhibition, ExhibitionInput, Venue, VenueType } from '@/lib/types';
import { buildInput } from '@/lib/validate';
import { color, space, type } from '@/theme';
import { ArtImage, Field, FieldLabel, InkButton, MonoText, OptionRow } from './ui';

export interface ExhibitionFormProps {
  initial?: { exhibition: Exhibition; venue?: Venue };
  submitLabel: string;
  askContact?: boolean; // public form: optional contact email
  onSubmit: (input: ExhibitionInput) => Promise<void>;
  extraActions?: React.ReactNode;
}

export function ExhibitionForm({
  initial,
  submitLabel,
  askContact,
  onSubmit,
  extraActions,
}: ExhibitionFormProps) {
  const { uploadImage } = useStore();
  const e = initial?.exhibition;
  const [venueName, setVenueName] = useState(initial?.venue?.name ?? '');
  const [venueType, setVenueType] = useState<VenueType | null>(initial?.venue?.type ?? null);
  const [title, setTitle] = useState(e?.title ?? '');
  const [artists, setArtists] = useState(e?.artists ?? '');
  const [start, setStart] = useState(e?.start_date ?? '');
  const [end, setEnd] = useState(e?.end_date ?? '');
  const [opening, setOpening] = useState(
    e?.opening_datetime ? e.opening_datetime.slice(0, 16).replace('T', ' ') : ''
  );
  const [description, setDescription] = useState(e?.description ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(e?.image_url ?? null);
  const [contact, setContact] = useState(e?.submitter_contact ?? '');
  const [busy, setBusy] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      try {
        setBusy(true);
        setImageUrl(await uploadImage(res.assets[0].uri));
      } catch (err) {
        Alert.alert('Image', err instanceof Error ? err.message : 'Upload failed.');
      } finally {
        setBusy(false);
      }
    }
  };

  const submit = async () => {
    const input = buildInput({
      venueName, venueType, title, artists, start, end, opening, description, imageUrl, contact,
    });
    if (typeof input === 'string') {
      Alert.alert('Not quite complete', input);
      return;
    }
    try {
      setBusy(true);
      await onSubmit(input);
    } catch (err) {
      Alert.alert('Submission', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: space.l }}>
      <View>
        <FieldLabel>VENUE</FieldLabel>
        <Field value={venueName} onChangeText={setVenueName} placeholder="Venue name" autoCapitalize="words" />
      </View>
      <View>
        <FieldLabel>TYPE</FieldLabel>
        <OptionRow
          options={[
            { key: 'museum', label: 'MUSEUM' },
            { key: 'gallery', label: 'GALLERY' },
          ]}
          value={venueType}
          onChange={setVenueType}
        />
      </View>
      <View>
        <FieldLabel>EXHIBITION TITLE</FieldLabel>
        <Field serif value={title} onChangeText={setTitle} placeholder="Title" />
      </View>
      <View>
        <FieldLabel>ARTIST(S)</FieldLabel>
        <Field value={artists} onChangeText={setArtists} placeholder="Artist names" autoCapitalize="words" />
      </View>
      <View style={{ flexDirection: 'row', gap: space.m }}>
        <View style={{ flex: 1 }}>
          <FieldLabel>OPENS (YYYY-MM-DD)</FieldLabel>
          <Field value={start} onChangeText={setStart} placeholder="2026-07-01" keyboardType="numbers-and-punctuation" />
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel>CLOSES (YYYY-MM-DD)</FieldLabel>
          <Field value={end} onChangeText={setEnd} placeholder="2026-08-15" keyboardType="numbers-and-punctuation" />
        </View>
      </View>
      <View>
        <FieldLabel>OPENING NIGHT — OPTIONAL (YYYY-MM-DD HH:MM)</FieldLabel>
        <Field value={opening} onChangeText={setOpening} placeholder="2026-07-22 18:00" keyboardType="numbers-and-punctuation" />
      </View>
      <View>
        <FieldLabel>DESCRIPTION</FieldLabel>
        <Field
          serif
          value={description}
          onChangeText={setDescription}
          placeholder="A few lines on the exhibition"
          multiline
          style={{ minHeight: 110, textAlignVertical: 'top' }}
        />
      </View>
      <View>
        <FieldLabel>IMAGE</FieldLabel>
        {imageUrl ? (
          <View style={{ gap: 10 }}>
            <ArtImage uri={imageUrl} toneKey={title || 'new'} style={{ width: '100%', height: 200 }} />
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <Pressable onPress={pickImage} hitSlop={8}>
                <Text style={[type.monoAction, { textDecorationLine: 'underline' }]}>REPLACE</Text>
              </Pressable>
              <Pressable onPress={() => setImageUrl(null)} hitSlop={8}>
                <Text style={[type.monoAction, { color: color.grey, textDecorationLine: 'underline' }]}>REMOVE</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={pickImage} style={{ borderWidth: 1, borderColor: color.ink, paddingVertical: 28, alignItems: 'center' }}>
            <Text style={type.monoAction}>ADD AN IMAGE</Text>
            <MonoText style={{ marginTop: 6 }}>PRESS OR INSTALL IMAGE, LANDSCAPE PREFERRED</MonoText>
          </Pressable>
        )}
      </View>
      {askContact && (
        <View>
          <FieldLabel>YOUR EMAIL — OPTIONAL, FOR QUESTIONS</FieldLabel>
          <Field value={contact} onChangeText={setContact} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
        </View>
      )}
      <Text style={[type.noteSerif, { color: color.grey }]}>
        Every submission is reviewed by our curators before it appears in the agenda.
      </Text>
      <InkButton label={submitLabel} onPress={submit} loading={busy} />
      {extraActions}
    </View>
  );
}
