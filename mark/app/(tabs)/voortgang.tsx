// GROWTH — the dashboard. Circles show discipline and progress: three
// concentric rings (today, this week, the last 28 days), one ring per pillar,
// then the week dots, the month grid and the weekly reflection. Motivating
// through visible growth — never through guilt: comparisons stay gentle.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { ConcentricRings, MiniRing } from '../../src/components/progress-ring';
import { IntensityDot, WeekDots } from '../../src/components/rings';
import { Body, Button, Field, Hairline, Label, Screen, Section } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { addDays, daysBetween, fromKey, monthLabel, monthStart, todayKey, weekStart, DAY_LETTERS } from '../../src/lib/dates';
import { useTheme } from '../../src/lib/theme-context';
import { Habit, Mark, Pillar } from '../../src/lib/types';
import { fonts, space, type } from '../../src/theme';

const QUESTIONS: [string, string, string] = [
  'What are you proud of this week?',
  'What gave you energy, what drained it?',
  'Which single adjustment makes next week better?',
];

export default function Growth() {
  const { palette } = useTheme();
  const today = todayKey();
  const monday = weekStart(today);
  const firstOfMonth = monthStart(today);
  const windowStart28 = addDays(today, -27);
  // Load a wide window: last month (for the comparison), the 28-day
  // discipline window and the current week — whichever reaches back furthest.
  const loadFrom = [monthStart(addDays(firstOfMonth, -1)), windowStart28, addDays(monday, -7)]
    .sort()[0];

  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [answers, setAnswers] = useState<[string, string, string]>(['', '', '']);
  const [savedReflection, setSavedReflection] = useState(false);

  const reload = useCallback(() => {
    api.listPillars().then(setPillars).catch(() => {});
    api.listHabits().then(setHabits).catch(() => {});
    api.listMarks(loadFrom, addDays(monday, 6)).then(setMarks).catch(() => {});
    api.getReflection(monday).then(r => {
      if (r) {
        setAnswers(r.answers);
        setSavedReflection(true);
      }
    }).catch(() => {});
  }, [loadFrom, monday]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const weekDays = daysBetween(monday, addDays(monday, 6));

  const byDay = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of marks) {
      if (!map.has(m.date)) map.set(m.date, new Set());
      map.get(m.date)!.add(m.habitId);
    }
    return map;
  }, [marks]);

  // ── Dashboard metrics ─────────────────────────────────────────────────────
  const weekTarget = useMemo(
    () => habits.reduce((sum, h) => sum + Math.min(Math.max(h.targetPerWeek, 1), 7), 0),
    [habits],
  );
  const marksToday = byDay.get(today)?.size ?? 0;
  const marksThisWeek = marks.filter(m => m.date >= monday && m.date <= today).length;
  const marks28 = marks.filter(m => m.date >= windowStart28 && m.date <= today).length;
  const activeDays28 = daysBetween(windowStart28, today).filter(d => (byDay.get(d)?.size ?? 0) > 0).length;

  const todayFrac = habits.length ? marksToday / habits.length : 0;
  const weekFrac = weekTarget ? marksThisWeek / weekTarget : 0;
  const disciplineFrac = weekTarget ? marks28 / (weekTarget * 4) : 0;
  const discipline = Math.round(Math.min(disciplineFrac, 1) * 100);

  // Gentle momentum: compare with the same point in last week, never with an
  // idealised total.
  const todayIndex = (fromKey(today).getDay() + 6) % 7;
  const lastMonday = addDays(monday, -7);
  const marksLastWeekSamePoint = marks.filter(
    m => m.date >= lastMonday && m.date <= addDays(lastMonday, todayIndex),
  ).length;
  const delta = marksThisWeek - marksLastWeekSamePoint;
  const momentum =
    delta > 0 ? `${delta} more ${delta === 1 ? 'mark' : 'marks'} than this point last week`
    : delta === 0 ? 'level with this point last week'
    : 'a quieter week than last — no panic, just continue';

  const monthDays = daysBetween(firstOfMonth, today);
  const prevMonthCount = marks.filter(m => m.date >= loadFrom && m.date < firstOfMonth
    && m.date >= monthStart(addDays(firstOfMonth, -1))).length;
  const thisMonthCount = marks.filter(m => m.date >= firstOfMonth).length;

  const saveReflection = async () => {
    await api.saveReflection(monday, answers);
    setSavedReflection(true);
  };

  const LegendRow = ({ ring, label, value }: { ring: number; label: string; value: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
      <View style={{ width: 20, alignItems: 'center' }}>
        <View
          style={{
            width: ring, height: ring, borderRadius: ring / 2,
            borderWidth: 1.5, borderColor: palette.ink,
          }}
        />
      </View>
      <Label style={{ color: palette.ink, flex: 1, marginLeft: space.m }}>{label}</Label>
      <Body dim>{value}</Body>
    </View>
  );

  return (
    <Screen title="Growth" subtitle="Visible over weeks, never enforced per day">
      {/* ── The dashboard ── */}
      <View style={{ alignItems: 'center' }}>
        <ConcentricRings fractions={[todayFrac, Math.min(weekFrac, 1), Math.min(disciplineFrac, 1)]}>
          <Text style={[type.numeral, { color: palette.ink }]}>
            {discipline}
            <Text style={{ fontSize: 20, color: palette.dim }}>%</Text>
          </Text>
          <Label style={{ marginTop: 2 }}>discipline</Label>
        </ConcentricRings>
      </View>

      <View style={{ marginTop: space.l }}>
        <LegendRow ring={14} label="today" value={`${marksToday} / ${habits.length}`} />
        <LegendRow ring={11} label="this week" value={`${marksThisWeek} / ${weekTarget}`} />
        <LegendRow ring={8} label="last 28 days" value={`active on ${activeDays28} ${activeDays28 === 1 ? 'day' : 'days'}`} />
      </View>

      <Body dim style={{ marginTop: space.m }}>{momentum}.</Body>

      {pillars.length > 0 ? (
        <View
          style={{
            flexDirection: 'row', flexWrap: 'wrap',
            justifyContent: 'center', gap: space.l,
            marginTop: space.xl,
          }}
        >
          {pillars.map(p => {
            const own = habits.filter(h => h.pillarId === p.id);
            if (!own.length) return null;
            const target = own.reduce((s, h) => s + Math.min(Math.max(h.targetPerWeek, 1), 7), 0);
            const got = marks.filter(m => m.date >= monday && own.some(h => h.id === m.habitId)).length;
            const frac = target ? Math.min(got / target, 1) : 0;
            return (
              <View key={p.id} style={{ alignItems: 'center', width: 96 }}>
                <MiniRing fraction={frac}>
                  <Text style={{ fontFamily: fonts.display, fontSize: 15, letterSpacing: 1, color: palette.ink }}>
                    {Math.round(frac * 100)}
                  </Text>
                </MiniRing>
                <Text
                  numberOfLines={1}
                  style={[type.label, { color: palette.dim, marginTop: space.s, maxWidth: 96 }]}
                >
                  {p.name}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <Text style={[type.small, { color: palette.dim, textAlign: 'center', marginTop: space.xl }]}>
        “How we spend our days is how we spend our lives.”
      </Text>

      <Hairline />

      <Section label="this week">
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: space.s }}>
          {DAY_LETTERS.map((l, i) => (
            <Text key={i} style={[type.small, { color: palette.dim, width: 10, textAlign: 'center' }]}>{l}</Text>
          ))}
        </View>
        {habits.map(h => (
          <View
            key={h.id}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}
          >
            <Body style={{ flex: 1 }} >{h.name}</Body>
            <WeekDots days={weekDays.map(d => byDay.get(d)?.has(h.id) ?? false)} />
          </View>
        ))}
        {habits.length === 0 ? <Body dim>No habits to follow yet.</Body> : null}
      </Section>

      <Hairline spacing={space.m} />

      <Section label={monthLabel(today)}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {monthDays.map(d => (
            <IntensityDot
              key={d}
              fraction={habits.length ? (byDay.get(d)?.size ?? 0) / habits.length : 0}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.s, marginTop: space.l }}>
          <Text style={[type.numeral, { color: palette.ink }]}>{thisMonthCount}</Text>
          <Body dim>
            marks this month{prevMonthCount ? ` · last month ${prevMonthCount}` : ''}
          </Body>
        </View>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="weekly reflection">
        {savedReflection ? (
          <Body dim style={{ marginBottom: space.m }}>Saved for this week — you can always update it.</Body>
        ) : (
          <Body dim style={{ marginBottom: space.m }}>Three questions, five minutes. Nothing more.</Body>
        )}
        {QUESTIONS.map((q, i) => (
          <View key={i} style={{ marginBottom: space.m }}>
            <Body style={{ marginBottom: 4 }}>{q}</Body>
            <Field
              multiline
              value={answers[i]}
              onChangeText={t => {
                const next = [...answers] as [string, string, string];
                next[i] = t;
                setAnswers(next);
              }}
              placeholder="…"
            />
          </View>
        ))}
        <Button label="Save reflection" onPress={saveReflection} disabled={answers.every(a => !a.trim())} />
      </Section>
    </Screen>
  );
}
