import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ExhibitionForm } from '@/components/ExhibitionForm';
import { BackBar } from '@/components/Header';
import { MonoLabel } from '@/components/ui';
import { useStore } from '@/lib/store';
import { color, space, type } from '@/theme';

/** Public submission — no account needed. Creates a pending row. */
export default function PublicSubmitScreen() {
  const router = useRouter();
  const { submitExhibition } = useStore();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackBar title="SUBMIT" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 26 }}>
          <MonoLabel>FOR EVERYONE — NO ACCOUNT NEEDED</MonoLabel>
          <Text style={[type.displaySerif, { marginTop: 6 }]}>Submit an exhibition</Text>
          <Text style={[type.noteSerif, { color: color.grey, marginTop: 10, marginBottom: 26 }]}>
            Seen something Sydney should know about? Tell us. Our curators review every
            submission before it joins the agenda.
          </Text>
          <ExhibitionForm
            submitLabel="SUBMIT FOR REVIEW"
            askContact
            onSubmit={async (input) => {
              await submitExhibition(input, true);
              Alert.alert(
                'Received',
                'Thank you — our curators will review it. If approved, it joins the agenda.'
              );
              router.back();
            }}
          />
        </View>
        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
