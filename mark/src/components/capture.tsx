// The mind dump capture: one field, five kinds, gone from your head in
// seconds. Kind chips only appear once you start typing, to keep Today calm.
import React, { useState } from 'react';
import { View } from 'react-native';
import { api } from '../lib/api';
import { useTheme } from '../lib/theme-context';
import { InboxKind } from '../lib/types';
import { space } from '../theme';
import { Body, Chip, Field } from './ui';

export const INBOX_KINDS: Array<{ value: InboxKind; label: string }> = [
  { value: 'book', label: 'Book' },
  { value: 'idea', label: 'Idea' },
  { value: 'task', label: 'To do' },
  { value: 'watch', label: 'Watch / listen' },
  { value: 'note', label: 'Note' },
];

export function Capture({ onAdded }: { onAdded?: () => void }) {
  const { palette } = useTheme();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<InboxKind>('idea');
  const [saved, setSaved] = useState(false);

  const add = async () => {
    if (!text.trim()) return;
    await api.addInbox(kind, text.trim());
    setText('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onAdded?.();
  };

  return (
    <View>
      <Field
        placeholder="Empty your head — a book, an idea, a to-do…"
        value={text}
        onChangeText={t => { setText(t); setSaved(false); }}
        onSubmitEditing={add}
        returnKeyType="done"
      />
      {text.trim() ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.m, alignItems: 'center' }}>
          {INBOX_KINDS.map(k => (
            <Chip key={k.value} label={k.label} active={kind === k.value} onPress={() => setKind(k.value)} />
          ))}
          <Chip label="Save" active onPress={add} />
        </View>
      ) : null}
      {saved ? (
        <Body dim style={{ marginTop: space.s, color: palette.dim }}>
          Captured — find it under Knowledge.
        </Body>
      ) : null}
    </View>
  );
}
