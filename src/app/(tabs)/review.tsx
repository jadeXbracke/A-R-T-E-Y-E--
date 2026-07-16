import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionBar,
  EmptyState,
  Hairline,
  Loading,
  MonoLabel,
  TextLink,
} from '../../components/ui';
import { api } from '../../lib/api';
import { useApp } from '../../lib/app-context';
import { dateRange, openingTag } from '../../lib/format';
import {
  REJECTION_REASON_LABELS,
  type Exhibition,
  type RejectionReason,
} from '../../lib/types';
import { colors, PAGE_PAD, type } from '../../theme';

const REASONS = Object.keys(REJECTION_REASON_LABELS) as RejectionReason[];

function PendingCard({
  exhibition,
  onDone,
}: {
  exhibition: Exhibition;
  onDone: () => void;
}) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    setBusy(true);
    try {
      await api.approveExhibition(exhibition.id);
      onDone();
    } finally {
      setBusy(false);
    }
  };

  const reject = async (reason: RejectionReason) => {
    setBusy(true);
    try {
      await api.rejectExhibition(exhibition.id, reason);
      onDone();
    } finally {
      setBusy(false);
    }
  };

  const opening = openingTag(exhibition);

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Image
          source={exhibition.image_url ?? undefined}
          style={styles.thumb}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={type.monoSmall}>{dateRange(exhibition)}</Text>
          {opening ? (
            <Text style={[type.monoSmall, { color: colors.red, marginTop: 2 }]}>{opening}</Text>
          ) : null}
          <Text style={[type.serifTitle, { marginTop: 4 }]}>{exhibition.title}</Text>
          <Text style={[type.capsArtist, { fontSize: 11, marginTop: 4 }]}>
            {exhibition.artists}
          </Text>
          <Text style={[type.monoSmall, { marginTop: 6 }]}>
            {exhibition.venue?.name?.toUpperCase()} · {(exhibition.venue?.type ?? '').toUpperCase()}
          </Text>
          {!exhibition.image_url ? (
            <Text style={[type.monoSmall, { color: colors.red, marginTop: 6 }]}>NO IMAGE</Text>
          ) : null}
          {exhibition.submitter_email ? (
            <Text style={[type.monoSmall, { marginTop: 6 }]}>
              FROM {exhibition.submitter_email.toUpperCase()}
            </Text>
          ) : null}
        </View>
      </View>

      {exhibition.description ? (
        <Text style={[type.serifBody, { fontSize: 15, lineHeight: 22, marginTop: 12 }]} numberOfLines={4}>
          {exhibition.description}
        </Text>
      ) : null}

      <View style={{ marginTop: 16 }}>
        {rejecting ? (
          <View>
            <MonoLabel style={{ marginBottom: 12 }}>REASON — ONE TAP</MonoLabel>
            <View style={styles.reasonRow}>
              {REASONS.map((r) => (
                <TextLink
                  key={r}
                  label={REJECTION_REASON_LABELS[r].toUpperCase()}
                  onPress={() => reject(r)}
                />
              ))}
              <TextLink label="CANCEL" active onPress={() => setRejecting(false)} />
            </View>
          </View>
        ) : (
          <ActionBar
            actions={[
              { label: 'APPROVE', onPress: approve, filled: true, disabled: busy },
              {
                label: 'EDIT',
                onPress: () => router.push(`/edit-submission/${exhibition.id}`),
                disabled: busy,
              },
              { label: 'REJECT', onPress: () => setRejecting(true), accent: true, disabled: busy },
            ]}
          />
        )}
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const { profile, refreshAgenda } = useApp();
  const [pending, setPending] = useState<Exhibition[] | null>(null);

  const load = useCallback(() => {
    api.listPending().then(setPending);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (profile?.role === 'admin') load();
    }, [profile, load]),
  );

  if (profile?.role !== 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <EmptyState body="Reviewing submissions is for the ART EYE team." />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.head, { paddingTop: insets.top + 18 }]}>
        <MonoLabel>ADMIN</MonoLabel>
        <Text style={[type.serifHeading, { marginTop: 8 }]}>Awaiting review</Text>
        <Text style={[type.monoSmall, { marginTop: 10 }]}>
          NOTHING JOINS THE AGENDA WITHOUT APPROVAL.
        </Text>
      </View>
      <Hairline />

      {pending === null ? (
        <Loading />
      ) : pending.length === 0 ? (
        <EmptyState body="Nothing waiting. Every submission has been reviewed." />
      ) : (
        <View style={{ paddingHorizontal: PAGE_PAD }}>
          {pending.map((e) => (
            <PendingCard
              key={e.id}
              exhibition={e}
              onDone={() => {
                load();
                refreshAgenda();
              }}
            />
          ))}
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
  },
  card: {
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  thumb: {
    width: 84,
    height: 105,
    backgroundColor: colors.hairline,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 18,
    rowGap: 12,
  },
});
