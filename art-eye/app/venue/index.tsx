import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Header } from '../../src/components/Header';
import {
  HeadingXL,
  Mono,
  MonoLabelMuted,
  MonoMuted,
  SerifItalic,
} from '../../src/components/Type';
import { EmptyState, Loading, TextLink } from '../../src/components/kit';
import { client } from '../../src/lib/client';
import { dateRange } from '../../src/lib/format';
import { useAppState } from '../../src/state/AppState';
import { color, space } from '../../src/theme';
import { REJECTION_REASON_LABELS, type Exhibition } from '../../src/types';

function statusLine(e: Exhibition): { text: string; tone: string } {
  switch (e.status) {
    case 'approved':
      return { text: 'IN THE AGENDA', tone: color.ink };
    case 'rejected':
      return {
        text: `NOT LISTED — ${e.rejection_reason ? REJECTION_REASON_LABELS[e.rejection_reason] : 'SEE NOTES'}`,
        tone: color.red,
      };
    default:
      return { text: 'WITH THE CURATORS', tone: color.grey };
  }
}

export default function VenueDashboard() {
  const router = useRouter();
  const { profile } = useAppState();
  const [submissions, setSubmissions] = useState<Exhibition[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      client.listMySubmissions(profile.id).then(setSubmissions);
    }, [profile]),
  );

  if (!profile || (profile.role !== 'venue_owner' && profile.role !== 'admin')) {
    return (
      <View style={styles.screen}>
        <Header back />
        <EmptyState
          text="This desk is for venue accounts. Sign in with a venue account to manage submissions."
          action={{ label: 'SIGN IN', onPress: () => router.push('/auth/sign-in') }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header back />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <MonoLabelMuted>YOUR VENUE</MonoLabelMuted>
          <HeadingXL style={{ marginTop: space.s }}>Submissions</HeadingXL>
          <View style={{ marginTop: space.l }}>
            <TextLink
              label="+ NEW EXHIBITION"
              onPress={() => router.push('/venue/edit/new')}
            />
          </View>
        </View>

        {submissions === null ? (
          <Loading />
        ) : submissions.length === 0 ? (
          <EmptyState text="Nothing submitted yet. Send your first exhibition to the curators and it will appear here." />
        ) : (
          <View style={styles.list}>
            {submissions.map((e) => {
              const s = statusLine(e);
              return (
                <Pressable
                  key={e.id}
                  style={styles.row}
                  onPress={() => router.push(`/venue/edit/${e.id}`)}
                >
                  <MonoMuted style={{ fontSize: 10 }}>
                    {dateRange(e.start_date, e.end_date)}
                  </MonoMuted>
                  <SerifItalic style={{ marginTop: 4 }}>{e.title}</SerifItalic>
                  <Mono style={{ color: s.tone, marginTop: 6, fontSize: 10, letterSpacing: 1.2 }}>
                    {s.text}
                  </Mono>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
  },
  head: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    paddingBottom: space.l,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  row: {
    paddingHorizontal: space.gutter,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
});
