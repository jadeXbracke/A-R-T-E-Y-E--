import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BackBar } from '@/components/Header';
import { ArtImage, EmptyState, HairRule, InkButton, MonoLabel, MonoText, SeenDot } from '@/components/ui';
import { dateRange } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { Exhibition, REJECTION_REASON_LABEL, Venue } from '@/lib/types';
import { color, space, type } from '@/theme';

function StatusLine({ e }: { e: Exhibition }) {
  if (e.status === 'approved')
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <SeenDot size={6} />
        <MonoText style={{ color: color.ink }}>IN THE AGENDA</MonoText>
      </View>
    );
  if (e.status === 'rejected')
    return (
      <MonoText style={{ color: color.red }}>
        NOT INCLUDED — {(e.rejection_reason ? REJECTION_REASON_LABEL[e.rejection_reason] : 'OTHER').toUpperCase()}. EDIT TO RESUBMIT.
      </MonoText>
    );
  return <MonoText>UNDER REVIEW</MonoText>;
}

export default function VenueSubmissionsScreen() {
  const router = useRouter();
  const { user, listMySubmissions } = useStore();
  const [rows, setRows] = useState<{ exhibitions: Exhibition[]; venues: Venue[] }>({
    exhibitions: [],
    venues: [],
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listMySubmissions().then((r) => active && setRows(r)).catch(() => {});
      return () => {
        active = false;
      };
    }, [listMySubmissions])
  );

  if (!user || user.role !== 'venue_owner') {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <BackBar title="VENUE" />
        <EmptyState text="Venue submissions belong to venue accounts. Create one to list your exhibitions." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <BackBar title="VENUE" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 24 }}>
          <MonoLabel>YOUR VENUE</MonoLabel>
          <Text style={[type.displaySerif, { marginTop: 6 }]}>Submissions</Text>
          <View style={{ marginTop: 18 }}>
            <InkButton label="SUBMIT A NEW EXHIBITION" onPress={() => router.push('/venue/new')} />
          </View>
        </View>

        {rows.exhibitions.length === 0 ? (
          <EmptyState text="Nothing submitted yet. Your exhibitions, in front of Sydney's most attentive audience." />
        ) : (
          <View style={{ paddingHorizontal: space.gutter, marginTop: 14 }}>
            {rows.exhibitions.map((e, i) => {
              const venue = rows.venues.find((v) => v.id === e.venue_id);
              return (
                <View key={e.id}>
                  {i > 0 && <HairRule />}
                  <Pressable
                    onPress={() => router.push(`/venue/edit/${e.id}`)}
                    style={{ flexDirection: 'row', gap: space.m, paddingVertical: space.m }}
                  >
                    <ArtImage uri={e.image_url} toneKey={e.id} style={{ width: 64, height: 80 }} />
                    <View style={{ flex: 1 }}>
                      <MonoText>{dateRange(e.start_date, e.end_date)}</MonoText>
                      <Text style={[type.titleSerif, { fontSize: 19, marginTop: 3 }]} numberOfLines={1}>
                        {e.title}
                      </Text>
                      {venue && <MonoText style={{ marginTop: 3 }}>{venue.name.toUpperCase()}</MonoText>}
                      <View style={{ marginTop: 8 }}>
                        <StatusLine e={e} />
                      </View>
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
