import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  draftFromValues,
  emptyValues,
  ExhibitionForm,
  ExhibitionFormValues,
  validate,
} from '../../src/components/exhibition-form';
import { Hairline, Kicker, MonoLink } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { fmtRange } from '../../src/lib/dates';
import { Exhibition, REJECTION_REASONS, Venue } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

function statusLine(e: Exhibition): { text: string; color: string } {
  if (e.status === 'approved') return { text: 'IN THE AGENDA', color: colors.ink };
  if (e.status === 'rejected') {
    const reason = REJECTION_REASONS.find((r) => r.value === e.rejection_reason)?.label ?? 'OTHER';
    return { text: `NOT ACCEPTED — ${reason}`, color: colors.red };
  }
  return { text: 'IN REVIEW', color: colors.ink };
}

export default function SubmitScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const isOwner = profile?.role === 'venue_owner';

  const [values, setValues] = useState<ExhibitionFormValues>(emptyValues());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [mine, setMine] = useState<Exhibition[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (isOwner && profile) {
        api.myVenue(profile.id).then((v) => alive && setVenue(v));
        api.listMySubmissions(profile.id).then((s) => alive && setMine(s));
      } else {
        setVenue(null);
        setMine([]);
      }
      return () => {
        alive = false;
      };
    }, [isOwner, profile])
  );

  const submit = async () => {
    const venueLocked = isOwner && !!venue;
    const message = validate(values, venueLocked);
    if (message) {
      setError(message);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let imageUrl = values.image_url;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('asset:')) {
        imageUrl = await api.uploadImage(imageUrl);
      }
      const draft = draftFromValues({ ...values, image_url: imageUrl });
      if (venueLocked && venue) {
        draft.venue_name = venue.name;
        draft.venue_type = venue.type;
        draft.venue_address = venue.address ?? '';
      }
      await api.submitExhibition(draft, profile?.id ?? null);
      setValues(emptyValues());
      setDone(true);
      if (isOwner && profile) setMine(await api.listMySubmissions(profile.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ paddingHorizontal: space.page, paddingBottom: space.m }}>
        <Kicker style={{ marginBottom: 10 }}>
          {isOwner ? `FOR ${venue?.name.toUpperCase() ?? 'YOUR VENUE'}` : 'OPEN TO ALL — NO ACCOUNT NEEDED'}
        </Kicker>
        <Text style={type.serifHeading}>Submit an exhibition</Text>
        <Text style={styles.intro}>
          Know of a show our editors should see? Sydney exhibitions only — each submission is
          reviewed before it joins the agenda.
        </Text>
        {isOwner && venue && (
          <MonoLink
            label="MANAGE YOUR VENUE — PHOTO & LINKS"
            active
            onPress={() => router.push('/venue-profile')}
            style={{ alignSelf: 'flex-start', marginTop: space.l }}
          />
        )}
      </View>
      <Hairline style={{ marginBottom: space.l }} />

      {done && (
        <View style={styles.doneBox}>
          <Text style={styles.doneText}>
            Received, with thanks. Your submission is with our editors and will appear in the
            agenda once approved.
          </Text>
          <Pressable onPress={() => setDone(false)} hitSlop={8}>
            <Text style={styles.doneDismiss}>SUBMIT ANOTHER</Text>
          </Pressable>
        </View>
      )}

      {!done && (
        <View style={{ paddingHorizontal: space.page }}>
          <ExhibitionForm
            values={values}
            onChange={setValues}
            onSubmit={submit}
            submitLabel="SUBMIT FOR REVIEW"
            busy={busy}
            error={error}
            venueLocked={isOwner && !!venue}
          />
        </View>
      )}

      {isOwner && mine.length > 0 && (
        <View style={{ marginTop: space.xxl }}>
          <View style={{ paddingHorizontal: space.page, paddingBottom: space.m }}>
            <Text style={[type.serifHeading, { fontSize: 26 }]}>Your submissions</Text>
          </View>
          <Hairline />
          {mine.map((e) => {
            const s = statusLine(e);
            return (
              <Pressable
                key={e.id}
                style={styles.subRow}
                onPress={() => router.push(`/submission/${e.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.subDates}>{fmtRange(e.start_date, e.end_date)}</Text>
                  <Text style={styles.subTitle} numberOfLines={1}>
                    {e.title}
                  </Text>
                  <Text style={[styles.subStatus, { color: s.color }]}>{s.text}</Text>
                </View>
                <Text style={styles.subEdit}>EDIT</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
    marginTop: space.m,
  },
  doneBox: {
    marginHorizontal: space.page,
    borderWidth: 1,
    borderColor: colors.ink,
    padding: space.l,
  },
  doneText: {
    fontFamily: fonts.serifItalic,
    fontSize: 19,
    lineHeight: 28,
    color: colors.ink,
    marginBottom: space.m,
  },
  doneDismiss: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  subDates: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.ink, marginBottom: 3 },
  subTitle: { ...type.serifTitle, fontSize: 19 },
  subStatus: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    marginTop: 4,
  },
  subEdit: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});
