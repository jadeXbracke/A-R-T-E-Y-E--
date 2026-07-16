import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BackBar } from '@/components/Header';
import { ArtistCaps, EmptyState, HairRule, MonoLabel, MonoText, RatingDots } from '@/components/ui';
import { useStore } from '@/lib/store';
import { color, font, space, type } from '@/theme';

export default function LogVisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, exhibitionById, venueById, visitFor, markSeen } = useStore();

  const e = id ? exhibitionById(id) : undefined;
  const existing = e ? visitFor(e.id) : undefined;
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [note, setNote] = useState(existing?.reflection ?? '');
  const [busy, setBusy] = useState(false);

  if (!e || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <BackBar title="MARK AS SEEN" />
        <EmptyState text={user ? 'This exhibition has left the agenda.' : 'Sign in to keep your record.'} />
      </View>
    );
  }

  const venue = venueById(e.venue_id);

  const save = async () => {
    if (rating === 0) {
      Alert.alert('Your rating', 'Choose one to five dots first.');
      return;
    }
    try {
      setBusy(true);
      await markSeen(e.id, rating, note);
      router.back();
    } catch (err) {
      Alert.alert('Save', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackBar title="MARK AS SEEN" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 26 }}>
          <ArtistCaps>{e.artists}</ArtistCaps>
          <Text style={[type.titleSerif, { fontSize: 26, lineHeight: 31, marginTop: 6 }]}>
            {e.title}
          </Text>
          {venue && <MonoText style={{ marginTop: 6 }}>{venue.name.toUpperCase()}</MonoText>}

          <HairRule style={{ marginTop: 22 }} />

          <MonoLabel style={{ marginTop: 24, color: color.ink }}>YOUR RATING</MonoLabel>
          <View style={{ marginTop: 14 }}>
            <RatingDots value={rating} onChange={setRating} size={18} gap={16} />
          </View>

          <MonoLabel style={{ marginTop: 30, color: color.ink }}>YOUR NOTE</MonoLabel>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="What stayed with you?"
            placeholderTextColor={color.grey}
            multiline
            style={{
              fontFamily: font.serif,
              fontSize: 18,
              lineHeight: 26,
              color: color.ink,
              minHeight: 130,
              textAlignVertical: 'top',
              paddingTop: 12,
              borderBottomWidth: 1,
              borderBottomColor: color.hairline,
            }}
          />
          <Text style={[type.noteSerif, { color: color.grey, marginTop: 14 }]}>
            A line is enough. This is your record, not a review for anyone else.
          </Text>
        </View>
      </ScrollView>

      {/* Full-width ink save bar */}
      <Pressable
        onPress={save}
        disabled={busy}
        style={({ pressed }) => [
          {
            backgroundColor: color.ink,
            paddingVertical: 20,
            paddingBottom: 34,
            alignItems: 'center',
          },
          (pressed || busy) && { opacity: 0.7 },
        ]}
      >
        <Text style={[type.monoAction, { color: color.white }]}>
          {busy ? 'KEEPING…' : 'KEEP IN YOUR CURATION'}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
