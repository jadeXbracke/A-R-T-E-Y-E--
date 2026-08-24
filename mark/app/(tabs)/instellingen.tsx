// MEER — appearance, pillars & habits, account, privacy.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Pressable, View } from 'react-native';
import { BuildStamp, Body, Button, Chip, Field, Hairline, Label, Screen, Section } from '../../src/components/ui';
import { api, DEMO_MODE } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { NavSide, ThemePref, useTheme } from '../../src/lib/theme-context';
import { getReminderHour, setReminderHour, syncEveningReminder } from '../../src/lib/reminders';
import { Habit, Pillar } from '../../src/lib/types';
import { space } from '../../src/theme';

const WEEK_QUESTIONS_KEY = 'mark.questions.week';
const DEFAULT_WEEK_QUESTIONS: [string, string, string] = [
  'What are you proud of this week?',
  'What gave you energy, what drained it?',
  'Which single adjustment makes next week better?',
];
const REMINDER_HOURS = [0, 18, 20, 21]; // 0 = off

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
  const { profile, refresh, signOut } = useAuth();

  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newPillar, setNewPillar] = useState('');
  const [newHabit, setNewHabit] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [questions, setQuestions] = useState<[string, string, string]>(DEFAULT_WEEK_QUESTIONS);
  const [questionsSaved, setQuestionsSaved] = useState(false);
  const [reminderHour, setReminderHourState] = useState(20);

  const reload = useCallback(() => {
    api.listPillars().then(setPillars).catch(() => {});
    api.listHabits().then(setHabits).catch(() => {});
    getReminderHour().then(setReminderHourState).catch(() => {});
    AsyncStorage.getItem(WEEK_QUESTIONS_KEY).then(v => {
      if (!v) return;
      const own = JSON.parse(v) as string[];
      if (own.length === 3) setQuestions(own as [string, string, string]);
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    setName(profile?.name ?? '');
  }, [profile?.name]);

  const saveName = async () => {
    await api.updateName(name.trim());
    await refresh();
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const saveQuestions = async () => {
    await AsyncStorage.setItem(WEEK_QUESTIONS_KEY, JSON.stringify(questions));
    setQuestionsSaved(true);
    setTimeout(() => setQuestionsSaved(false), 2000);
  };

  const pickReminderHour = async (h: number) => {
    setReminderHourState(h);
    await setReminderHour(h);
    // Re-sync straight away so switching it off also cancels today's reminder.
    const marked = await api.listMarks(
      new Date().toISOString().slice(0, 10), new Date().toISOString().slice(0, 10));
    syncEveningReminder(Math.max(habits.length - marked.length, 0));
  };

  const setFrequency = async (habit: Habit, n: number) => {
    await api.updateHabit(habit.id, { targetPerWeek: n });
    reload();
  };

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
      <Section label="personal">
        <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end' }}>
          <Field placeholder="Your first name" value={name} onChangeText={setName} style={{ flex: 1 }} />
          <Chip label={nameSaved ? 'Saved' : 'Save'} onPress={saveName} />
        </View>
        <Body dim style={{ marginTop: space.s }}>Shown at the top of Today.</Body>
      </Section>

      <Hairline spacing={space.m} />

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

      <Section label="evening reminder">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {REMINDER_HOURS.map(h => (
            <Chip
              key={h}
              label={h === 0 ? 'Off' : `${h}:00`}
              active={reminderHour === h}
              onPress={() => pickReminderHour(h)}
            />
          ))}
        </View>
        <Body dim style={{ marginTop: space.s }}>
          One quiet notification if habits are still open that day. On your phone only —
          the web version cannot remind you.
        </Body>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="sunday questions">
        {questions.map((q, i) => (
          <Field
            key={i}
            value={q}
            onChangeText={t => {
              const next = [...questions] as [string, string, string];
              next[i] = t;
              setQuestions(next);
            }}
            style={{ marginBottom: space.s }}
          />
        ))}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: space.s }}>
          <Chip label={questionsSaved ? 'Saved' : 'Save'} onPress={saveQuestions} />
          <Chip label="Reset" onPress={() => setQuestions(DEFAULT_WEEK_QUESTIONS)} />
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
              <View key={h.id} style={{ paddingVertical: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Body>{h.name}</Body>
                  <ArchiveDot onPress={() => confirmArchive(h.name, () => api.archiveHabit(h.id))} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <Pressable key={n} onPress={() => setFrequency(h, n)} hitSlop={6}>
                      <View
                        style={{
                          width: 12, height: 12, borderRadius: 6,
                          borderWidth: 1, borderColor: n <= h.targetPerWeek ? palette.ink : palette.hairline,
                          backgroundColor: n <= h.targetPerWeek ? palette.ink : 'transparent',
                        }}
                      />
                    </Pressable>
                  ))}
                  <Body dim style={{ fontSize: 11, marginLeft: 4 }}>{h.targetPerWeek}× / week</Body>
                </View>
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
