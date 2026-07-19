import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Header } from '../../src/components/Header';
import {
  BodyItalic,
  Caps,
  HeadingL,
  MonoLabel,
  MonoLabelMuted,
  MonoMuted,
} from '../../src/components/Type';
import { FormNote, RatingDots } from '../../src/components/kit';
import { useAppState } from '../../src/state/AppState';
import { color, font, space } from '../../src/theme';

export default function LogVisit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, exhibitions, visits, markSeen } = useAppState();

  const exhibition = useMemo(
    () => exhibitions.find((e) => e.id === id) ?? null,
    [exhibitions, id],
  );
  const existing = useMemo(
    () => visits.find((v) => v.exhibition_id === id) ?? null,
    [visits, id],
  );

  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [reflection, setReflection] = useState(existing?.reflection ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!profile || !exhibition) {
    return (
      <View style={styles.screen}>
        <Header back />
        <BodyItalic style={styles.missing}>
          {profile ? 'We couldn’t find that exhibition.' : 'Sign in to keep your record.'}
        </BodyItalic>
      </View>
    );
  }

  const save = async () => {
    if (rating === 0) {
      setError('CHOOSE A RATING FIRST');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await markSeen(exhibition.id, rating, reflection);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message.toUpperCase() : 'SOMETHING WENT WRONG');
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header back />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <MonoLabelMuted>MARK AS SEEN</MonoLabelMuted>
          <Caps style={styles.artist}>{exhibition.artists.toUpperCase()}</Caps>
          <HeadingL>{exhibition.title}</HeadingL>
          <MonoMuted style={styles.venue}>
            {exhibition.venue?.name.toUpperCase() ?? ''}
          </MonoMuted>

          <View style={styles.section}>
            <MonoLabelMuted>YOUR RATING</MonoLabelMuted>
            <RatingDots value={rating} size={22} onChange={setRating} style={styles.dots} />
          </View>

          <View style={styles.section}>
            <MonoLabelMuted>YOUR NOTE</MonoLabelMuted>
            <TextInput
              value={reflection}
              onChangeText={setReflection}
              placeholder="What stayed with you?"
              placeholderTextColor={color.grey}
              multiline
              style={styles.textarea}
            />
            <BodyItalic style={styles.hint}>
              A line is enough. This is your record, not a review for anyone else.
            </BodyItalic>
          </View>

          <FormNote text={error} error />
        </ScrollView>

        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [styles.saveBar, (pressed || saving) && { opacity: 0.85 }]}
        >
          <MonoLabel style={{ color: color.paper }}>
            {saving ? 'KEEPING…' : 'KEEP IN YOUR RECORD'}
          </MonoLabel>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
  },
  missing: {
    padding: space.xl,
    textAlign: 'center',
    color: color.grey,
  },
  body: {
    padding: space.gutter,
    paddingTop: space.xl,
  },
  artist: {
    marginTop: space.l,
    marginBottom: space.s,
  },
  venue: {
    marginTop: space.s,
  },
  section: {
    marginTop: space.xl,
  },
  dots: {
    marginTop: space.m,
  },
  textarea: {
    fontFamily: font.serif,
    fontSize: 19,
    lineHeight: 27,
    color: color.ink,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
    minHeight: 120,
    textAlignVertical: 'top',
    paddingVertical: space.m,
    paddingHorizontal: 0,
    borderRadius: 0,
    marginTop: space.s,
  },
  hint: {
    color: color.grey,
    fontSize: 15,
    lineHeight: 21,
    marginTop: space.m,
  },
  saveBar: {
    backgroundColor: color.ink,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: space.xl,
    marginHorizontal: space.gutter,
  },
});
