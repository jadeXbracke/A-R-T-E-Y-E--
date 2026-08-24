// MEER — appearance, pillars & habits, account, privacy.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import { BuildStamp, Body, Button, Chip, Field, Hairline, Label, Screen, Section } from '../../src/components/ui';
import { api, DEMO_MODE } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { ThemePref, useTheme } from '../../src/lib/theme-context';
import { Habit, Pillar } from '../../src/lib/types';
import { space } from '../../src/theme';

const PREFS: Array<{ value: ThemePref; label: string }> = [
  { value: 'system', label: 'Systeem' },
  { value: 'light', label: 'Licht' },
  { value: 'dark', label: 'Donker' },
];

export default function Instellingen() {
  const { palette, pref, setPref } = useTheme();
  const { profile, signOut } = useAuth();

  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newPillar, setNewPillar] = useState('');
  const [newHabit, setNewHabit] = useState<Record<string, string>>({});

  const reload = useCallback(() => {
    api.listPillars().then(setPillars).catch(() => {});
    api.listHabits().then(setHabits).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const addPillar = async () => {
    if (!newPillar.trim()) return;
    await api.createPillar(newPillar.trim());
    setNewPillar('');
    reload();
  };

  const addHabit = async (pillarId: string) => {
    const name = (newHabit[pillarId] ?? '').trim();
    if (!name) return;
    await api.createHabit(pillarId, name, 5);
    setNewHabit(h => ({ ...h, [pillarId]: '' }));
    reload();
  };

  const confirmArchive = (what: string, run: () => Promise<void>) => {
    if (Platform.OS === 'web') {
      run().then(reload);
      return;
    }
    Alert.alert(`${what} archiveren?`, 'De geschiedenis blijft bewaard.', [
      { text: 'Annuleer', style: 'cancel' },
      { text: 'Archiveer', style: 'destructive', onPress: () => run().then(reload) },
    ]);
  };

  const ArchiveDot = ({ onPress }: { onPress: () => void }) => (
    <Pressable onPress={onPress} hitSlop={10}>
      <View
        style={{
          width: 14, height: 14, borderRadius: 7,
          borderWidth: 1, borderColor: palette.dim,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <View style={{ width: 6, height: 1, backgroundColor: palette.dim }} />
      </View>
    </Pressable>
  );

  return (
    <Screen title="Meer" subtitle="Instellingen, pijlers en account">
      <Section label="weergave">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PREFS.map(p => (
            <Chip key={p.value} label={p.label} active={pref === p.value} onPress={() => setPref(p.value)} />
          ))}
        </View>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="pijlers & gewoontes">
        {pillars.map(pillar => (
          <View key={pillar.id} style={{ marginBottom: space.l }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.s }}>
              <Label style={{ color: palette.ink }}>{pillar.name}</Label>
              <ArchiveDot onPress={() => confirmArchive(pillar.name, () => api.archivePillar(pillar.id))} />
            </View>
            {habits.filter(h => h.pillarId === pillar.id).map(h => (
              <View key={h.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Body>{h.name}</Body>
                <ArchiveDot onPress={() => confirmArchive(h.name, () => api.archiveHabit(h.id))} />
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end' }}>
              <Field
                placeholder="Nieuwe gewoonte…"
                value={newHabit[pillar.id] ?? ''}
                onChangeText={t => setNewHabit(h => ({ ...h, [pillar.id]: t }))}
                style={{ flex: 1 }}
              />
              <Chip label="Voeg toe" onPress={() => addHabit(pillar.id)} />
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end', marginTop: space.s }}>
          <Field placeholder="Nieuwe pijler…" value={newPillar} onChangeText={setNewPillar} style={{ flex: 1 }} />
          <Chip label="Voeg toe" onPress={addPillar} />
        </View>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="account">
        {DEMO_MODE ? (
          <Body dim>
            Demo-build: alles wordt alleen op dit toestel bewaard. Koppel Supabase
            (zie README) om je marks overal mee te nemen.
          </Body>
        ) : (
          <View style={{ gap: space.m }}>
            <Body dim>Ingelogd als {profile?.email}</Body>
            <Button label="Log uit" onPress={signOut} />
          </View>
        )}
      </Section>

      <Hairline spacing={space.m} />

      <Section label="privacy">
        <Body dim>
          Cyclus- en hormoongerelateerde data blijft altijd op dit toestel en wordt
          nooit met derden gedeeld. De rest van je data is van jou en dient alleen
          om je eigen groei zichtbaar te maken.
        </Body>
      </Section>

      <BuildStamp />
    </Screen>
  );
}
