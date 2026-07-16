import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SubmissionForm,
  toSubmissionInput,
  valuesFromExhibition,
} from '../../components/submission-form';
import { Hairline, Loading, MonoLabel, TextLink } from '../../components/ui';
import { api } from '../../lib/api';
import { useApp } from '../../lib/app-context';
import type { Exhibition } from '../../lib/types';
import { colors, PAGE_PAD, type } from '../../theme';

/**
 * Edit a submission. Owners can edit their own pending rows; admins can
 * edit any field on any row (typically before approving).
 */
export default function EditSubmission() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, refreshAgenda } = useApp();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .getExhibition(id)
      .then(setExhibition)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;

  const isAdmin = profile?.role === 'admin';
  const isOwner = !!profile && exhibition?.submitted_by === profile.id;
  const allowed =
    !!exhibition && (isAdmin || (isOwner && exhibition.status === 'pending'));

  if (!allowed) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 36 }}>
        <Text style={[type.serifQuote, { textAlign: 'center' }]}>
          This submission can no longer be edited.
        </Text>
        <View style={{ marginTop: 20 }}>
          <TextLink label="← BACK" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ paddingTop: insets.top + 18, alignItems: 'flex-start' }}>
          <TextLink label="← BACK" onPress={() => router.back()} />
        </View>
        <View style={{ paddingTop: 14, paddingBottom: 18 }}>
          <MonoLabel>{isAdmin ? 'ADMIN EDIT' : 'EDIT SUBMISSION'}</MonoLabel>
          <Text style={[type.serifHeading, { marginTop: 8 }]}>{exhibition.title}</Text>
        </View>
        <Hairline style={{ marginBottom: 26 }} />

        <SubmissionForm
          initial={valuesFromExhibition(exhibition)}
          submitLabel="SAVE CHANGES"
          onSubmit={async (values) => {
            const input = toSubmissionInput(values);
            await api.updateSubmission(exhibition.id, {
              title: input.title,
              artists: input.artists,
              start_date: input.start_date,
              end_date: input.end_date,
              opening_datetime: input.opening_datetime,
              description: input.description ?? null,
              image_url: input.image_url ?? null,
            });
            await refreshAgenda();
            router.back();
          }}
        />
        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PAGE_PAD,
  },
});
