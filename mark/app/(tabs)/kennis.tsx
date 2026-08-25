// KENNIS — books, courses, articles, podcasts, each with one short insight.
// The point is not a library but what you took from it.
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Capture, INBOX_KINDS } from '../../src/components/capture';
import { Body, Button, Chip, Field, Hairline, Item, Label, Screen, Section } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useTheme } from '../../src/lib/theme-context';
import { InboxItem, KnowledgeEntry, KnowledgeKind } from '../../src/lib/types';
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
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [kind, setKind] = useState<KnowledgeKind>('book');
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  const reload = useCallback(() => {
    api.listKnowledge().then(setEntries).catch(() => {});
    api.listInbox().then(setInbox).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const add = async () => {
    if (!title.trim()) return;
    await api.addKnowledge(kind, title.trim(), rating, note.trim());
    setTitle('');
    setRating(0);
    setNote('');
    reload();
  };

  const RatingDots = ({ value, size = 18, onChange }: {
    value: number;
    size?: number;
    onChange?: (v: number) => void;
  }) => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(v => {
        const dot = (
          <View
            style={{
              width: size, height: size, borderRadius: size / 2,
              borderWidth: 1.25, borderColor: v <= value ? palette.ink : palette.hairline,
              backgroundColor: v <= value ? palette.ink : 'transparent',
            }}
          />
        );
        return onChange ? (
          <Pressable key={v} onPress={() => onChange(v === value ? 0 : v)} hitSlop={8}>{dot}</Pressable>
        ) : (
          <View key={v}>{dot}</View>
        );
      })}
    </View>
  );

  const toggleItem = async (id: string) => {
    await api.toggleInboxDone(id);
    reload();
  };

  const removeItem = async (id: string) => {
    await api.deleteInbox(id);
    reload();
  };

  const openItems = inbox.filter(i => !i.done);
  const doneItems = inbox.filter(i => i.done);
  const kindLabelOf = (k: InboxItem['kind']) => INBOX_KINDS.find(x => x.value === k)?.label ?? k;

  const InboxRing = ({ item }: { item: InboxItem }) => (
    <Pressable onPress={() => toggleItem(item.id)} hitSlop={10}>
      <View
        style={{
          width: 22, height: 22, borderRadius: 11,
          borderWidth: 1.25, borderColor: palette.ink,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {item.done ? (
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: palette.ink }} />
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <Screen title="Mind" scene={require('../../assets/scenes/mind.jpg')}>
      <Section label="mind dump">
        <Capture onAdded={reload} />
        {openItems.map(item => (
          <View
            key={item.id}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: space.m,
              paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.hairline,
            }}
          >
            <InboxRing item={item} />
            <View style={{ flex: 1 }}>
              <Label style={{ marginBottom: 2 }}>{kindLabelOf(item.kind)}</Label>
              <Body>{item.text}</Body>
            </View>
            <Pressable onPress={() => removeItem(item.id)} hitSlop={10}>
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
        {doneItems.length ? (
          <Body dim style={{ marginTop: space.m }}>
            {doneItems.length} done
          </Body>
        ) : null}
        {doneItems.map(item => (
          <View
            key={item.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: 8, opacity: 0.45 }}
          >
            <InboxRing item={item} />
            <Body style={{ flex: 1 }}>{item.text}</Body>
            <Pressable onPress={() => removeItem(item.id)} hitSlop={10}>
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
      </Section>

      <Hairline spacing={space.m} />

      <Label style={{ marginBottom: space.m }}>log</Label>
      <View style={{ gap: space.m, marginBottom: space.xl }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {KINDS.map(k => (
            <Chip key={k.value} label={k.label} active={kind === k.value} onPress={() => setKind(k.value)} />
          ))}
        </View>
        <Field placeholder="What did you read or listen to?" value={title} onChangeText={setTitle} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: 4 }}>
          <Body dim>Rating</Body>
          <RatingDots value={rating} onChange={setRating} />
        </View>
        <Field placeholder="A note, if you want one" multiline value={note} onChangeText={setNote} />
        <Button label="Save" onPress={add} disabled={!title.trim()} />
      </View>

      <Hairline spacing={space.s} />

      {entries.length === 0 ? (
        <Body dim style={{ marginTop: space.l }}>Nothing logged yet.</Body>
      ) : (
        entries.map(e => (
          <View
            key={e.id}
            style={{ paddingVertical: space.m, borderBottomWidth: 1, borderBottomColor: palette.hairline }}
          >
            <Label style={{ marginBottom: 4 }}>{kindLabel(e.kind)} · {e.createdAt.slice(0, 10)}</Label>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Item style={{ flex: 1 }}>{e.title}</Item>
              {e.rating ? <RatingDots value={e.rating} size={10} /> : null}
            </View>
            {e.note ? <Body dim style={{ marginTop: 4 }}>{e.note}</Body> : null}
          </View>
        ))
      )}
    </Screen>
  );
}
