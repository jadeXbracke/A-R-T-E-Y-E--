// LICHAAM — light health tracking. No calorie counting, no restriction:
// movement, food quality, sleep, cycle (device-only) and a pointer to Kennis.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { IntensityDot } from '../../src/components/rings';
import { Body, Button, Chip, Field, Hairline, Label, Screen } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { addDays, formatShort, todayKey, weekStart } from '../../src/lib/dates';
import { useTheme } from '../../src/lib/theme-context';
import { HealthLog, MovementPayload, NutritionPayload, SleepPayload } from '../../src/lib/types';
import { space, type } from '../../src/theme';

const MOVEMENT_TYPES = ['Kracht', 'Cardio', 'Yoga', 'Wandeling', 'Anders'];
const MEAL_QUALITY: Array<{ label: string; value: 1 | 2 | 3 }> = [
  { label: 'Snel', value: 1 }, { label: 'Gemengd', value: 2 }, { label: 'Voedzaam', value: 3 },
];
const SYMPTOMS = ['Kramp', 'Hoofdpijn', 'Moe', 'Opgeblazen', 'Prima'];

type Module = 'beweging' | 'voeding' | 'slaap' | 'cyclus';

export default function Gezondheid() {
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
  const [moveType, setMoveType] = useState('Kracht');
  const [moveMinutes, setMoveMinutes] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);

  const reload = useCallback(() => {
    api.listHealthLogs('movement', prevMonday, today).then(setMovement).catch(() => {});
    api.listHealthLogs('nutrition', today, today).then(setNutrition).catch(() => {});
    api.listHealthLogs('sleep', addDays(today, -6), today).then(setSleep).catch(() => {});
    api.listHealthLogs('cycle', addDays(today, -27), today).then(setCycle).catch(() => {});
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
    <Screen title="Lichaam" subtitle="Licht bijhouden, geen obsessie">
      <Header id="beweging" label="beweging" />
      {open === 'beweging' ? (
        <View style={{ paddingVertical: space.l, gap: space.m }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MOVEMENT_TYPES.map(t => (
              <Chip key={t} label={t} active={moveType === t} onPress={() => setMoveType(t)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end' }}>
            <Field
              placeholder="Minuten"
              keyboardType="number-pad"
              value={moveMinutes}
              onChangeText={setMoveMinutes}
              style={{ flex: 1 }}
            />
            <Button label="Log" onPress={logMovement} disabled={!moveMinutes} />
          </View>
          <Body dim>
            Deze week {thisWeekMin} min{prevWeekMin ? ` · vorige week ${prevWeekMin} min` : ''}.
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

      <Header id="voeding" label="voeding" />
      {open === 'voeding' ? (
        <View style={{ paddingVertical: space.l, gap: space.l }}>
          <View>
            <Body style={{ marginBottom: space.s }}>Hoe at je vandaag overwegend?</Body>
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
            <Body>Hydratatie · {todayNutrition.glasses ?? 0} glazen</Body>
            <Chip label="+ glas" onPress={() => logNutrition({ glasses: (todayNutrition.glasses ?? 0) + 1 })} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Body>Supplementen genomen</Body>
            <Chip
              label={todayNutrition.supplements ? 'Ja' : 'Nog niet'}
              active={!!todayNutrition.supplements}
              onPress={() => logNutrition({ supplements: !todayNutrition.supplements })}
            />
          </View>
        </View>
      ) : null}

      <Header id="slaap" label="slaap" />
      {open === 'slaap' ? (
        <View style={{ paddingVertical: space.l, gap: space.m }}>
          <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-end' }}>
            <Field
              placeholder="Uren (bv. 7,5)"
              keyboardType="decimal-pad"
              value={sleepHours}
              onChangeText={setSleepHours}
              style={{ flex: 1 }}
            />
            <Button label="Log" onPress={logSleep} disabled={!sleepHours} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Body dim>Kwaliteit</Body>
            <Scale value={sleepQuality} onChange={setSleepQuality} />
          </View>
          {sleep.slice(0, 7).map(l => {
            const p = l.payload as unknown as SleepPayload;
            return (
              <View key={l.id} style={{ flexDirection: 'row', gap: space.m }}>
                <Body dim>{formatShort(l.date)}</Body>
                <Body>{p.hours} u · kwaliteit {p.quality}/5</Body>
              </View>
            );
          })}
          <Body dim>Koppeling met Apple Health / Google Fit volgt in een latere versie.</Body>
        </View>
      ) : null}

      <Header id="cyclus" label="cyclus" />
      {open === 'cyclus' ? (
        <View style={{ paddingVertical: space.l, gap: space.m }}>
          <Body dim>
            Cyclusdata blijft op dit toestel en wordt nooit gesynchroniseerd of gedeeld.
          </Body>
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
            <Body dim>Energie</Body>
            <Scale value={energy} onChange={setEnergy} />
          </View>
          <Button label="Log vandaag" onPress={logCycle} />
          {cycle.slice(0, 5).map(l => {
            const p = l.payload as { symptoms?: string[]; energy?: number };
            return (
              <View key={l.id} style={{ flexDirection: 'row', gap: space.m }}>
                <Body dim>{formatShort(l.date)}</Body>
                <Body>{(p.symptoms ?? []).join(', ') || '—'} · energie {p.energy}/5</Body>
              </View>
            );
          })}
        </View>
      ) : null}

      <Hairline />
      <Text style={[type.small, { color: palette.dim }]}>
        Kennis over gezondheid (boeken, artikelen, podcasts) log je onder het tabblad Kennis.
      </Text>
    </Screen>
  );
}
