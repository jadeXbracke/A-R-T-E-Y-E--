// GROEI — progress over weeks and months, told in circles. Growth should be
// visible on the scale of a month, not policed on the scale of a day.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { IntensityDot, WeekDots } from '../../src/components/rings';
import { Body, Button, Field, Hairline, Label, Screen, Section } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { addDays, daysBetween, monthLabel, monthStart, todayKey, weekStart, DAY_LETTERS } from '../../src/lib/dates';
import { useTheme } from '../../src/lib/theme-context';
import { Habit, Mark } from '../../src/lib/types';
import { space, type } from '../../src/theme';

const QUESTIONS: [string, string, string] = [
  'Waar ben je deze week trots op?',
  'Wat gaf energie, wat kostte energie?',
  'Welke ene aanpassing maakt volgende week beter?',
];

export default function Voortgang() {
  const { palette } = useTheme();
  const today = todayKey();
  const monday = weekStart(today);
  const firstOfMonth = monthStart(today);
  // Load a wide window: this month plus the previous one, for the comparison.
  const windowStart = monthStart(addDays(firstOfMonth, -1));

  const [habits, setHabits] = useState<Habit[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [answers, setAnswers] = useState<[string, string, string]>(['', '', '']);
  const [savedReflection, setSavedReflection] = useState(false);

  const reload = useCallback(() => {
    api.listHabits().then(setHabits).catch(() => {});
    api.listMarks(windowStart, addDays(monday, 6)).then(setMarks).catch(() => {});
    api.getReflection(monday).then(r => {
      if (r) {
        setAnswers(r.answers);
        setSavedReflection(true);
      }
    }).catch(() => {});
  }, [monday, windowStart]);

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

  // Month grid: one intensity dot per day, filled by the share of habits marked.
  const monthDays = daysBetween(firstOfMonth, today);
  const prevMonthCount = marks.filter(m => m.date >= windowStart && m.date < firstOfMonth).length;
  const thisMonthCount = marks.filter(m => m.date >= firstOfMonth).length;

  const saveReflection = async () => {
    await api.saveReflection(monday, answers);
    setSavedReflection(true);
  };

  return (
    <Screen title="Groei" subtitle="Zichtbaar over weken, niet afgedwongen per dag">
      <Section label="deze week">
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
        {habits.length === 0 ? <Body dim>Nog geen gewoontes om te volgen.</Body> : null}
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
            marks deze maand{prevMonthCount ? ` · vorige maand ${prevMonthCount}` : ''}
          </Body>
        </View>
      </Section>

      <Hairline spacing={space.m} />

      <Section label="wekelijkse reflectie">
        {savedReflection ? (
          <Body dim style={{ marginBottom: space.m }}>Bewaard voor deze week — je kunt altijd bijwerken.</Body>
        ) : (
          <Body dim style={{ marginBottom: space.m }}>Drie vragen, vijf minuten. Meer hoeft niet.</Body>
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
        <Button label="Bewaar reflectie" onPress={saveReflection} disabled={answers.every(a => !a.trim())} />
      </Section>
    </Screen>
  );
}
