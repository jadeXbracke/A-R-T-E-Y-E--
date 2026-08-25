// One past day, reopened. Reached by tapping a date on Growth: a day you
// forgot to fill in is not lost, you simply go back and set the mark.
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MiniRing } from '../../src/components/progress-ring';
import { MarkRing } from '../../src/components/rings';
import { Body, Item, Label, Screen } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { formatLong, todayKey } from '../../src/lib/dates';
import { dueOn } from '../../src/lib/habits';
import { useTheme } from '../../src/lib/theme-context';
import { Habit, Mark, Pillar } from '../../src/lib/types';
import { space, type } from '../../src/theme';

export default function DayEditor() {
  const { palette } = useTheme();
  const params = useLocalSearchParams<{ date?: string }>();
  const date = typeof params.date === 'string' ? params.date : todayKey();

  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);

  const reload = useCallback(() => {
    api.listPillars().then(setPillars).catch(() => {});
    api.listHabits().then(setHabits).catch(() => {});
    api.listMarks(date, date).then(setMarks).catch(() => {});
  }, [date]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const due = useMemo(() => dueOn(habits, date), [habits, date]);
  const marked = useMemo(() => new Set(marks.map(m => m.habitId)), [marks]);

  const toggle = async (habitId: string) => {
    setMarks(prev => {
      const i = prev.findIndex(m => m.habitId === habitId);
      if (i >= 0) return prev.filter((_, j) => j !== i);
      return [...prev, { id: `tmp-${habitId}`, habitId, date }];
    });
    try {
      await api.toggleMark(habitId, date);
    } catch {
      reload();
    }
  };

  const dueMarked = due.filter(h => marked.has(h.id)).length;
  const fraction = due.length ? dueMarked / due.length : 0;
  const isToday = date === todayKey();

  return (
    <Screen title={isToday ? 'Today' : formatLong(date).split(' ').slice(1).join(' ')} subtitle={formatLong(date)}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginBottom: space.l }}>
        <Label>← back</Label>
      </Pressable>

      <View style={{ alignItems: 'center', marginBottom: space.xl }}>
        <MiniRing fraction={fraction} size={150}>
          <Text style={[type.numeral, { fontSize: 30, color: palette.ink }]}>
            {dueMarked}<Text style={{ fontSize: 18, color: palette.dim }}> / {due.length}</Text>
          </Text>
          <Label style={{ marginTop: 2 }}>marks</Label>
        </MiniRing>
      </View>

      {pillars.map(pillar => {
        const own = due.filter(h => h.pillarId === pillar.id);
        if (!own.length) return null;
        return (
          <View key={pillar.id} style={{ marginBottom: space.l }}>
            <Label style={{ color: palette.ink, marginBottom: space.s }}>{pillar.name}</Label>
            {own.map(habit => (
              <View
                key={habit.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: palette.hairline,
                }}
              >
                <Item>{habit.name}</Item>
                <MarkRing marked={marked.has(habit.id)} onPress={() => toggle(habit.id)} />
              </View>
            ))}
          </View>
        );
      })}

      {due.length === 0 ? (
        <Body dim>No habits were scheduled for this day.</Body>
      ) : null}
    </Screen>
  );
}
