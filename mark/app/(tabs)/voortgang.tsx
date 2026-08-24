// GROWTH — one month at a time. A single ring shows how this month is
// filling; the cycle does the rest: intentions at the start of the month, a
// short reflection on Sundays, a check-in on the last day of the month and
// of the quarter. Deliberately few numbers — only what is needed.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConcentricRings } from '../../src/components/progress-ring';
import { IntensityDot, WeekDots } from '../../src/components/rings';
import { Body, Button, Field, Hairline, Item, Label, Screen, Section } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import {
  addDays, daysBetween, daysInMonth, formatShort, monthEnd, monthLabel,
  monthStart, quarterEnd, quarterStart, todayKey, weekStart, DAY_LETTERS,
} from '../../src/lib/dates';
import { useTheme } from '../../src/lib/theme-context';
import { Checkin, CheckinKind, Habit, Mark } from '../../src/lib/types';
import { space, type } from '../../src/theme';

export const WEEK_QUESTIONS_KEY = 'mark.questions.week';

const QUESTIONS: Record<CheckinKind, [string, string, string]> = {
  intention: [
    'What is your focus this month?',
    'Which habit deserves the most attention?',
    'What will you let go of?',
  ],
  week: [
    'What are you proud of this week?',
    'What gave you energy, what drained it?',
    'Which single adjustment makes next week better?',
  ],
  month: [
    'What did this month prove about who you are becoming?',
    'Which habit carried you?',
    'What changes next month?',
  ],
  quarter: [
    'Looking at the last three months — what growth do you see?',
    'What identity have your marks been building?',
    'What is the theme for the next quarter?',
  ],
};

const TITLES: Record<CheckinKind, string> = {
  intention: 'intentions for the month',
  week: 'sunday reflection',
  month: 'month check-in',
  quarter: 'quarter check-in',
};

function CheckinCard({ kind, periodStart }: { kind: CheckinKind; periodStart: string }) {
  const [answers, setAnswers] = useState<[string, string, string]>(['', '', '']);
  const [saved, setSaved] = useState(false);
  const [questions, setQuestions] = useState<[string, string, string]>(QUESTIONS[kind]);

  useFocusEffect(useCallback(() => {
    api.getCheckin(kind, periodStart).then(c => {
      if (c) {
        setAnswers(c.answers);
        setSaved(true);
      }
    }).catch(() => {});
    // The Sunday questions are the user's own, editable under More.
    if (kind === 'week') {
      AsyncStorage.getItem(WEEK_QUESTIONS_KEY).then(v => {
        if (!v) return;
        const own = JSON.parse(v) as string[];
        if (own.length === 3 && own.every(q => q.trim())) {
          setQuestions(own as [string, string, string]);
        }
      }).catch(() => {});
    }
  }, [kind, periodStart]));

  const save = async () => {
    await api.saveCheckin(kind, periodStart, answers);
    setSaved(true);
  };

  return (
    <Section label={TITLES[kind]}>
      {saved ? (
        <Body dim style={{ marginBottom: space.m }}>Saved — you can always update it.</Body>
      ) : (
        <Body dim style={{ marginBottom: space.m }}>Three questions, five minutes. Nothing more.</Body>
      )}
      {questions.map((q, i) => (
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
      <Button label="Save" onPress={save} disabled={answers.every(a => !a.trim())} />
    </Section>
  );
}

export default function Growth() {
  const { palette } = useTheme();
  const today = todayKey();
  const monday = weekStart(today);
  const firstOfMonth = monthStart(today);
  const loadFrom = monday < firstOfMonth ? monday : firstOfMonth;

  const [habits, setHabits] = useState<Habit[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [intentions, setIntentions] = useState<Checkin | null>(null);

  const reload = useCallback(() => {
    api.listHabits().then(setHabits).catch(() => {});
    api.listMarks(loadFrom, addDays(monday, 6)).then(setMarks).catch(() => {});
    api.getCheckin('intention', firstOfMonth).then(setIntentions).catch(() => {});
  }, [firstOfMonth, loadFrom, monday]);

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

  // The one number on this screen: how the month is filling, against the
  // soft weekly targets scaled to the month.
  const weekTarget = habits.reduce((sum, h) => sum + Math.min(Math.max(h.targetPerWeek, 1), 7), 0);
  const monthTarget = Math.round(weekTarget * (daysInMonth(today) / 7));
  const marksThisMonth = marks.filter(m => m.date >= firstOfMonth && m.date <= today).length;
  const monthFrac = monthTarget ? Math.min(marksThisMonth / monthTarget, 1) : 0;
  // The two inner rings behind the month: today and this week, no numbers.
  const todayFrac = habits.length ? (byDay.get(today)?.size ?? 0) / habits.length : 0;
  const marksThisWeek = marks.filter(m => m.date >= monday && m.date <= today).length;
  const weekFrac = weekTarget ? Math.min(marksThisWeek / weekTarget, 1) : 0;

  // The cycle: what is due today?
  const dayOfMonth = Number(today.slice(8, 10));
  const isSunday = new Date().getDay() === 0;
  const due: Array<{ kind: CheckinKind; periodStart: string }> = [];
  if (dayOfMonth <= 3) due.push({ kind: 'intention', periodStart: firstOfMonth });
  if (isSunday) due.push({ kind: 'week', periodStart: monday });
  if (today === monthEnd(today)) due.push({ kind: 'month', periodStart: firstOfMonth });
  if (today === quarterEnd(today)) due.push({ kind: 'quarter', periodStart: quarterStart(today) });

  const monthDays = daysBetween(firstOfMonth, today);
  const intentionLines = (intentions?.answers ?? []).filter(a => a.trim());

  return (
    <Screen title="Growth" subtitle="One month at a time">
      {intentionLines.length ? (
        <View style={{ marginBottom: space.xl }}>
          <Label style={{ marginBottom: space.s }}>{`${monthLabel(today).split(' ')[0]} intentions`}</Label>
          {intentionLines.map((line, i) => (
            <Body key={i} style={{ marginBottom: 4 }}>{line}</Body>
          ))}
        </View>
      ) : null}

      <View style={{ alignItems: 'center', marginVertical: space.l }}>
        <ConcentricRings fractions={[todayFrac, weekFrac, monthFrac]} size={216}>
          <Text style={[type.numeral, { color: palette.ink }]}>
            {Math.round(monthFrac * 100)}
            <Text style={{ fontSize: 20, color: palette.dim }}>%</Text>
          </Text>
          <Label style={{ marginTop: 2 }}>{monthLabel(today).split(' ')[0]}</Label>
        </ConcentricRings>
        <Body dim style={{ marginTop: space.l }}>
          {marksThisMonth} {marksThisMonth === 1 ? 'mark' : 'marks'} this month
        </Body>
      </View>

      <View style={{ marginBottom: space.l }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {monthDays.map(d => (
            <IntensityDot
              key={d}
              fraction={habits.length ? (byDay.get(d)?.size ?? 0) / habits.length : 0}
            />
          ))}
        </View>
      </View>

      <Hairline spacing={space.m} />

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
            <Item style={{ flex: 1 }}>{h.name}</Item>
            <WeekDots days={weekDays.map(d => byDay.get(d)?.has(h.id) ?? false)} />
          </View>
        ))}
        {habits.length === 0 ? <Body dim>No habits to follow yet.</Body> : null}
      </Section>

      <Hairline spacing={space.m} />

      {due.length ? (
        due.map(d => <CheckinCard key={d.kind} kind={d.kind} periodStart={d.periodStart} />)
      ) : (
        <Body dim>
          Reflection every Sunday · month check-in on {formatShort(monthEnd(today))}
          {monthEnd(today) === quarterEnd(today) ? ' · quarter check-in the same day' : ''}.
        </Body>
      )}

      <Text style={[type.small, { color: palette.dim, textAlign: 'center', marginTop: space.xxl }]}>
        “How we spend our days is how we spend our lives.”
      </Text>
    </Screen>
  );
}
