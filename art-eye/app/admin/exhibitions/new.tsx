import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ExhibitionForm,
  ExhibitionFormValues,
  draftFromValues,
  emptyValues,
  validate,
} from '../../../src/components/exhibition-form';
import { Kicker } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { colors, fonts, space, type } from '../../../src/theme';

export default function NewExhibition() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [values, setValues] = useState<ExhibitionFormValues>(emptyValues());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Host only</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  const submit = async () => {
    const problem = validate(values, false);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.adminCreateExhibition(draftFromValues(values));
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space.m,
        paddingBottom: insets.bottom + space.xl,
        paddingHorizontal: space.page,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.head}>
        <Kicker>NEW EXHIBITION — PUBLISHED DIRECTLY</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.cancel}>CANCEL</Text>
        </Pressable>
      </View>
      <Text style={styles.intro}>
        As the host, what you add here goes straight into the public agenda — no review step.
      </Text>
      <ExhibitionForm
        values={values}
        onChange={setValues}
        onSubmit={submit}
        submitLabel="PUBLISH TO THE AGENDA"
        busy={busy}
        error={error}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: space.m,
  },
  cancel: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  back: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ink,
    marginTop: space.m,
  },
  intro: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
    marginBottom: space.l,
  },
});
