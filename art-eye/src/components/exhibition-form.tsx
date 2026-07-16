import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { formatOpening } from '../lib/dates';
import { colors, space, type } from '../lib/theme';
import { Exhibition, SubmissionInput, Venue, VenueType } from '../lib/types';
import { Field, Hairline, InkBar, Mono, MonoLink } from './ui';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}$/;

export interface ExhibitionFormProps {
  venues: Venue[];
  initial?: Exhibition;
  submitLabel: string;
  onSubmit: (input: SubmissionInput) => Promise<void>;
}

/** Shared submission/edit form — venue owners, the public form, and admin edits. */
export function ExhibitionForm({ venues, initial, submitLabel, onSubmit }: ExhibitionFormProps) {
  const [venueId, setVenueId] = useState<string | null>(initial?.venue_id ?? null);
  const [newVenue, setNewVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueType, setNewVenueType] = useState<VenueType>('gallery');
  const [newVenueAddress, setNewVenueAddress] = useState('');

  const [title, setTitle] = useState(initial?.title ?? '');
  const [artists, setArtists] = useState(initial?.artists ?? '');
  const [startDate, setStartDate] = useState(initial?.start_date ?? '');
  const [endDate, setEndDate] = useState(initial?.end_date ?? '');
  const [openingDate, setOpeningDate] = useState(
    initial?.opening_datetime ? initial.opening_datetime.slice(0, 10) : ''
  );
  const [openingTime, setOpeningTime] = useState(
    initial?.opening_datetime ? initial.opening_datetime.slice(11, 16) : ''
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUri, setImageUri] = useState<string | null>(initial?.image_url ?? null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const validate = (): string | null => {
    if (!initial && !venueId && !(newVenue && newVenueName.trim())) return 'Choose a venue or name a new one.';
    if (!title.trim()) return 'A title is required.';
    if (!artists.trim()) return 'Name the artist or artists.';
    if (!DATE_RE.test(startDate)) return 'Start date must be YYYY-MM-DD.';
    if (!DATE_RE.test(endDate)) return 'End date must be YYYY-MM-DD.';
    if (endDate < startDate) return 'The end date is before the start date.';
    if (openingDate && !DATE_RE.test(openingDate)) return 'Opening date must be YYYY-MM-DD.';
    if (openingDate && openingTime && !TIME_RE.test(openingTime)) return 'Opening time must be HH:MM.';
    if (!description.trim()) return 'A short description is required.';
    return null;
  };

  const submit = async () => {
    if (busy) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const opening = openingDate
        ? `${openingDate}T${(openingTime || '18:00').padStart(5, '0')}:00`
        : null;
      await onSubmit({
        venue_id: newVenue ? null : venueId,
        new_venue_name: newVenue ? newVenueName : undefined,
        new_venue_type: newVenue ? newVenueType : undefined,
        new_venue_address: newVenue ? newVenueAddress : undefined,
        title,
        artists,
        start_date: startDate,
        end_date: endDate,
        opening_datetime: opening,
        description,
        image_url: imageUri,
      });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const openingPreview =
    openingDate && DATE_RE.test(openingDate)
      ? formatOpening(`${openingDate}T${(openingTime || '18:00').padStart(5, '0')}:00`)
      : null;

  return (
    <View>
      {!initial && (
        <View style={{ marginBottom: space.l }}>
          <Mono style={{ marginBottom: space.m }}>VENUE</Mono>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m, rowGap: space.m }}>
            {venues.map((v) => (
              <MonoLink
                key={v.id}
                label={v.name}
                active={!newVenue && venueId === v.id}
                onPress={() => {
                  setVenueId(v.id);
                  setNewVenue(false);
                }}
              />
            ))}
            <MonoLink label="Somewhere else" active={newVenue} onPress={() => setNewVenue(true)} />
          </View>
          {newVenue && (
            <View style={{ marginTop: space.l }}>
              <Field label="Venue name" value={newVenueName} onChangeText={setNewVenueName} />
              <Mono style={{ marginBottom: space.m }}>VENUE TYPE</Mono>
              <View style={{ flexDirection: 'row', gap: space.l, marginBottom: space.l }}>
                <MonoLink label="Gallery" active={newVenueType === 'gallery'} onPress={() => setNewVenueType('gallery')} />
                <MonoLink label="Museum" active={newVenueType === 'museum'} onPress={() => setNewVenueType('museum')} />
              </View>
              <Field label="Address" value={newVenueAddress} onChangeText={setNewVenueAddress} placeholder="Street, suburb — Sydney" />
            </View>
          )}
          <Hairline style={{ marginTop: space.m }} />
        </View>
      )}

      <Field label="Exhibition title" value={title} onChangeText={setTitle} />
      <Field label="Artist(s)" value={artists} onChangeText={setArtists} placeholder="As they should appear" />
      <Field label="Start date" value={startDate} onChangeText={setStartDate} placeholder="2026-07-01" autoCapitalize="none" />
      <Field label="End date" value={endDate} onChangeText={setEndDate} placeholder="2026-08-15" autoCapitalize="none" />
      <Field
        label="Opening night — date (optional)"
        value={openingDate}
        onChangeText={setOpeningDate}
        placeholder="2026-07-01"
        autoCapitalize="none"
      />
      <Field
        label="Opening night — time"
        value={openingTime}
        onChangeText={setOpeningTime}
        placeholder="18:00"
        autoCapitalize="none"
        hint={openingPreview ? `Will appear as: OPENING ${openingPreview}` : undefined}
      />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="A few lines on the exhibition."
      />

      <Mono style={{ marginBottom: space.m }}>IMAGE</Mono>
      {imageUri ? (
        <View style={{ marginBottom: space.m }}>
          <Image source={{ uri: imageUri }} style={{ width: 140, height: 175 }} contentFit="cover" />
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: space.l, marginBottom: space.xl }}>
        <MonoLink label={imageUri ? 'Replace image' : 'Add image'} active onPress={pickImage} />
        {imageUri ? <MonoLink label="Remove" onPress={() => setImageUri(null)} /> : null}
      </View>

      {error && <Mono style={{ color: colors.accent, marginBottom: space.m }}>{error.toUpperCase()}</Mono>}

      <InkBar label={busy ? 'Sending…' : submitLabel} onPress={submit} disabled={busy} />
      <Text
        style={[
          type.serifItalicBody,
          { fontSize: 14, lineHeight: 19, color: colors.grey, marginTop: space.m },
        ]}
      >
        Every listing is reviewed before it joins the agenda.
      </Text>
    </View>
  );
}
