// LICHAAM — light health tracking. No calorie counting, no restriction:
// movement, food quality, sleep, cycle (device-only) and a pointer to Kennis.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MiniRing } from '../../src/components/progress-ring';
import { IntensityDot } from '../../src/components/rings';
import { Body, Button, Chip, Field, Hairline, Label, Screen } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { addDays, daysBetween, formatShort, fromKey, todayKey, weekStart } from '../../src/lib/dates';
import { useTheme } from '../../src/lib/theme-context';
import { HealthLog, MovementPayload, NutritionPayload, SleepPayload } from '../../src/lib/types';
import { space, type } from '../../src/theme';

const MOVEMENT_TYPES = ['Strength', 'Cardio', 'Yoga', 'Walk', 'Other'];
const MEAL_QUALITY: Array<{ label: string; value: 1 | 2 | 3 }> = [
  { label: 'Quick', value: 1 }, { label: 'Mixed', value: 2 }, { label: 'Nourishing', value: 3 },
];
const SYMPTOMS = ['Cramps', 'Headache', 'Tired', 'Bloated', 'Fine'];
const CYCLE_LENGTH_KEY = 'mark.cycle.length';
const CYCLE_LENGTHS = [26, 28, 30, 32];

// Gentle, pattern-level guidance per phase — how hormones tend to move, and
// what that can mean for training, food and rest. Everyone differs; this is
// orientation, not medical advice.
const PHASES: Array<{ name: string; until: (len: number) => number; note: string }> = [
  {
    name: 'menstrual',
    until: () => 5,
    note: 'Estrogen and progesterone are at their lowest. Energy is often low too — rest and gentle movement count as discipline here. Iron-rich food helps.',
  },
  {
    name: 'follicular',
    until: len => Math.round(len / 2) - 2,
    note: 'Estrogen climbs. Many feel energy, focus and recovery improve — a good window for strength training, new starts and harder sessions.',
  },
  {
    name: 'ovulatory',
    until: len => Math.round(len / 2) + 2,
    note: 'The estrogen peak. Often the strongest, most social days of the cycle — enjoy them without overreaching; warm up well.',
  },
  {
    name: 'luteal',
    until: len => len,
    note: 'Progesterone rises, then both fall. Winding down is normal: steady habits over intensity, a little more protein and sleep, and be kind to cravings.',
  },
];

type Module = 'beweging' | 'voeding' | 'slaap' | 'cyclus';

export default function BodyScreen() {
  const { palette } = useTheme();
  const today = todayKey();
  const monday = weekStart(today);
  const prevMonday = addDays(monday, -7);

  const [open, setOpen] = useState<Module | null>('beweging');
  const [movement, setMovement] = useState<HealthLog[]>([]);
  const [nutrition, setNutrition] = useState<HealthLog[]>([]);
  const [sleep, setSleep] = useState<HealthLog[]>([]);
  const [cycle, setCycle] = useState<HealthLog[]>([]);

  // form state
  const [moveType, setMoveType] = useState('Strength');
  const [moveMinutes, setMoveMinutes] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [cycleLength, setCycleLengthState] = useState(28);

  React.useEffect(() => {
    AsyncStorage.getItem(CYCLE_LENGTH_KEY).then(v => {
      const n = v ? parseInt(v, 10) : NaN;
      if (CYCLE_LENGTHS.includes(n)) setCycleLengthState(n);
    }).catch(() => {});
  }, []);

  const setCycleLength = (n: number) => {
    setCycleLengthState(n);
    AsyncStorage.setItem(CYCLE_LENGTH_KEY, String(n)).catch(() => {});
  };

  // Cycle day and phase from the most recent logged period start.
  const lastPeriodStart = useMemo(() => {
    const starts = cycle
      .filter(l => (l.payload as { period?: boolean }).period)
      .map(l => l.date)
      .sort();
    return starts.length ? starts[starts.length - 1] : null;
  }, [cycle]);

  const cycleDay = useMemo(() => {
    if (!lastPeriodStart) return null;
    const diff = daysBetween(lastPeriodStart, today).length; // inclusive
    return ((diff - 1) % cycleLength) + 1;
  }, [cycleLength, lastPeriodStart, today]);

  const phase = useMemo(() => {
    if (!cycleDay) return null;
    return PHASES.find(p => cycleDay <= p.until(cycleLength)) ?? PHASES[PHASES.length - 1];
  }, [cycleDay, cycleLength]);

  const logPeriodStart = async () => {
    await api.addHealthLog('cycle', today, { period: true });
    reload();
  };

  const reload = useCallback(() => {
    api.listHealthLogs('movement', prevMonday, today).then(setMovement).catch(() => {});
    api.listHealthLogs('nutrition', today, today).then(setNutrition).catch(() => {});
    api.listHealthLogs('sleep', addDays(today, -6), today).then(setSleep).catch(() => {});
    api.listHealthLogs('cycle', addDays(today, -59), today).then(setCycle).catch(() => {});
  }, [prevMonday, today]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

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

  const logMovement = async () => {
    const minutes = parseInt(moveMinutes, 10);
    if (!minutes) return;
    await api.addHealthLog('movement', today, { type: moveType, minutes } satisfies MovementPayload as unknown as Record<string, unknown>);
    setMoveMinutes('');
    reload();
  };

  const logNutrition = async (patch: NutritionPayload) => {
    await api.addHealthLog('nutrition', today, { ...todayNutrition, ...patch } as Record<string, unknown>);
    reload();
  };

  const logSleep = async () => {
    const hours = parseFloat(sleepHours.replace(',', '.'));
    if (!hours) return;
    await api.addHealthLog('sleep', today, { hours, quality: sleepQuality } satisfies SleepPayload as unknown as Record<string, unknown>);
    setSleepHours('');
    reload();
  };

  const logCycle = async () => {
    await api.addHealthLog('cycle', today, { symptoms, energy } as Record<string, unknown>);
    setSymptoms([]);
    reload();
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

  const Scale = ({ value, onChange }: { value: number; onChange: (v: 1 | 2 | 3 | 4 | 5) => void }) => (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {[1, 2, 3, 4, 5].map(v => (
        <Pressable key={v} onPress={() => onChange(v as 1 | 2 | 3 | 4 | 5)} hitSlop={8}>
          <IntensityDot fraction={v <= value ? 1 : 0} size={16} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <Screen title="Body" subtitle="Track lightly, no obsession">
      <Header id="beweging" label="movement" />
      {open === 'beweging' ? (
        <View style={{ paddingVertical: space.l, gap: space.m }}>
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
                <Body dim>{formatShort(l.date)}</Body>
                <Body>{p.type} · {p.minutes} min</Body>
              </View>
            );
          })}
        </View>
      ) : null}

      <Header id="voeding" label="nutrition" />
      {open === 'voeding' ? (
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
            <Body>Hydration · {todayNutrition.glasses ?? 0} glasses</Body>
            <Chip label="+ glass" onPress={() => logNutrition({ glasses: (todayNutrition.glasses ?? 0) + 1 })} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Body>Protein · {todayNutrition.protein ?? 0} g</Body>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="+ 10 g" onPress={() => logNutrition({ protein: (todayNutrition.protein ?? 0) + 10 })} />
              <Chip label="+ 25 g" onPress={() => logNutrition({ protein: (todayNutrition.protein ?? 0) + 25 })} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Body>Supplements taken</Body>
            <Chip
              label={todayNutrition.supplements ? 'Yes' : 'Not yet'}
              active={!!todayNutrition.supplements}
              onPress={() => logNutrition({ supplements: !todayNutrition.supplements })}
            />
          </View>
        </View>
      ) : null}

      <Header id="slaap" label="sleep" />
      {open === 'slaap' ? (
        <View style={{ paddingVertical: space.l, gap: space.m }}>
          <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end' }}>
            <Field
              placeholder="Hours (e.g. 7.5)"
              keyboardType="decimal-pad"
              value={sleepHours}
              onChangeText={setSleepHours}
              style={{ flex: 1 }}
            />
            <Button label="Log" onPress={logSleep} disabled={!sleepHours} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Body dim>Quality</Body>
            <Scale value={sleepQuality} onChange={setSleepQuality} />
          </View>
          {sleep.slice(0, 7).map(l => {
            const p = l.payload as unknown as SleepPayload;
            return (
              <View key={l.id} style={{ flexDirection: 'row', gap: space.m }}>
                <Body dim>{formatShort(l.date)}</Body>
                <Body>{p.hours} h · quality {p.quality}/5</Body>
              </View>
            );
          })}
          <Body dim>Apple Health / Google Fit sync will follow in a later version.</Body>
        </View>
      ) : null}

      <Header id="cyclus" label="cycle" />
      {open === 'cyclus' ? (
        <View style={{ paddingVertical: space.l, gap: space.m }}>
          <Body dim>
            Cycle data stays on this device and is never synced or shared.
          </Body>

          {cycleDay && phase ? (
            <View style={{ alignItems: 'center', gap: space.m, marginVertical: space.s }}>
              <MiniRing fraction={cycleDay / cycleLength} size={110}>
                <Body style={{ fontSize: 24 }}>{cycleDay}</Body>
                <Body dim style={{ fontSize: 11 }}>of {cycleLength}</Body>
              </MiniRing>
              <Label style={{ color: palette.ink }}>{phase.name} phase</Label>
              <Body dim style={{ textAlign: 'center' }}>{phase.note}</Body>
            </View>
          ) : (
            <Body dim>
              Log the first day of your period once and MARK will quietly track
              your cycle day and phase, with gentle guidance per phase.
            </Body>
          )}

          <Button label="Period started today" onPress={logPeriodStart} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Body dim>Cycle length</Body>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CYCLE_LENGTHS.map(n => (
                <Chip key={n} label={`${n}`} active={cycleLength === n} onPress={() => setCycleLength(n)} />
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SYMPTOMS.map(s => (
              <Chip
                key={s}
                label={s}
                active={symptoms.includes(s)}
                onPress={() =>
                  setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Body dim>Energy</Body>
            <Scale value={energy} onChange={setEnergy} />
          </View>
          <Button label="Log today" onPress={logCycle} />
          {cycle.filter(l => !(l.payload as { period?: boolean }).period).slice(0, 5).map(l => {
            const p = l.payload as { symptoms?: string[]; energy?: number };
            return (
              <View key={l.id} style={{ flexDirection: 'row', gap: space.m }}>
                <Body dim>{formatShort(l.date)}</Body>
                <Body>{(p.symptoms ?? []).join(', ') || '—'} · energy {p.energy}/5</Body>
              </View>
            );
          })}
          <Body dim style={{ fontSize: 11 }}>
            Patterns differ from person to person — this is orientation, not medical advice.
          </Body>
        </View>
      ) : null}

      <Hairline />
      <Text style={[type.small, { color: palette.dim }]}>
        Health knowledge (books, articles, podcasts) lives under the Knowledge tab.
      </Text>
    </Screen>
  );
}
