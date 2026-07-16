import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExhibitionForm } from '../../components/exhibition-form';
import { Loading, Mono } from '../../components/ui';
import { data } from '../../lib/data';
import { useFocusLoad } from '../../lib/hooks';
import { colors, space, type } from '../../lib/theme';
import { SubmissionInput } from '../../lib/types';

/** Venue owners edit their own submissions; edits go back through review. */
export default function EditSubmission() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: exhibition, loading } = useFocusLoad(() => data.getExhibition(id), [id]);

  const onSubmit = async (input: SubmissionInput) => {
    let imageUrl = input.image_url;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = await data.uploadImage(imageUrl);
    }
    await data.updateSubmission(id, {
      title: input.title.trim(),
      artists: input.artists.trim(),
      start_date: input.start_date,
      end_date: input.end_date,
      opening_datetime: input.opening_datetime,
      description: input.description.trim(),
      image_url: imageUrl,
    });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: space.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.m }}>
            <Mono>EDIT SUBMISSION</Mono>
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
              <Text style={[type.serifHeading, { marginBottom: 4 }]}>{exhibition.title}</Text>
              <Text style={[type.serifItalicBody, { color: colors.grey, marginBottom: space.xl }]}>
                Saving sends the listing back for review.
              </Text>
              <ExhibitionForm
                venues={[]}
                initial={exhibition}
                submitLabel="Save and resubmit"
                onSubmit={onSubmit}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
