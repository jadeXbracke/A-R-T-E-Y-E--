// MEER — appearance, pillars & habits, account, privacy.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import { BuildStamp, Body, Button, Chip, Field, Hairline, Label, Screen, Section } from '../../src/components/ui';
import { api, DEMO_MODE } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { NavSide, ThemePref, useTheme } from '../../src/lib/theme-context';
import { Habit, Pillar } from '../../src/lib/types';
import { space } from '../../src/theme';

const PREFS: Array<{ value: ThemePref; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const NAV_SIDES: Array<{ value: NavSide; label: string }> = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

export default function More() {
  const { palette, pref, setPref, nav, setNav } = useTheme();
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
    Alert.alert(`Archive ${what}?`, 'Its history stays saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => run().then(reload) },
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
    <Screen title="More" subtitle="Settings, pillars and account">
      <Section label="appearance">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PREFS.map(p => (
            <Chip key={p.value} label={p.label} active={pref === p.value} onPress={() => setPref(p.value)} />
          ))}
        </View>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="navigation">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {NAV_SIDES.map(n => (
            <Chip key={n.value} label={n.label} active={nav === n.value} onPress={() => setNav(n.value)} />
          ))}
        </View>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="pillars & habits">
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
                placeholder="New habit…"
                value={newHabit[pillar.id] ?? ''}
                onChangeText={t => setNewHabit(h => ({ ...h, [pillar.id]: t }))}
                style={{ flex: 1 }}
              />
              <Chip label="Add" onPress={() => addHabit(pillar.id)} />
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end', marginTop: space.s }}>
          <Field placeholder="New pillar…" value={newPillar} onChangeText={setNewPillar} style={{ flex: 1 }} />
          <Chip label="Add" onPress={addPillar} />
        </View>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="account">
        {DEMO_MODE ? (
          <Body dim>
            Demo build: everything is stored on this device only. Connect Supabase
            (see README) to take your marks anywhere.
          </Body>
        ) : (
          <View style={{ gap: space.m }}>
            <Body dim>Signed in as {profile?.email}</Body>
            <Button label="Sign out" onPress={signOut} />
          </View>
        )}
      </Section>

      <Hairline spacing={space.m} />

      <Section label="privacy">
        <Body dim>
          Cycle and hormone-related data always stays on this device and is never
          shared with anyone. The rest of your data is yours alone and only serves
          to make your own growth visible.
        </Body>
      </Section>

      <BuildStamp />
    </Screen>
  );
}
