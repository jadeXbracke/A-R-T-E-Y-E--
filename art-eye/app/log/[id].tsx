import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hairline, InkBar, Kicker, RatingDots } from '../../src/components/ui';
import { PhotoPicker } from '../../src/components/image-upload';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { todayStr } from '../../src/lib/dates';
import { Exhibition } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

export default function LogVisit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [rating, setRating] = useState(0);
  const [reflection, setReflection] = useState('');
  const [video, setVideo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getExhibition(id).then(setExhibition);
    if (profile) {
      api.listVisits(profile.id).then((visits) => {
        const v = visits.find((x) => x.exhibition_id === id);
        if (v) {
          setRating(v.rating);
          setReflection(v.reflection);
          setVideo(v.video_url ?? null);
        }
      });
    }
  }, [id, profile]);

  const save = async () => {
    if (!profile || !rating) return;
    setBusy(true);
    setError(null);
    try {
      let videoUrl = video;
      if (videoUrl && !videoUrl.startsWith('http')) {
        videoUrl = await api.uploadImage(videoUrl); // uploads video too (content-type detected)
      }
      await api.saveVisit({
        user_id: profile.id,
        exhibition_id: id,
        rating,
        reflection: reflection.trim(),
        visit_date: todayStr(),
        video_url: videoUrl,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: space.l,
          paddingHorizontal: space.page,
          paddingBottom: space.l,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headRow}>
          <Kicker>MARK AS SEEN</Kicker>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.cancel}>CANCEL</Text>
          </Pressable>
        </View>

        {exhibition && (
          <>
            <Text style={styles.artist}>{exhibition.artists.toUpperCase()}</Text>
            <Text style={styles.title}>{exhibition.title}</Text>
            <Text style={styles.venue}>{exhibition.venue?.name.toUpperCase()}</Text>
          </>
        )}

        <Hairline style={{ marginVertical: space.l }} />

        <Kicker style={{ marginBottom: space.m }}>YOUR RATING</Kicker>
        <RatingDots value={rating} onChange={setRating} size={22} gap={18} />

        <Kicker style={{ marginTop: space.xl, marginBottom: space.s }}>YOUR NOTE</Kicker>
        <TextInput
          value={reflection}
          onChangeText={setReflection}
          placeholder="What stayed with you?"
          placeholderTextColor={colors.grey}
          multiline
          style={styles.note}
        />
        <Text style={styles.hint}>
          A line is enough. This is your record, not a review for anyone else.
        </Text>

        <Kicker style={{ marginTop: space.xl, marginBottom: space.s }}>VIDEO (OPTIONAL)</Kicker>
        <PhotoPicker uri={video} media="video" onPick={setVideo} addLabel="ADD A CLIP" />
        <Text style={styles.hint}>A short clip from the room — up to a minute.</Text>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, space.m) }}>
        <InkBar
          label="ADD TO YOUR CURATION"
          onPress={save}
          disabled={!rating}
          busy={busy}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xl,
  },
  cancel: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  artist: { ...type.artistCaps, marginBottom: 6 },
  title: { ...type.serifHeading, fontSize: 30, lineHeight: 36, marginBottom: 8 },
  venue: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.8, color: colors.ink },
  note: {
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 8,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingBottom: 12,
  },
  hint: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    marginTop: space.m,
  },
  error: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ink,
    marginTop: space.m,
  },
});
