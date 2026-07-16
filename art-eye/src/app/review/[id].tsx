import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionBar, Field, Hairline, Loading, Mono, MonoLink } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { artSource } from '../../lib/art';
import { data } from '../../lib/data';
import { useFocusLoad } from '../../lib/hooks';
import { colors, space, type } from '../../lib/theme';
import { REJECTION_REASON_LABELS, RejectionReason } from '../../lib/types';

const REASONS = Object.keys(REJECTION_REASON_LABELS) as RejectionReason[];

/** Admin review — edit any field, then approve, or reject with a one-tap reason. */
export default function ReviewSubmission() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  const { data: exhibition, loading } = useFocusLoad(() => data.getExhibition(id), [id]);

  const [title, setTitle] = useState('');
  const [artists, setArtists] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (exhibition) {
      setTitle(exhibition.title);
      setArtists(exhibition.artists);
      setStartDate(exhibition.start_date);
      setEndDate(exhibition.end_date);
      setDescription(exhibition.description);
      setFeatured(exhibition.is_featured);
    }
  }, [exhibition]);

  if (profile?.role !== 'admin') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
        <Mono style={{ padding: space.screenX }}>THIS AREA IS FOR ADMINS.</Mono>
      </SafeAreaView>
    );
  }

  const approve = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await data.approveExhibition(id, {
        title: title.trim(),
        artists: artists.trim(),
        start_date: startDate,
        end_date: endDate,
        description: description.trim(),
        is_featured: featured,
      });
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const reject = async (reason: RejectionReason) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await data.rejectExhibition(id, reason);
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: space.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.m }}>
            <Mono>REVIEW SUBMISSION</Mono>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Mono style={{ color: colors.ink }}>CLOSE</Mono>
            </Pressable>
          </View>

          {loading && !exhibition ? (
            <Loading />
          ) : !exhibition ? (
            <Mono style={{ paddingVertical: space.xl }}>SUBMISSION NOT FOUND.</Mono>
          ) : (
            <View style={{ paddingTop: space.m }}>
              <View style={{ flexDirection: 'row', gap: space.m, marginBottom: space.l }}>
                <Image source={artSource(exhibition)} style={{ width: 96, height: 120 }} contentFit="cover" />
                <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
                  <Mono>{exhibition.venue?.name.toUpperCase() ?? ''}</Mono>
                  <Mono style={{ fontSize: 10 }}>
                    {(exhibition.venue?.type ?? 'gallery').toUpperCase()} · {exhibition.city.toUpperCase()}
                  </Mono>
                  {!exhibition.image_url && (
                    <Mono style={{ color: colors.accent, fontSize: 10 }}>NO IMAGE SUPPLIED</Mono>
                  )}
                </View>
              </View>
              <Hairline style={{ marginBottom: space.l }} />

              <Field label="Title" value={title} onChangeText={setTitle} />
              <Field label="Artist(s)" value={artists} onChangeText={setArtists} />
              <Field label="Start date" value={startDate} onChangeText={setStartDate} autoCapitalize="none" />
              <Field label="End date" value={endDate} onChangeText={setEndDate} autoCapitalize="none" />
              <Field label="Description" value={description} onChangeText={setDescription} multiline />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.l, marginBottom: space.xl }}>
                <Mono>CURATOR’S PICK</Mono>
                <MonoLink
                  label={featured ? 'Featured — yes' : 'Featured — no'}
                  active={featured}
                  onPress={() => setFeatured(!featured)}
                />
              </View>

              {error && <Mono style={{ color: colors.accent, marginBottom: space.m }}>{error.toUpperCase()}</Mono>}

              {rejecting ? (
                <View style={{ borderWidth: 1, borderColor: colors.accent, padding: space.m }}>
                  <Mono style={{ color: colors.accent, marginBottom: space.m }}>REASON FOR REJECTION — ONE TAP</Mono>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.l, rowGap: space.m }}>
                    {REASONS.map((r) => (
                      <MonoLink
                        key={r}
                        label={REJECTION_REASON_LABELS[r]}
                        color={colors.accent}
                        onPress={() => reject(r)}
                      />
                    ))}
                  </View>
                  <View style={{ marginTop: space.l }}>
                    <MonoLink label="Cancel" onPress={() => setRejecting(false)} />
                  </View>
                </View>
              ) : (
                <ActionBar
                  actions={[
                    { label: 'Reject', onPress: () => setRejecting(true), accent: true, disabled: busy },
                    { label: busy ? 'Working…' : 'Approve', onPress: approve, primary: true, disabled: busy },
                  ]}
                />
              )}

              <Text
                style={[
                  type.serifItalicBody,
                  { fontSize: 14, lineHeight: 19, color: colors.grey, marginTop: space.m },
                ]}
              >
                Approving publishes this listing to the agenda immediately.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
