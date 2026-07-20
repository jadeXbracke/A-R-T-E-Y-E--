import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field, Hairline, InkBar, Kicker, MonoLink } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { VENUE_TYPES, VenueDraft, VenueType } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

function numOrNull(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function VenueEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const isNew = id === 'new';

  const [ready, setReady] = useState(isNew);
  const [name, setName] = useState('');
  const [vType, setVType] = useState<VenueType>('gallery');
  const [address, setAddress] = useState('');
  const [suburb, setSuburb] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || profile?.role !== 'admin') return;
    api.listVenues().then((all) => {
      const v = all.find((x) => x.id === id);
      if (!v) return;
      setName(v.name);
      setVType(v.type);
      setAddress(v.address ?? '');
      setSuburb(v.suburb ?? '');
      setWebsite(v.website ?? '');
      setInstagram(v.instagram ?? '');
      setLat(v.latitude != null ? String(v.latitude) : '');
      setLng(v.longitude != null ? String(v.longitude) : '');
      setHidden(!!v.is_fixture);
      setReady(true);
    });
  }, [id, isNew, profile]);

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

  const save = async () => {
    if (!name.trim()) {
      setError('A venue name is required.');
      return;
    }
    setError(null);
    setBusy(true);
    const draft: VenueDraft = {
      name,
      type: vType,
      address: address.trim() || null,
      suburb: suburb.trim() || null,
      website: website.trim() || null,
      instagram: instagram.trim() || null,
      latitude: numOrNull(lat),
      longitude: numOrNull(lng),
      is_fixture: hidden,
    };
    try {
      if (isNew) {
        await api.createVenue(draft);
      } else {
        await api.updateVenue(id, draft);
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete this venue?',
      'This also removes every exhibition at this venue. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await api.deleteVenue(id);
              router.back();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Something went wrong.');
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: insets.bottom + space.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.head}>
        <Kicker>{isNew ? 'NEW VENUE' : 'EDIT VENUE'}</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.cancel}>CANCEL</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space.page, paddingTop: space.l }}>
        <Field label="NAME" value={name} onChangeText={setName} placeholder="e.g. Carriageworks" />

        <Kicker style={{ marginBottom: 10 }}>TYPE</Kicker>
        <View style={{ flexDirection: 'row', gap: space.m, marginBottom: space.l }}>
          {VENUE_TYPES.map((vt) => (
            <MonoLink
              key={vt.value}
              label={vt.label}
              active={vType === vt.value}
              onPress={() => setVType(vt.value)}
            />
          ))}
        </View>

        <Field label="ADDRESS" value={address} onChangeText={setAddress} placeholder="Street, Sydney NSW" />
        <Field label="SUBURB" value={suburb} onChangeText={setSuburb} placeholder="e.g. Paddington" />
        <Field
          label="WEBSITE"
          value={website}
          onChangeText={setWebsite}
          autoCapitalize="none"
          placeholder="https://…"
        />
        <Field
          label="INSTAGRAM"
          value={instagram}
          onChangeText={setInstagram}
          autoCapitalize="none"
          placeholder="@handle"
        />
        <View style={{ flexDirection: 'row', gap: space.l }}>
          <Field
            label="LATITUDE"
            value={lat}
            onChangeText={setLat}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            placeholder="-33.8688"
            style={{ flex: 1 }}
          />
          <Field
            label="LONGITUDE"
            value={lng}
            onChangeText={setLng}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            placeholder="151.2173"
            style={{ flex: 1 }}
          />
        </View>

        <View style={{ marginBottom: space.xl }}>
          <MonoLink
            label={hidden ? 'HIDDEN FROM PUBLIC ·' : 'VISIBLE — TAP TO HIDE FROM PUBLIC'}
            active={hidden}
            color={hidden ? colors.red : undefined}
            onPress={() => setHidden(!hidden)}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <InkBar label={isNew ? 'ADD VENUE' : 'SAVE CHANGES'} onPress={save} busy={busy} />

        {!isNew && (
          <>
            <Hairline style={{ marginVertical: space.l }} />
            <MonoLink
              label="DELETE THIS VENUE"
              color={colors.red}
              onPress={confirmDelete}
              style={{ alignSelf: 'flex-start' }}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  cancel: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.grey,
    textDecorationLine: 'underline',
  },
  back: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.grey,
    marginTop: space.m,
  },
  error: { fontFamily: fonts.mono, fontSize: 11, color: colors.red, marginBottom: space.m },
});
