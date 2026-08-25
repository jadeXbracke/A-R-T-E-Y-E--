// MEER — appearance, pillars & habits, account, privacy.
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Pressable, TextInput, View } from 'react-native';
import { BuildStamp, Body, Button, Chip, Field, Hairline, Item, Label, Screen, Section } from '../../src/components/ui';
import { api, DEMO_MODE } from '../../src/lib/api';
import { cycleStore } from '../../src/lib/cycle-store';
import { hasAnalyticsConsent, setAnalyticsConsent } from '../../src/lib/analytics';
import { DAY_START_HOURS, getDayStartHour, saveDayStart } from '../../src/lib/day-start';
import { deleteEverything, exportToFile, importFromFile } from '../../src/lib/data-portability';
import { DAY_INITIALS, habitDays, rhythmLabel } from '../../src/lib/habits';
import { useEntitlements } from '../../src/lib/entitlements';
import { useAuth } from '../../src/lib/auth';
import { NavSide, ThemePref, useTheme } from '../../src/lib/theme-context';
import { getReminderHour, setReminderHour, syncEveningReminder } from '../../src/lib/reminders';
import { Habit, Pillar, RhythmKind } from '../../src/lib/types';
import { space, type } from '../../src/theme';

const WEEK_QUESTIONS_KEY = 'mark.questions.week';
const DEFAULT_WEEK_QUESTIONS: [string, string, string] = [
  'What are you proud of this week?',
  'What gave you energy, what drained it?',
  'Which single adjustment makes next week better?',
];
const REMINDER_HOURS = [0, 18, 20, 21]; // 0 = off

const RHYTHMS: Array<{ value: RhythmKind; label: string }> = [
  { value: 'days', label: 'Set days' },
  { value: 'weekly', label: 'Per week' },
  { value: 'monthly', label: 'Per month' },
];

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
  const [identityDraft, setIdentityDraft] = useState<Record<string, string>>({});
  const [nameDraft, setNameDraft] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [questions, setQuestions] = useState<[string, string, string]>(DEFAULT_WEEK_QUESTIONS);
  const [questionsSaved, setQuestionsSaved] = useState(false);
  const [reminderHour, setReminderHourState] = useState(20);
  const [cycleOn, setCycleOn] = useState(true);
  const [dayStart, setDayStart] = useState(getDayStartHour());
  const [analytics, setAnalytics] = useState(hasAnalyticsConsent());
  const [dataNote, setDataNote] = useState('');
  const { premium } = useEntitlements();

  const reload = useCallback(() => {
    api.listPillars().then(setPillars).catch(() => {});
    api.listHabits().then(setHabits).catch(() => {});
    getReminderHour().then(setReminderHourState).catch(() => {});
    cycleStore.isEnabled().then(setCycleOn).catch(() => {});
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
    await api.createHabit(pillarId, name);
    setNewHabit(h => ({ ...h, [pillarId]: '' }));
    reload();
  };

  // Pillars are the user's own words, so the name is editable in place and
  // saved as soon as the field is left.
  const runDataAction = async (action: () => Promise<string>) => {
    setDataNote('Working…');
    try {
      setDataNote(await action());
    } catch (e) {
      setDataNote(e instanceof Error ? e.message : 'That did not work.');
    }
  };

  const confirmDelete = () => {
    const run = async () => {
      await deleteEverything();
      router.replace('/auth');
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof confirm === 'function' && !confirm('Delete your account and all data? This cannot be undone.')) return;
      run().catch(() => setDataNote('That did not work.'));
      return;
    }
    Alert.alert(
      'Delete your account?',
      'Your account and every mark, log and note in it are erased for good. Export your data first if you want to keep it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => run().catch(() => setDataNote('That did not work.')) },
      ],
    );
  };

  const savePillarName = async (pillar: Pillar) => {
    const next = (nameDraft[pillar.id] ?? pillar.name).trim();
    if (!next || next === pillar.name) return;
    await api.updatePillar(pillar.id, { name: next });
    reload();
  };

  const movePillar = async (index: number, delta: number) => {
    const next = [...pillars];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPillars(next); // reorder under the finger, persist behind it
    await api.reorderPillars(next.map(p => p.id));
    reload();
  };

  const saveIdentity = async (pillarId: string) => {
    await api.updatePillar(pillarId, { identity: (identityDraft[pillarId] ?? '').trim() });
    reload();
  };

  const setRhythm = async (habit: Habit, rhythm: RhythmKind) => {
    await api.updateHabit(habit.id, { rhythm });
    reload();
  };

  const setTimes = async (habit: Habit, times: number) => {
    if (times < 1 || times > 31) return;
    await api.updateHabit(habit.id, { times });
    reload();
  };

  const setPaused = async (habit: Habit, paused: boolean) => {
    await api.updateHabit(habit.id, { paused });
    reload();
  };

  // Tapping a weekday adds or removes it; the last one can't be removed,
  // since a habit due on no day at all has nothing to track.
  const toggleDay = async (habit: Habit, day: number) => {
    const current = habitDays(habit);
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort();
    if (!next.length) return;
    await api.updateHabit(habit.id, { days: next });
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

  const StepDot = ({ symbol, onPress, label }: {
    symbol: 'plus' | 'minus';
    onPress: () => void;
    label: string;
  }) => (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel={label} accessibilityRole="button">
      <View
        style={{
          width: 22, height: 22, borderRadius: 11,
          borderWidth: 1, borderColor: palette.hairline,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <View style={{ width: 8, height: 1, backgroundColor: palette.ink }} />
        {symbol === 'plus' ? (
          <View style={{ position: 'absolute', width: 1, height: 8, backgroundColor: palette.ink }} />
        ) : null}
      </View>
    </Pressable>
  );

  const MoveDot = ({ direction, disabled, onPress, label }: {
    direction: 'up' | 'down';
    disabled: boolean;
    onPress: () => void;
    label: string;
  }) => (
    <Pressable onPress={disabled ? undefined : onPress} hitSlop={8} accessibilityLabel={label}>
      <View
        style={{
          width: 18, height: 18, borderRadius: 9,
          borderWidth: 1, borderColor: palette.hairline,
          alignItems: 'center', justifyContent: 'center',
          opacity: disabled ? 0.3 : 1,
        }}
      >
        {/* A drawn triangle rather than an arrow glyph. */}
        <View
          style={{
            width: 0, height: 0,
            borderLeftWidth: 4, borderRightWidth: 4,
            borderLeftColor: 'transparent', borderRightColor: 'transparent',
            ...(direction === 'up'
              ? { borderBottomWidth: 5, borderBottomColor: palette.dim }
              : { borderTopWidth: 5, borderTopColor: palette.dim }),
          }}
        />
      </View>
    </Pressable>
  );

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

      <Section label="when your day starts">
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {DAY_START_HOURS.map(h => (
            <Chip
              key={h}
              label={`${String(h).padStart(2, '0')}:00`}
              active={dayStart === h}
              onPress={() => { setDayStart(h); saveDayStart(h); }}
            />
          ))}
        </View>
        <Body dim style={{ marginTop: space.s, fontSize: 11 }}>
          A mark set before this hour still counts for the day before, so a late
          night does not quietly become a missed day. Takes effect when you
          next open the app.
        </Body>
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
          One quiet notification if habits are still open that day. On your phone only. The
          web version cannot remind you.
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
        {pillars.map((pillar, index) => (
          <View key={pillar.id} style={{ marginBottom: space.l }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, marginBottom: space.s }}>
              <TextInput
                value={nameDraft[pillar.id] ?? pillar.name}
                onChangeText={t => setNameDraft(d => ({ ...d, [pillar.id]: t }))}
                onBlur={() => savePillarName(pillar)}
                onSubmitEditing={() => savePillarName(pillar)}
                returnKeyType="done"
                accessibilityLabel={`Rename ${pillar.name}`}
                style={[type.label, { color: palette.ink, flex: 1, paddingVertical: 4 }]}
              />
              <MoveDot
                direction="up"
                disabled={index === 0}
                onPress={() => movePillar(index, -1)}
                label={`Move ${pillar.name} up`}
              />
              <MoveDot
                direction="down"
                disabled={index === pillars.length - 1}
                onPress={() => movePillar(index, 1)}
                label={`Move ${pillar.name} down`}
              />
              <ArchiveDot onPress={() => confirmArchive(pillar.name, () => api.archivePillar(pillar.id))} />
            </View>
            {habits.filter(h => h.pillarId === pillar.id).map(h => (
              <View key={h.id} style={{ paddingVertical: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Item dim={h.paused}>{h.name}</Item>
                  <ArchiveDot onPress={() => confirmArchive(h.name, () => api.archiveHabit(h.id))} />
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {RHYTHMS.map(r => (
                    <Chip
                      key={r.value}
                      label={r.label}
                      active={h.rhythm === r.value}
                      onPress={() => setRhythm(h, r.value)}
                    />
                  ))}
                  <Chip
                    label={h.paused ? 'Paused' : 'Pause'}
                    active={h.paused}
                    onPress={() => setPaused(h, !h.paused)}
                  />
                </View>

                {h.rhythm === 'days' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    {DAY_INITIALS.map((letter, day) => {
                      const on = habitDays(h).includes(day);
                      return (
                        <Pressable
                          key={day}
                          onPress={() => toggleDay(h, day)}
                          hitSlop={6}
                          accessibilityLabel={`${h.name} on day ${day + 1}`}
                        >
                          <View
                            style={{
                              width: 22, height: 22, borderRadius: 11,
                              borderWidth: 1, borderColor: on ? palette.ink : palette.hairline,
                              backgroundColor: on ? palette.ink : 'transparent',
                              alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Body style={{ fontSize: 9, color: on ? palette.bg : palette.dim }}>{letter}</Body>
                          </View>
                        </Pressable>
                      );
                    })}
                    <Body dim style={{ fontSize: 11, marginLeft: 2 }}>{rhythmLabel(h)}</Body>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <StepDot label={`Fewer ${h.name}`} symbol="minus" onPress={() => setTimes(h, h.times - 1)} />
                    <Body style={{ fontSize: 13 }}>{rhythmLabel(h)}</Body>
                    <StepDot label={`More ${h.name}`} symbol="plus" onPress={() => setTimes(h, h.times + 1)} />
                    <Body dim style={{ fontSize: 11 }}>you choose the days</Body>
                  </View>
                )}
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
            <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end', marginTop: space.s }}>
              <Field
                placeholder="I am someone who… (optional)"
                value={identityDraft[pillar.id] ?? pillar.identity}
                onChangeText={t => setIdentityDraft(d => ({ ...d, [pillar.id]: t }))}
                style={{ flex: 1 }}
              />
              <Chip label="Save" onPress={() => saveIdentity(pillar.id)} />
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end', marginTop: space.s }}>
          <Field placeholder="New pillar…" value={newPillar} onChangeText={setNewPillar} style={{ flex: 1 }} />
          <Chip label="Add" onPress={addPillar} />
        </View>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="modules">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Body>Cycle registration</Body>
          <Chip
            label={cycleOn ? 'On' : 'Off'}
            active={cycleOn}
            onPress={() => {
              const next = !cycleOn;
              setCycleOn(next);
              cycleStore.setEnabled(next);
            }}
          />
        </View>
        <Body dim style={{ marginTop: space.s, fontSize: 11 }}>
          Switching it off hides the module everywhere; your data stays on the
          device until you delete it there.
        </Body>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="mark premium">
        <Body dim>
          {premium ? 'Premium is active.' : 'Health sync, cycle registration, export and more.'}
        </Body>
        <View style={{ marginTop: space.m }}>
          <Button label="About Premium" onPress={() => router.push('/paywall')} />
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

      <Section label="your data">
        <Body dim style={{ marginBottom: space.m }}>
          Export gives you one readable file with everything, including the
          cycle data that lives only on this phone. It is also your backup:
          keep it somewhere safe before switching phones, and read it back
          here afterwards.
        </Body>
        <View style={{ gap: space.m }}>
          <Button label="Export my data" onPress={() => runDataAction(exportToFile)} />
          <Button label="Restore from a file" onPress={() => runDataAction(importFromFile)} />
        </View>
        {dataNote ? <Body dim style={{ marginTop: space.s }}>{dataNote}</Body> : null}
      </Section>

      <Hairline spacing={space.m} />

      <Section label="analytics">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Body>Help improve MARK</Body>
          <Chip
            label={analytics ? 'On' : 'Off'}
            active={analytics}
            onPress={() => { const next = !analytics; setAnalytics(next); setAnalyticsConsent(next); }}
          />
        </View>
        <Body dim style={{ marginTop: space.s, fontSize: 11 }}>
          Off by default. When on, MARK records which screens are used and
          which flows finish, as counts only. Nothing from Body or the cycle
          module is ever included, and no habit names or notes.
        </Body>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="delete account">
        <Body dim style={{ marginBottom: space.m }}>
          Erases your account and everything in it, on our side and on this
          phone. There is no undo. Export first if you want to keep a copy.
        </Body>
        <Button label="Delete my account" onPress={confirmDelete} />
      </Section>

      <Hairline spacing={space.m} />

      <Section label="privacy">
        <Body dim>
          Where your data lives: habits, marks, sleep and steps are stored in your
          own account (or only on this device in the demo build). Cycle data is
          different: it exists only on this device, inside this app's private
          storage, is never synced or shared, and no analytics or tracking runs
          on any of these screens. You can delete all cycle data with one tap
          under Body, in the cycle module, and deleting the app removes everything on the
          device with it.
        </Body>
      </Section>

      <BuildStamp />
    </Screen>
  );
}
