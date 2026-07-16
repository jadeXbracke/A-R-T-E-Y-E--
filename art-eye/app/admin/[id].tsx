import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exhibitionSource } from '../../src/components/exhibition';
import { Field, Hairline, InkBar, Kicker, MonoLink } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { Exhibition, REJECTION_REASONS, RejectionReason } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';
import { TextInput } from 'react-native';

export default function AdminReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [title, setTitle] = useState('');
  const [artists, setArtists] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getExhibition(id).then((e) => {
      if (!e) return;
      setExhibition(e);
      setTitle(e.title);
      setArtists(e.artists);
      setStartDate(e.start_date);
      setEndDate(e.end_date);
      setDescription(e.description);
      setImageUrl(e.image_url ?? '');
      setFeatured(e.is_featured);
    });
  }, [id]);

  const patch = () => ({
    title: title.trim(),
    artists: artists.trim(),
    start_date: startDate.trim(),
    end_date: endDate.trim(),
    description: description.trim(),
    image_url: imageUrl.trim() || null,
    is_featured: featured,
  });

  const validate = (): boolean => {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!title.trim() || !artists.trim()) {
      setError('Title and artists are required.');
      return false;
    }
    if (!re.test(startDate.trim()) || !re.test(endDate.trim())) {
      setError('Dates must be YYYY-MM-DD.');
      return false;
    }
    setError(null);
    return true;
  };

  const approve = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      await api.adminUpdateExhibition(id, patch());
      await api.approveExhibition(id);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  const reject = async (reason: RejectionReason) => {
    setBusy(true);
    try {
      await api.adminUpdateExhibition(id, patch());
      await api.rejectExhibition(id, reason);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  if (!exhibition) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

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
        <Kicker>REVIEW — {exhibition.status.toUpperCase()}</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.cancel}>CANCEL</Text>
        </Pressable>
      </View>

      <Image
        source={exhibitionSource({ ...exhibition, image_url: imageUrl || exhibition.image_url })}
        style={styles.cover}
        contentFit="cover"
      />

      <View style={{ paddingHorizontal: space.page, paddingTop: space.l }}>
        <Text style={styles.venueLine}>
          {exhibition.venue?.name.toUpperCase()} · {(exhibition.venue?.type ?? '').toUpperCase()} ·{' '}
          {(exhibition.venue?.city ?? 'SYDNEY').toUpperCase()}
        </Text>

        <Field label="TITLE" value={title} onChangeText={setTitle} />
        <Field label="ARTISTS" value={artists} onChangeText={setArtists} />
        <View style={{ flexDirection: 'row', gap: space.l }}>
          <Field
            label="OPENS"
            value={startDate}
            onChangeText={setStartDate}
            autoCapitalize="none"
            style={{ flex: 1 }}
          />
          <Field
            label="CLOSES"
            value={endDate}
            onChangeText={setEndDate}
            autoCapitalize="none"
            style={{ flex: 1 }}
          />
        </View>
        <Field
          label="IMAGE URL"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          placeholder="https:// … or asset:slug"
        />
        <Kicker style={{ marginBottom: 8 }}>DESCRIPTION</Kicker>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.description}
        />

        <View style={{ flexDirection: 'row', gap: space.l, marginTop: space.l, marginBottom: space.xl }}>
          <MonoLink
            label={featured ? "CURATOR'S PICK ·" : "MARK AS CURATOR'S PICK"}
            active={featured}
            onPress={() => setFeatured(!featured)}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <InkBar label="APPROVE — INTO THE AGENDA" onPress={approve} busy={busy} />

        <Hairline style={{ marginVertical: space.l }} />
        <Kicker style={{ marginBottom: space.m }}>OR DECLINE — TAP A REASON</Kicker>
        <View style={styles.reasons}>
          {REJECTION_REASONS.map((r) => (
            <MonoLink
              key={r.value}
              label={r.label}
              color={colors.red}
              onPress={() => reject(r.value)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  cover: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.hairline },
  venueLine: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.grey,
    marginBottom: space.l,
  },
  description: {
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingBottom: 12,
  },
  error: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.red,
    marginBottom: space.m,
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.m,
  },
});
