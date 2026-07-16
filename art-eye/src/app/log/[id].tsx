import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InkBar, Loading, Mono, RatingDots } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { data } from '../../lib/data';
import { useFocusLoad } from '../../lib/hooks';
import { colors, fonts, space, type } from '../../lib/theme';

export default function LogVisit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: exhibition } = useFocusLoad(() => data.getExhibition(id), [id]);
  const { data: existing, loading } = useFocusLoad(
    async () => (profile ? data.getVisit(profile.id, id) : null),
    [profile?.id, id]
  );

  useEffect(() => {
    if (existing) {
      setRating(existing.rating);
      setReflection(existing.reflection);
    }
  }, [existing]);

  if (loading && !exhibition) return <Loading />;

  const save = async () => {
    if (!profile || rating === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      await data.logVisit(profile.id, id, rating, reflection.trim());
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: space.l }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.m }}>
            <Mono>MARK AS SEEN</Mono>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Mono style={{ color: colors.ink }}>CLOSE</Mono>
            </Pressable>
          </View>

          {exhibition && (
            <View style={{ paddingTop: space.l, paddingBottom: space.xl, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
              <Text style={[type.serifLarge, { fontSize: 30, lineHeight: 35 }]}>{exhibition.title}</Text>
              <Text style={[type.caps, { marginTop: 8 }]}>{exhibition.artists.toUpperCase()}</Text>
              <Mono style={{ marginTop: 6 }}>{exhibition.venue?.name.toUpperCase() ?? ''}</Mono>
            </View>
          )}

          <Mono style={{ marginTop: space.xl, marginBottom: space.m }}>YOUR RATING</Mono>
          <RatingDots value={rating} onChange={setRating} size={26} gap={16} />

          <Mono style={{ marginTop: space.xl, marginBottom: space.m }}>YOUR NOTE</Mono>
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            placeholder="What stayed with you?"
            placeholderTextColor={colors.grey}
            multiline
            style={{
              borderWidth: 1,
              borderColor: colors.hairline,
              borderRadius: 0,
              minHeight: 140,
              padding: 14,
              textAlignVertical: 'top',
              fontFamily: fonts.serif,
              fontSize: 18,
              lineHeight: 26,
              color: colors.ink,
            }}
          />
          <Text
            style={[
              type.serifItalicBody,
              { fontSize: 15, lineHeight: 21, color: colors.grey, marginTop: space.m },
            ]}
          >
            A line is enough. This is your record, not a review for anyone else.
          </Text>

          {error && (
            <Mono style={{ color: colors.accent, marginTop: space.m }}>{error.toUpperCase()}</Mono>
          )}
        </ScrollView>

        <View style={{ paddingHorizontal: space.screenX, paddingBottom: space.m }}>
          <InkBar
            label={saving ? 'Saving…' : 'Save to your curation'}
            onPress={save}
            disabled={rating === 0 || saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
