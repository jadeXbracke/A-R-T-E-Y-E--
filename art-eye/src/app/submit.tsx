import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExhibitionForm } from '../components/exhibition-form';
import { Loading, Mono, MonoLink } from '../components/ui';
import { useAuth } from '../context/auth';
import { data } from '../lib/data';
import { useFocusLoad } from '../lib/hooks';
import { colors, space, type } from '../lib/theme';
import { SubmissionInput } from '../lib/types';

/** Public submission form — works with or without an account. */
export default function Submit() {
  const router = useRouter();
  const { profile } = useAuth();
  const [done, setDone] = useState(false);

  const { data: venues, loading } = useFocusLoad(() => data.listVenues(), []);

  const onSubmit = async (input: SubmissionInput) => {
    let imageUrl = input.image_url;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = await data.uploadImage(imageUrl);
    }
    await data.submitExhibition({ ...input, image_url: imageUrl }, profile?.id ?? null);
    setDone(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: space.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.m }}>
            <Mono>SUBMIT AN EXHIBITION</Mono>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Mono style={{ color: colors.ink }}>CLOSE</Mono>
            </Pressable>
          </View>

          {done ? (
            <View style={{ paddingTop: space.xl, gap: space.l }}>
              <Text style={[type.serifLarge, { fontSize: 30, lineHeight: 36 }]}>Thank you.</Text>
              <Text style={[type.serifItalicBody, { color: colors.grey, fontSize: 18, lineHeight: 27 }]}>
                Your exhibition has been sent for review. Once approved, it joins the agenda — and
                every curator’s eye in Sydney.
              </Text>
              <MonoLink label="Back to the agenda →" active onPress={() => router.dismissTo('/(tabs)/agenda')} />
            </View>
          ) : (
            <View style={{ paddingTop: space.m }}>
              <Text style={[type.serifHeading, { marginBottom: 4 }]}>List your exhibition</Text>
              <Text style={[type.serifItalicBody, { color: colors.grey, marginBottom: space.xl }]}>
                {profile
                  ? 'Submitted under your account — you can edit it any time from your profile.'
                  : 'No account needed. Reviewed by our curators before it appears.'}
              </Text>
              {loading && !venues ? (
                <Loading />
              ) : (
                <ExhibitionForm venues={venues ?? []} submitLabel="Submit for review" onSubmit={onSubmit} />
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
