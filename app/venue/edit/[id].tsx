import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ExhibitionForm } from '@/components/ExhibitionForm';
import { BackBar } from '@/components/Header';
import { EmptyState, MonoLabel } from '@/components/ui';
import { useStore } from '@/lib/store';
import { Exhibition, Venue } from '@/lib/types';
import { color, space, type } from '@/theme';

export default function VenueEditSubmission() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, listMySubmissions, updateSubmission } = useStore();
  const [data, setData] = useState<{ exhibition: Exhibition; venue?: Venue } | null | 'loading'>(
    'loading'
  );

  useEffect(() => {
    listMySubmissions()
      .then(({ exhibitions, venues }) => {
        const exhibition = exhibitions.find((e) => e.id === id);
        setData(
          exhibition
            ? { exhibition, venue: venues.find((v) => v.id === exhibition.venue_id) }
            : null
        );
      })
      .catch(() => setData(null));
  }, [id, listMySubmissions]);

  if (!user || user.role !== 'venue_owner' || data === null) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <BackBar title="EDIT" />
        <EmptyState text="This submission isn't yours to edit." />
      </View>
    );
  }
  if (data === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <BackBar title="EDIT" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackBar title="EDIT SUBMISSION" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 26 }}>
          <MonoLabel>
            {data.exhibition.status === 'rejected'
              ? 'EDITING RESUBMITS FOR REVIEW'
              : 'EDITS ARE REVIEWED BEFORE PUBLISHING'}
          </MonoLabel>
          <Text style={[type.displaySerif, { marginTop: 6, marginBottom: 24 }]}>Edit</Text>
          <ExhibitionForm
            initial={data}
            submitLabel="SAVE & RESUBMIT"
            onSubmit={async (input) => {
              await updateSubmission(data.exhibition.id, input);
              Alert.alert('Saved', 'Your changes were submitted for review.');
              router.back();
            }}
          />
        </View>
        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
