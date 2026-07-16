import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ExhibitionForm } from '@/components/ExhibitionForm';
import { BackBar } from '@/components/Header';
import { EmptyState, MonoLabel } from '@/components/ui';
import { useStore } from '@/lib/store';
import { color, space, type } from '@/theme';

export default function VenueNewSubmission() {
  const router = useRouter();
  const { user, submitExhibition } = useStore();

  if (!user || user.role !== 'venue_owner') {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <BackBar title="VENUE" />
        <EmptyState text="Venue submissions belong to venue accounts." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackBar title="NEW SUBMISSION" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 26 }}>
          <MonoLabel>YOUR VENUE</MonoLabel>
          <Text style={[type.displaySerif, { marginTop: 6, marginBottom: 24 }]}>
            New exhibition
          </Text>
          <ExhibitionForm
            submitLabel="SUBMIT FOR REVIEW"
            onSubmit={async (input) => {
              await submitExhibition(input, false);
              Alert.alert('Received', 'Submitted for review. It joins the agenda once approved.');
              router.back();
            }}
          />
        </View>
        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
