// VANDAAG — the daily check-in. One tap on a ring sets a mark: a small piece
// of evidence of who you are becoming. Calm by design: collapsible pillars,
// no streaks, no guilt for yesterday.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MarkRing, DayCircle } from '../../src/components/rings';
import { Body, Hairline, Label, Screen } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { addDays, daysBetween, formatLong, formatTime, fromKey, todayKey, weekStart } from '../../src/lib/dates';
import { useTheme } from '../../src/lib/theme-context';
import { CalendarEvent, Habit, Mark, Pillar } from '../../src/lib/types';
import { space, type } from '../../src/theme';

export default function Today() {
  const { palette } = useTheme();
  const today = todayKey();
  const monday = weekStart(today);
  const sunday = addDays(monday, 6);

  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const reload = useCallback(() => {
    api.listPillars().then(setPillars).catch(() => {});
    api.listHabits().then(setHabits).catch(() => {});
    api.listMarks(monday, sunday).then(setMarks).catch(() => {});
    api.listEvents(today, today).then(setEvents).catch(() => {});
  }, [monday, sunday, today]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const markedToday = useMemo(
    () => new Set(marks.filter(m => m.date === today).map(m => m.habitId)),
    [marks, today],
  );

  const toggle = async (habitId: string) => {
    // Optimistic: the ring closes the moment you tap it.
    setMarks(prev => {
      const i = prev.findIndex(m => m.habitId === habitId && m.date === today);
      if (i >= 0) return prev.filter((_, j) => j !== i);
      return [...prev, { id: `tmp-${habitId}`, habitId, date: today }];
    });
    try {
      await api.toggleMark(habitId, today);
    } catch {
      reload();
    }
  };

  // Week overview for the day circle: a weekday counts as complete when every
  // habit got its mark that day (only for days that have passed or today).
  const weekDone = useMemo(() => daysBetween(monday, sunday).map(day => {
    if (habits.length === 0 || day > today) return false;
    const set = new Set(marks.filter(m => m.date === day).map(m => m.habitId));
    return habits.every(h => set.has(h.id));
  }), [habits, marks, monday, sunday, today]);

  const todayFraction = habits.length ? markedToday.size / habits.length : 0;
  const todayIndex = (fromKey(today).getDay() + 6) % 7;

  // Gentle, never pushy: one suggestion when the evening looks free.
  const suggestion = useMemo(() => {
    const open = habits.filter(h => !markedToday.has(h.id));
    if (!open.length) return null;
    const eveningBusy = events.some(e => {
      const h = new Date(e.start).getHours();
      return h >= 18 && h < 22;
    });
    if (eveningBusy) return null;
    return open[Math.abs(today.split('-').join('').length + open.length) % open.length];
  }, [events, habits, markedToday, today]);

  return (
    <Screen title="Today" subtitle={formatLong(today)}>
      <View style={{ alignItems: 'center', marginBottom: space.xl }}>
        <DayCircle todayFraction={todayFraction} weekDone={weekDone} todayIndex={todayIndex} />
        <Text style={[type.numeral, { color: palette.ink, marginTop: space.l }]}>
          {markedToday.size}<Text style={{ fontSize: 22, color: palette.dim }}> / {habits.length}</Text>
        </Text>
        <Label style={{ marginTop: 2 }}>marks today</Label>
      </View>

      {pillars.map(pillar => {
        const own = habits.filter(h => h.pillarId === pillar.id);
        if (!own.length) return null;
        const done = own.filter(h => markedToday.has(h.id)).length;
        const isCollapsed = collapsed[pillar.id];
        return (
          <View key={pillar.id} style={{ marginBottom: space.l }}>
            <Pressable
              onPress={() => setCollapsed(c => ({ ...c, [pillar.id]: !c[pillar.id] }))}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Label style={{ color: palette.ink }}>{pillar.name}</Label>
              <Label>{done} / {own.length}</Label>
            </Pressable>
            {!isCollapsed && own.map(habit => (
              <View
                key={habit.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: palette.hairline,
                }}
              >
                <Body>{habit.name}</Body>
                <MarkRing marked={markedToday.has(habit.id)} onPress={() => toggle(habit.id)} />
              </View>
            ))}
          </View>
        );
      })}

      {habits.length === 0 ? (
        <Body dim>
          No habits yet. Create your first pillar and habit under More.
        </Body>
      ) : null}

      <Hairline />

      <Label style={{ marginBottom: space.m }}>today in your calendar</Label>
      {events.length === 0 ? (
        <Body dim>No events today.</Body>
      ) : (
        events.map(e => (
          <View key={e.id} style={{ flexDirection: 'row', gap: space.m, paddingVertical: 8 }}>
            <Body dim>{formatTime(e.start)}</Body>
            <Body>{e.title}</Body>
          </View>
        ))
      )}

      {suggestion ? (
        <Body dim style={{ marginTop: space.l }}>
          Your evening looks free — maybe a good moment for “{suggestion.name}”.
        </Body>
      ) : null}
    </Screen>
  );
}
