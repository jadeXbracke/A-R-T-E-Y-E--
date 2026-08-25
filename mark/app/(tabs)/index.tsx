// TODAY — nothing but today. The circle fills as you complete your small
// habits; one tap on a ring sets a mark. No stats, no schedule, no nudges —
// those live on Growth. Only the mind dump keeps a single quiet line here,
// so a passing thought never has to wait.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Capture } from '../../src/components/capture';
import { MiniRing } from '../../src/components/progress-ring';
import { MarkRing } from '../../src/components/rings';
import { Body, Hairline, Item, Label, Screen } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { addToOwnCalendar } from '../../src/lib/calendar-link';
import { formatLong, todayKey } from '../../src/lib/dates';
import { dueOn, marksWindow } from '../../src/lib/habits';
import { syncEveningReminder } from '../../src/lib/reminders';
import { buildSnapshot, publishSnapshot } from '../../src/lib/widget';
import { useTheme } from '../../src/lib/theme-context';
import { Habit, Mark, Pillar } from '../../src/lib/types';
import { space, type } from '../../src/theme';

export default function Today() {
  const { palette } = useTheme();
  const { profile } = useAuth();
  const today = todayKey();
  // Flexible rhythms count over the whole week or month, so load that much.
  const [windowFrom, windowTo] = marksWindow(today);

  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  const reload = useCallback(() => {
    api.listPillars().then(setPillars).catch(() => {});
    api.listHabits().then(setHabits).catch(() => {});
    api.listMarks(windowFrom, windowTo).then(setMarks).catch(() => {});
  }, [windowFrom, windowTo]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // Only what today actually asks for: a habit that runs three times a week
  // is simply absent on its other days, so the circle can always close.
  const dueToday = useMemo(() => dueOn(habits, today, marks), [habits, today, marks]);
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

  const doneToday = dueToday.filter(h => markedToday.has(h.id)).length;
  const todayFraction = dueToday.length ? doneToday / dueToday.length : 0;

  // Keep the evening reminder and the home-screen widget in step with what
  // is still open today.
  React.useEffect(() => {
    syncEveningReminder(dueToday.length - doneToday);
    publishSnapshot(buildSnapshot(habits, marks, today));
  }, [dueToday.length, doneToday, habits, marks, today]);

  const hour = new Date().getHours();
  const daypart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const greeting = profile?.name ? `good ${daypart}, ${profile.name}` : undefined;

  return (
    <Screen title="Today" subtitle={formatLong(today)} greeting={greeting}>
      <View style={{ alignItems: 'center', marginVertical: space.l, marginBottom: space.xl }}>
        <MiniRing fraction={todayFraction} size={186}>
          <Text style={[type.numeral, { color: palette.ink }]}>
            {doneToday}<Text style={{ fontSize: 22, color: palette.dim }}> / {dueToday.length}</Text>
          </Text>
          <Label style={{ marginTop: 2 }}>marks today</Label>
        </MiniRing>
      </View>

      {pillars.map(pillar => {
        const own = dueToday.filter(h => h.pillarId === pillar.id);
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
            {pillar.identity && !isCollapsed ? (
              <Body dim style={{ fontSize: 12, marginTop: 6 }}>{pillar.identity}</Body>
            ) : null}
            {!isCollapsed && own.map(habit => (
              <View
                key={habit.id}
                style={{ borderBottomWidth: 1, borderBottomColor: palette.hairline }}
              >
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingVertical: 14,
                  }}
                >
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => setExpandedHabit(expandedHabit === habit.id ? null : habit.id)}
                  >
                    <Item>{habit.name}</Item>
                  </Pressable>
                  <MarkRing
                    marked={markedToday.has(habit.id)}
                    onPress={() => toggle(habit.id)}
                    label={habit.name}
                  />
                </View>
                {expandedHabit === habit.id ? (
                  <Pressable
                    onPress={() => { addToOwnCalendar(habit.name); setExpandedHabit(null); }}
                    style={{ paddingBottom: 14 }}
                  >
                    <Body dim>Put it in your own calendar</Body>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        );
      })}

      {habits.length === 0 ? (
        <Body dim>
          No habits yet. Add one under More.
        </Body>
      ) : dueToday.length === 0 ? (
        <Body dim>
          Nothing scheduled today.
        </Body>
      ) : null}

      <Hairline />
      <Capture />
    </Screen>
  );
}
