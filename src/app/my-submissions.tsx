import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Hairline, Loading, MonoLabel, TextLink } from '../components/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/app-context';
import { dateRange } from '../lib/format';
import {
  REJECTION_REASON_LABELS,
  type Exhibition,
  type RejectionReason,
} from '../lib/types';
import { colors, PAGE_PAD, type } from '../theme';

function statusLine(e: Exhibition): { text: string; color: string } {
  switch (e.status) {
    case 'approved':
      return { text: 'APPROVED — ON THE AGENDA', color: colors.ink };
    case 'rejected': {
      const reason = e.rejection_reason
        ? REJECTION_REASON_LABELS[e.rejection_reason as RejectionReason] ?? e.rejection_reason
        : null;
      return {
        text: `NOT APPROVED${reason ? ` — ${reason.toUpperCase()}` : ''}`,
        color: colors.red,
      };
    }
    default:
      return { text: 'PENDING REVIEW', color: colors.grey };
  }
}

export default function MySubmissions() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useApp();
  const [items, setItems] = useState<Exhibition[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (profile) {
        api.listMySubmissions(profile.id).then((list) => alive && setItems(list));
      }
      return () => {
        alive = false;
      };
    }, [profile]),
  );

  if (!profile) return <Loading />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.head, { paddingTop: insets.top + 18 }]}>
        <TextLink label="← BACK" onPress={() => router.back()} />
        <MonoLabel style={{ marginTop: 18 }}>YOUR VENUE</MonoLabel>
        <Text style={[type.serifHeading, { marginTop: 8 }]}>Submissions</Text>
      </View>
      <Hairline />

      {items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState body="No submissions yet. When your venue has an exhibition coming up, submit it here for the agenda." />
      ) : (
        <View style={{ paddingHorizontal: PAGE_PAD }}>
          {items.map((e) => {
            const s = statusLine(e);
            const editable = e.status === 'pending';
            return (
              <Pressable
                key={e.id}
                onPress={() => (editable ? router.push(`/edit-submission/${e.id}`) : undefined)}
                style={({ pressed }) => [pressed && editable && { opacity: 0.7 }]}
              >
                <View style={styles.row}>
                  <Text style={type.monoSmall}>{dateRange(e)}</Text>
                  <Text style={[type.serifTitle, { marginTop: 4 }]}>{e.title}</Text>
                  <Text style={[type.monoSmall, { marginTop: 6, color: s.color }]}>{s.text}</Text>
                  {editable ? (
                    <Text style={[type.monoSmall, { marginTop: 6, textDecorationLine: 'underline' }]}>
                      EDIT
                    </Text>
                  ) : null}
                </View>
                <Hairline />
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 18,
    alignItems: 'flex-start',
  },
  row: {
    paddingVertical: 18,
  },
});
