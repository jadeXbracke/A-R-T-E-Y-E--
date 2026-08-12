import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hairline, Kicker, Loading, MonoLink } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Feedback } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

// The owner's feedback inbox: general notes and "something is missing/wrong"
// reports, newest first. Mark handled to move them out of the way — nothing
// is deleted, so the record stays.
export default function FeedbackInbox() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = useState<Feedback[] | null>(null);

  const reload = useCallback(() => {
    if (profile?.role === 'admin') api.listFeedback().then(setItems);
  }, [profile]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Host only</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  const setStatus = async (id: string, status: Feedback['status']) => {
    await api.setFeedbackStatus(id, status);
    reload();
  };

  const fresh = (items ?? []).filter((f) => f.status === 'new');
  const done = (items ?? []).filter((f) => f.status === 'done');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <View>
          <Kicker style={{ marginBottom: 10 }}>HOST CONTROL</Kicker>
          <Text style={type.serifHeading}>Feedback</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Hairline />

      {items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>
          Nothing yet. Feedback and missing-info reports from users land here.
        </Text>
      ) : (
        <>
          {fresh.length === 0 && (
            <Text style={styles.empty}>Inbox clear — every note is handled.</Text>
          )}
          {fresh.map((f) => (
            <Row key={f.id} item={f} onStatus={setStatus} />
          ))}

          {done.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>HANDLED</Text>
              </View>
              {done.map((f) => (
                <Row key={f.id} item={f} onStatus={setStatus} muted />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Row({
  item,
  onStatus,
  muted = false,
}: {
  item: Feedback;
  onStatus: (id: string, status: Feedback['status']) => void;
  muted?: boolean;
}) {
  const when = new Date(item.created_at).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });
  const kindLabel =
    item.kind === 'general' ? 'GENERAL' : item.kind === 'venue' ? 'VENUE' : 'EXHIBITION';
  const openSubject = () => {
    if (!item.subject_id) return;
    router.push(item.kind === 'venue' ? `/venue/${item.subject_id}` : `/exhibition/${item.subject_id}`);
  };
  return (
    <View style={[styles.row, muted && { opacity: 0.55 }]}>
      <View style={styles.rowHead}>
        <Text style={styles.meta}>
          {kindLabel} · {(item.sender_name ?? 'ANONYMOUS').toUpperCase()} · {when.toUpperCase()}
        </Text>
        <MonoLink
          label={item.status === 'new' ? 'MARK HANDLED' : 'REOPEN'}
          active={item.status === 'new'}
          onPress={() => onStatus(item.id, item.status === 'new' ? 'done' : 'new')}
        />
      </View>
      {item.subject_name && (
        <Pressable onPress={openSubject} hitSlop={6} disabled={!item.subject_id}>
          <Text style={styles.subject} numberOfLines={1}>
            RE: {item.subject_name.toUpperCase()}
            {item.subject_id ? '  →' : ''}
          </Text>
        </Pressable>
      )}
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page, gap: space.m },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink, paddingBottom: 4 },
  empty: {
    fontFamily: fonts.serif,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingVertical: space.l,
  },
  row: {
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    gap: 6,
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.m,
  },
  meta: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, color: colors.ink, flexShrink: 1 },
  subject: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.2, color: colors.ink },
  text: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 22, color: colors.ink },
  sectionHead: { paddingHorizontal: space.page, paddingTop: space.l, paddingBottom: space.s },
  sectionTitle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink },
});
