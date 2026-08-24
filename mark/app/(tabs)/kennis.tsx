// KENNIS — books, courses, articles, podcasts, each with one short insight.
// The point is not a library but what you took from it.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Chip, Field, Hairline, Label, Screen } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useTheme } from '../../src/lib/theme-context';
import { KnowledgeEntry, KnowledgeKind } from '../../src/lib/types';
import { space } from '../../src/theme';

const KINDS: Array<{ value: KnowledgeKind; label: string }> = [
  { value: 'book', label: 'Book' },
  { value: 'course', label: 'Course' },
  { value: 'article', label: 'Article' },
  { value: 'podcast', label: 'Podcast' },
];

const kindLabel = (k: KnowledgeKind) => KINDS.find(x => x.value === k)?.label ?? k;

export default function Knowledge() {
  const { palette } = useTheme();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [kind, setKind] = useState<KnowledgeKind>('book');
  const [title, setTitle] = useState('');
  const [insight, setInsight] = useState('');

  const reload = useCallback(() => {
    api.listKnowledge().then(setEntries).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const add = async () => {
    if (!title.trim()) return;
    await api.addKnowledge(kind, title.trim(), insight.trim());
    setTitle('');
    setInsight('');
    reload();
  };

  return (
    <Screen title="Knowledge" subtitle="Not what you collected, but what you took away">
      <View style={{ gap: space.m, marginBottom: space.xl }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {KINDS.map(k => (
            <Chip key={k.value} label={k.label} active={kind === k.value} onPress={() => setKind(k.value)} />
          ))}
        </View>
        <Field placeholder="Title" value={title} onChangeText={setTitle} />
        <Field placeholder="Your key insight (short)" multiline value={insight} onChangeText={setInsight} />
        <Button label="Save" onPress={add} disabled={!title.trim()} />
      </View>

      <Hairline spacing={space.s} />

      {entries.length === 0 ? (
        <Body dim style={{ marginTop: space.l }}>Nothing logged yet — start with what you are reading or listening to now.</Body>
      ) : (
        entries.map(e => (
          <View
            key={e.id}
            style={{ paddingVertical: space.m, borderBottomWidth: 1, borderBottomColor: palette.hairline }}
          >
            <Label style={{ marginBottom: 4 }}>{kindLabel(e.kind)} · {e.createdAt.slice(0, 10)}</Label>
            <Body>{e.title}</Body>
            {e.insight ? <Body dim style={{ marginTop: 4 }}>{e.insight}</Body> : null}
          </View>
        ))
      )}
    </Screen>
  );
}
