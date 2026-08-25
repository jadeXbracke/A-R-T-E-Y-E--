// BODY — light health tracking, everything opt-in.
// Steps: a filling circle against a self-set guideline (never a norm).
// Sleep: regularity over hours — seven nights as aligned arcs, no scores.
// Nutrition: quality, hydration, protein, supplements — no calories.
// Cycle: strictly registering, device-only, fully removable.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { MiniRing } from '../../src/components/progress-ring';
import { IntensityDot } from '../../src/components/rings';
import { formatDuration, sleepDuration } from '../../src/lib/sleep';
import { Body, Button, Chip, Field, Hairline, Item, Label, Screen } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { cycleStore, observations, toSpans } from '../../src/lib/cycle-store';
import { addDays, daysBetween, formatShort, todayKey, weekStart } from '../../src/lib/dates';
import { useEntitlements } from '../../src/lib/entitlements';
import { healthProvider } from '../../src/lib/health';
import { useTheme } from '../../src/lib/theme-context';
import {
  CycleEntry, CyclePeriod, HealthLog, HealthSync,
  MovementPayload, NutritionPayload, SleepLog,
} from '../../src/lib/types';
import { fonts, space, type } from '../../src/theme';

const MOVEMENT_TYPES = ['Strength', 'Cardio', 'Yoga', 'Walk', 'Other'];
const MEAL_QUALITY: Array<{ label: string; value: 1 | 2 | 3 }> = [
  { label: 'Quick', value: 1 }, { label: 'Mixed', value: 2 }, { label: 'Nourishing', value: 3 },
];
const STEP_GOAL_KEY = 'mark.steps.goal';
const STEP_GOALS = [6000, 8000, 10000, 12000];
const SLEEP_GOAL_KEY = 'mark.sleep.goalMinutes';
const SLEEP_GOALS = [360, 420, 480, 540]; // 6h, 7h, 8h, 9h

type Module = 'movement' | 'nutrition' | 'sleep' | 'cycle';

export default function BodyScreen() {
  const { palette } = useTheme();
  const { has } = useEntitlements();
  const today = todayKey();
  const monday = weekStart(today);
  const prevMonday = addDays(monday, -7);

  const [open, setOpen] = useState<Module | null>('nutrition');
  const [movement, setMovement] = useState<HealthLog[]>([]);
  const [nutrition, setNutrition] = useState<HealthLog[]>([]);
  const [sleep, setSleep] = useState<SleepLog[]>([]);
  const [steps, setSteps] = useState<HealthSync[]>([]);
  const [stepGoal, setStepGoalState] = useState(8000);
  const [sleepGoal, setSleepGoalState] = useState(480);
  const [cycleEnabled, setCycleEnabled] = useState(true);
  const [cycleConsent, setCycleConsent] = useState(false);
  const [periods, setPeriods] = useState<CyclePeriod[]>([]);
  const [entries, setEntries] = useState<CycleEntry[]>([]);

  // form state
  const [moveType, setMoveType] = useState('Strength');
  const [moveMinutes, setMoveMinutes] = useState('');
  const [bedTime, setBedTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepQuality, setSleepQuality] = useState(0);
  const [stepsInput, setStepsInput] = useState('');

  const reload = useCallback(() => {
    api.listHealthLogs('movement', prevMonday, today).then(setMovement).catch(() => {});
    api.listHealthLogs('nutrition', today, today).then(setNutrition).catch(() => {});
    api.listSleep(addDays(today, -6), today).then(setSleep).catch(() => {});
    api.listHealthSync(addDays(today, -6), today).then(setSteps).catch(() => {});
    AsyncStorage.getItem(STEP_GOAL_KEY).then(v => {
      const n = v ? parseInt(v, 10) : NaN;
      if (Number.isFinite(n) && n > 0) setStepGoalState(n);
    }).catch(() => {});
    AsyncStorage.getItem(SLEEP_GOAL_KEY).then(v => {
      const n = v ? parseInt(v, 10) : NaN;
      if (Number.isFinite(n) && n > 0) setSleepGoalState(n);
    }).catch(() => {});
    cycleStore.isEnabled().then(setCycleEnabled).catch(() => {});
    cycleStore.hasConsent().then(setCycleConsent).catch(() => {});
    cycleStore.listPeriods().then(setPeriods).catch(() => {});
    cycleStore.listEntries().then(setEntries).catch(() => {});
  }, [prevMonday, today]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // ── movement ──
  const thisWeekMin = useMemo(() =>
    movement.filter(l => l.date >= monday)
      .reduce((sum, l) => sum + ((l.payload as unknown as MovementPayload).minutes || 0), 0),
  [movement, monday]);
  const prevWeekMin = useMemo(() =>
    movement.filter(l => l.date < monday)
      .reduce((sum, l) => sum + ((l.payload as unknown as MovementPayload).minutes || 0), 0),
  [movement, monday]);

  const todayNutrition = useMemo(() => {
    const merged: NutritionPayload = {};
    for (const l of nutrition) Object.assign(merged, l.payload);
    return merged;
  }, [nutrition]);

  // ── sleep ──
  const todaySleep = sleep.find(n => n.date === today) ?? null;
  const todaySleepMinutes = todaySleep ? sleepDuration(todaySleep) : 0;

  // ── steps ──
  const todaySteps = steps.find(s => s.date === today)?.steps ?? 0;
  const weekSteps = daysBetween(addDays(today, -6), today)
    .map(d => ({ date: d, steps: steps.find(s => s.date === d)?.steps ?? 0 }));

  const weekSleep = daysBetween(addDays(today, -6), today).map(d => {
    const log = sleep.find(n => n.date === d);
    return { date: d, minutes: log ? sleepDuration(log) : 0 };
  });

  // ── cycle ──
  const spans = useMemo(() => toSpans(periods), [periods]);
  const currentSpan = spans.length ? spans[spans.length - 1] : null;
  const currentDay = currentSpan
    ? daysBetween(currentSpan.start, today).length
    : null;
  const openPeriod = periods.some(p => !p.end);
  const notes = useMemo(() => observations(spans, entries), [spans, entries]);

  const logMovement = async () => {
    const minutes = parseInt(moveMinutes, 10);
    if (!minutes) return;
    await api.addHealthLog('movement', today, { type: moveType, minutes });
    setMoveMinutes('');
    reload();
  };

  const logNutrition = async (patch: NutritionPayload) => {
    await api.addHealthLog('nutrition', today, { ...todayNutrition, ...patch } as Record<string, unknown>);
    reload();
  };

  const validTime = (t: string) => /^\d{1,2}[:.]\d{2}$/.test(t.trim());
  const normTime = (t: string) => {
    const m = /^(\d{1,2})[:.](\d{2})$/.exec(t.trim())!;
    return `${m[1].padStart(2, '0')}:${m[2]}`;
  };

  const logSleep = async () => {
    if (!validTime(bedTime) || !validTime(wakeTime)) return;
    await api.upsertSleep(today, normTime(bedTime), normTime(wakeTime), sleepQuality);
    setBedTime('');
    setWakeTime('');
    setSleepQuality(0);
    reload();
  };

  const logSteps = async () => {
    const n = parseInt(stepsInput.replace(/\D/g, ''), 10);
    if (!Number.isFinite(n)) return;
    await api.upsertSteps(today, n, 'manual');
    setStepsInput('');
    reload();
  };

  const setStepGoal = (n: number) => {
    setStepGoalState(n);
    AsyncStorage.setItem(STEP_GOAL_KEY, String(n)).catch(() => {});
  };

  const setSleepGoal = (n: number) => {
    setSleepGoalState(n);
    AsyncStorage.setItem(SLEEP_GOAL_KEY, String(n)).catch(() => {});
  };

  const wipeCycle = () => {
    const run = () => cycleStore.wipeAll().then(reload);
    if (Platform.OS === 'web') { run(); return; }
    Alert.alert('Delete all cycle data?', 'Everything is removed from this device. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  const Header = ({ id, label }: { id: Module; label: string }) => (
    <Pressable
      onPress={() => setOpen(open === id ? null : id)}
      style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: space.m,
        borderBottomWidth: 1, borderBottomColor: palette.hairline,
      }}
    >
      <Label style={{ color: palette.ink }}>{label}</Label>
      <View
        style={{
          width: 10, height: 10, borderRadius: 5,
          borderWidth: 1, borderColor: palette.ink,
          backgroundColor: open === id ? palette.ink : 'transparent',
        }}
      />
    </Pressable>
  );

  const Scale = ({ value, onChange, size = 16 }: {
    value: number;
    onChange: (v: number) => void;
    size?: number;
  }) => (
    <View style={{ flexDirection: 'row', gap: size < 14 ? 7 : 10 }}>
      {[1, 2, 3, 4, 5].map(v => (
        <Pressable key={v} onPress={() => onChange(v === value ? 0 : v)} hitSlop={8}>
          <IntensityDot fraction={v <= value ? 1 : 0} size={size} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <Screen title="Body">
      <Header id="nutrition" label="nutrition" />
      {open === 'nutrition' ? (
        <View style={{ paddingVertical: space.l, gap: space.l }}>
          <View>
            <Body style={{ marginBottom: space.s }}>How did you mostly eat today?</Body>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MEAL_QUALITY.map(q => (
                <Chip
                  key={q.value}
                  label={q.label}
                  active={todayNutrition.quality === q.value}
                  onPress={() => logNutrition({ quality: q.value })}
                />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Item>Hydration · {todayNutrition.glasses ?? 0} glasses</Item>
            <Chip label="+ glass" onPress={() => logNutrition({ glasses: (todayNutrition.glasses ?? 0) + 1 })} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Item>Protein · {todayNutrition.protein ?? 0} g</Item>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="+ 10 g" onPress={() => logNutrition({ protein: (todayNutrition.protein ?? 0) + 10 })} />
              <Chip label="+ 25 g" onPress={() => logNutrition({ protein: (todayNutrition.protein ?? 0) + 25 })} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Item>Supplements taken</Item>
            <Chip
              label={todayNutrition.supplements ? 'Yes' : 'Not yet'}
              active={!!todayNutrition.supplements}
              onPress={() => logNutrition({ supplements: !todayNutrition.supplements })}
            />
          </View>
        </View>
      ) : null}

      <Header id="movement" label="movement" />
      {open === 'movement' ? (
        <View style={{ paddingVertical: space.l, gap: space.m }}>
          <View style={{ alignItems: 'center', gap: space.s }}>
            <MiniRing fraction={stepGoal ? Math.min(todaySteps / stepGoal, 1) : 0} size={120}>
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: palette.ink }}>
                {todaySteps.toLocaleString('en-US')}
              </Text>
              <Label style={{ fontSize: 8 }}>today</Label>
            </MiniRing>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.m }}>
            {weekSteps.map(d => (
              <View key={d.date} style={{ alignItems: 'center', gap: 4 }}>
                <MiniRing fraction={stepGoal ? Math.min(d.steps / stepGoal, 1) : 0} size={26} />
                <Text style={[type.small, { color: palette.dim, fontSize: 9 }]}>{d.date.slice(8)}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end' }}>
            <Field
              placeholder="Steps today"
              keyboardType="number-pad"
              value={stepsInput}
              onChangeText={setStepsInput}
              style={{ flex: 1 }}
            />
            <Chip label="Log" onPress={logSteps} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Body dim style={{ fontSize: 11 }}>Guideline</Body>
            {STEP_GOALS.map(g => (
              <Chip key={g} label={`${g / 1000}k`} active={stepGoal === g} onPress={() => setStepGoal(g)} />
            ))}
          </View>

          <Hairline spacing={space.s} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MOVEMENT_TYPES.map(t => (
              <Chip key={t} label={t} active={moveType === t} onPress={() => setMoveType(t)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end' }}>
            <Field
              placeholder="Minutes"
              keyboardType="number-pad"
              value={moveMinutes}
              onChangeText={setMoveMinutes}
              style={{ flex: 1 }}
            />
            <Button label="Log" onPress={logMovement} disabled={!moveMinutes} />
          </View>
          <Body dim>
            This week {thisWeekMin} min{prevWeekMin ? ` · last week ${prevWeekMin} min` : ''}.
          </Body>
          {movement.filter(l => l.date >= monday).map(l => {
            const p = l.payload as unknown as MovementPayload;
            return (
              <View key={l.id} style={{ flexDirection: 'row', gap: space.m }}>
                <Item dim>{formatShort(l.date)}</Item>
                <Item>{p.type} · {p.minutes} min</Item>
              </View>
            );
          })}
        </View>
      ) : null}

      <Header id="sleep" label="sleep" />
      {open === 'sleep' ? (
        <View style={{ paddingVertical: space.l, gap: space.m }}>
          <View style={{ alignItems: 'center', gap: space.s }}>
            <MiniRing fraction={sleepGoal ? Math.min(todaySleepMinutes / sleepGoal, 1) : 0} size={120}>
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: palette.ink }}>
                {todaySleep ? formatDuration(todaySleepMinutes) : '—'}
              </Text>
              <Label style={{ fontSize: 8 }}>last night</Label>
            </MiniRing>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.m }}>
            {weekSleep.map(d => (
              <View key={d.date} style={{ alignItems: 'center', gap: 4 }}>
                <MiniRing fraction={sleepGoal ? Math.min(d.minutes / sleepGoal, 1) : 0} size={26} />
                <Text style={[type.small, { color: palette.dim, fontSize: 9 }]}>{d.date.slice(8)}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Body dim style={{ fontSize: 11 }}>Goal</Body>
            {SLEEP_GOALS.map(g => (
              <Chip key={g} label={`${g / 60}h`} active={sleepGoal === g} onPress={() => setSleepGoal(g)} />
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: space.m }}>
            <Field placeholder="Bed (23:30)" value={bedTime} onChangeText={setBedTime} style={{ flex: 1 }} />
            <Field placeholder="Woke (07:15)" value={wakeTime} onChangeText={setWakeTime} style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Item dim>Felt</Item>
            <Scale value={sleepQuality} onChange={setSleepQuality} />
          </View>
          <Button
            label={todaySleep ? 'Update last night' : 'Log last night'}
            onPress={logSleep}
            disabled={!validTime(bedTime) || !validTime(wakeTime)}
          />
        </View>
      ) : null}

      {cycleEnabled ? (
        <>
          <Header id="cycle" label="cycle" />
          {open === 'cycle' ? (
            !has('cycle') ? (
              <View style={{ paddingVertical: space.l, gap: space.m }}>
                <Body dim>The cycle module is part of MARK Premium.</Body>
                <Button label="About Premium" onPress={() => router.push('/paywall')} />
              </View>
            ) : !cycleConsent ? (
              // Special-category data: nothing is recorded before an
              // explicit, informed yes — and withdrawing it erases the lot.
              <View style={{ paddingVertical: space.l, gap: space.m }}>
                <Body dim style={{ fontSize: 12 }}>
                  Cycle data is health data, so MARK asks first. It stays on
                  this phone, is never sent or shared, and turning this off
                  erases it.
                </Body>
                <Button
                  label="I understand, turn it on"
                  onPress={() => cycleStore.setConsent(true).then(() => { setCycleConsent(true); reload(); })}
                />
              </View>
            ) : (
            <View style={{ paddingVertical: space.l, gap: space.m }}>
              {openPeriod ? (
                <Button label="Period ended today" onPress={() => cycleStore.endPeriod(today).then(reload)} />
              ) : (
                <Button label="Period started today" onPress={() => cycleStore.startPeriod(today).then(reload)} />
              )}

              <Body dim style={{ fontSize: 12 }}>
                {currentSpan && currentDay
                  ? `Day ${currentDay} · last started ${formatShort(currentSpan.start)}`
                  : 'Nothing recorded yet.'}
              </Body>
              {notes.length ? <Body dim style={{ fontSize: 12 }}>{notes[0]}</Body> : null}

              <Hairline spacing={space.s} />
              <Body dim style={{ fontSize: 11 }}>
                Only on this device. Never synced or shared.
              </Body>
              <Pressable onPress={wipeCycle}>
                <Body dim style={{ fontSize: 11, textDecorationLine: 'underline' }}>
                  Delete all cycle data
                </Body>
              </Pressable>
              <Pressable
                onPress={() => cycleStore.setConsent(false).then(() => { setCycleConsent(false); reload(); })}
              >
                <Body dim style={{ fontSize: 11, textDecorationLine: 'underline' }}>
                  Withdraw consent and erase
                </Body>
              </Pressable>
            </View>
            )
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
