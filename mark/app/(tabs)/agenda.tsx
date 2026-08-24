// AGENDA — appointments next to check-ins. V1 keeps a reliable local agenda
// with in-app blocks (workout, reading time); the two-way Google Calendar
// sync plugs into the same model (source + external_id) in V1.1.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Body, Button, Chip, Field, Hairline, Label, Screen } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { addDays, daysBetween, formatLong, formatTime, todayKey } from '../../src/lib/dates';
import { useTheme } from '../../src/lib/theme-context';
import { CalendarEvent } from '../../src/lib/types';
import { space, type } from '../../src/theme';

const DURATIONS = [30, 60, 90];

export default function Agenda() {
  const { palette } = useTheme();
  const today = todayKey();
  const horizon = addDays(today, 6);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [day, setDay] = useState(today);

  const reload = useCallback(() => {
    api.listEvents(today, horizon).then(setEvents).catch(() => {});
  }, [today, horizon]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const add = async () => {
    const m = /^(\d{1,2})[:.](\d{2})$/.exec(time.trim());
    if (!title.trim() || !m) return;
    const start = new Date(`${day}T${m[1].padStart(2, '0')}:${m[2]}:00`);
    const end = new Date(start.getTime() + duration * 60000);
    await api.addEvent(title.trim(), start.toISOString(), end.toISOString());
    setTitle('');
    setTime('');
    reload();
  };

  const remove = async (id: string) => {
    await api.deleteEvent(id);
    reload();
  };

  return (
    <Screen title="Agenda" subtitle="Your week, next to your marks">
      <View style={{ gap: space.m, marginBottom: space.xl }}>
        <Field placeholder="Block (e.g. workout, reading time)" value={title} onChangeText={setTitle} />
        <View style={{ flexDirection: 'row', gap: space.m }}>
          <Field placeholder="Start (e.g. 18:30)" value={time} onChangeText={setTime} style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {DURATIONS.map(d => (
              <Chip key={d} label={`${d}m`} active={duration === d} onPress={() => setDuration(d)} />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {daysBetween(today, addDays(today, 4)).map(d => (
            <Chip
              key={d}
              label={d === today ? 'Today' : formatLong(d).split(' ')[0]}
              active={day === d}
              onPress={() => setDay(d)}
            />
          ))}
        </View>
        <Button label="Plan block" onPress={add} disabled={!title.trim() || !time.trim()} />
      </View>

      <Hairline spacing={space.s} />

      {daysBetween(today, horizon).map(d => {
        const own = events.filter(e => e.start.slice(0, 10) === d);
        if (!own.length && d !== today) return null;
        return (
          <View key={d} style={{ marginTop: space.l }}>
            <Label style={{ marginBottom: space.s }}>{d === today ? 'today' : formatLong(d)}</Label>
            {own.length === 0 ? <Body dim>Free.</Body> : own.map(e => (
              <View
                key={e.id}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: space.m }}
              >
                <Body dim>{formatTime(e.start)}–{formatTime(e.end)}</Body>
                <Body style={{ flex: 1 }}>{e.title}</Body>
                <Pressable onPress={() => remove(e.id)} hitSlop={10}>
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
              </View>
            ))}
          </View>
        );
      })}

      <Hairline />
      <Text style={[type.small, { color: palette.dim }]}>
        Two-way Google Calendar sync arrives in V1.1 — the data model is ready for it.
      </Text>
    </Screen>
  );
}
