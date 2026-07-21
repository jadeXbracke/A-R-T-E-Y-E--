import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhotoPicker } from '../src/components/image-upload';
import { Field, Hairline, InkBar, Kicker } from '../src/components/ui';
import { api } from '../src/lib/api';
import { useAuth } from '../src/lib/auth';
import { Venue } from '../src/lib/types';
import { colors, fonts, space, type } from '../src/theme';

export default function VenueProfile() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const isOwner = profile?.role === 'venue_owner';

  const [venue, setVenue] = useState<Venue | null | undefined>(undefined);
  const [address, setAddress] = useState('');
  const [suburb, setSuburb] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (isOwner && profile) {
        api.myVenue(profile.id).then((v) => {
          if (!alive) return;
          setVenue(v);
          if (v) {
            setAddress(v.address ?? '');
            setSuburb(v.suburb ?? '');
            setWebsite(v.website ?? '');
            setInstagram(v.instagram ?? '');
            setImage(v.image_url ?? null);
            setVideo(v.video_url ?? '');
          }
        });
      } else {
        setVenue(null);
      }
      return () => {
        alive = false;
      };
    }, [isOwner, profile])
  );

  if (!isOwner) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Venues only</Text>
        <Text style={styles.note}>Sign in with a venue account to manage your space.</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  const save = async () => {
    if (!venue) return;
    setError(null);
    setBusy(true);
    try {
      let imageUrl = image;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('asset:')) {
        imageUrl = await api.uploadImage(imageUrl);
      }
      await api.updateVenue(venue.id, {
        address: address.trim() || null,
        suburb: suburb.trim() || null,
        website: website.trim() || null,
        instagram: instagram.trim() || null,
        image_url: imageUrl,
        video_url: video.trim() || null,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space.m,
        paddingBottom: insets.bottom + space.xl,
        paddingHorizontal: space.page,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.head}>
        <Kicker>YOUR VENUE</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>

      {venue === undefined ? null : venue === null ? (
        <Text style={styles.note}>
          No venue is attached to your account yet. It’s created with your first submission.
        </Text>
      ) : (
        <>
          <Text style={[type.serifHeading, { marginBottom: space.l }]}>{venue.name}</Text>
          <Hairline style={{ marginBottom: space.l }} />

          <Kicker style={{ marginBottom: 10 }}>PHOTO OF THE SPACE</Kicker>
          <View style={{ marginBottom: space.xl }}>
            <PhotoPicker uri={image} onPick={setImage} addLabel="ADD A PHOTO" />
          </View>

          <Field label="ADDRESS" value={address} onChangeText={setAddress} placeholder="Street, Sydney NSW" />
          <Field label="SUBURB" value={suburb} onChangeText={setSuburb} placeholder="e.g. Paddington" />
          <Field
            label="WEBSITE"
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://…"
          />
          <Field
            label="INSTAGRAM"
            value={instagram}
            onChangeText={setInstagram}
            autoCapitalize="none"
            placeholder="@handle"
          />
          <Field
            label="VIDEO URL — OPTIONAL"
            value={video}
            onChangeText={setVideo}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="Link to a short clip (.mp4) of your space"
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {saved && <Text style={styles.saved}>SAVED — your venue page is updated.</Text>}

          <InkBar label="SAVE" onPress={save} busy={busy} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: space.m,
  },
  back: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.grey,
    marginTop: space.m,
  },
  note: {
    fontFamily: fonts.serifItalic,
    fontSize: 18,
    lineHeight: 27,
    color: colors.grey,
    marginTop: space.m,
  },
  error: { fontFamily: fonts.mono, fontSize: 11, color: colors.red, marginBottom: space.m },
  saved: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.ink,
    marginBottom: space.m,
  },
});
