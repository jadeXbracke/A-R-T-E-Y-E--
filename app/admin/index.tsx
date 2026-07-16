import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BackBar } from '@/components/Header';
import { ArtImage, EmptyState, HairRule, MonoLabel, MonoText } from '@/components/ui';
import { dateRange } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { Exhibition, Venue } from '@/lib/types';
import { color, space, type } from '@/theme';

export default function AdminPendingScreen() {
  const router = useRouter();
  const { user, listPending } = useStore();
  const [rows, setRows] = useState<{ exhibitions: Exhibition[]; venues: Venue[] }>({
    exhibitions: [],
    venues: [],
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listPending().then((r) => active && setRows(r)).catch(() => {});
      return () => {
        active = false;
      };
    }, [listPending])
  );

  if (!user || user.role !== 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <BackBar title="REVIEW" />
        <EmptyState text="The review desk is for admins." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <BackBar title="REVIEW" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 24 }}>
          <MonoLabel>ADMIN — PENDING SUBMISSIONS</MonoLabel>
          <Text style={[type.displaySerif, { marginTop: 6 }]}>The review desk</Text>
        </View>

        {rows.exhibitions.length === 0 ? (
          <EmptyState text="Nothing waiting. The agenda is up to date." />
        ) : (
          <View style={{ paddingHorizontal: space.gutter, marginTop: 12 }}>
            {rows.exhibitions.map((e, i) => {
              const venue = rows.venues.find((v) => v.id === e.venue_id);
              return (
                <View key={e.id}>
                  {i > 0 && <HairRule />}
                  <Pressable
                    onPress={() => router.push(`/admin/${e.id}`)}
                    style={{ flexDirection: 'row', gap: space.m, paddingVertical: space.m }}
                  >
                    <ArtImage uri={e.image_url} toneKey={e.id} style={{ width: 64, height: 80 }} />
                    <View style={{ flex: 1 }}>
                      <MonoText>{dateRange(e.start_date, e.end_date)}</MonoText>
                      <Text style={[type.titleSerif, { fontSize: 19, marginTop: 3 }]} numberOfLines={1}>
                        {e.title}
                      </Text>
                      <MonoText style={{ marginTop: 3 }}>
                        {(venue?.name ?? 'NEW VENUE').toUpperCase()}
                      </MonoText>
                      <MonoText style={{ marginTop: 6, color: color.ink }}>
                        {e.submitted_by ? 'VENUE SUBMISSION' : 'PUBLIC SUBMISSION'}
                        {e.submitter_contact ? ` · ${e.submitter_contact.toUpperCase()}` : ''}
                        {!e.image_url ? ' · NO IMAGE' : ''}
                      </MonoText>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
