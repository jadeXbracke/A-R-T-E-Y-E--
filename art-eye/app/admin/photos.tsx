// Photos — the owner picks each show's picture from the venue's own pages.
// Shows without a photo come first; tapping one lists every photograph found
// on that venue's site so the choice is editorial, not algorithmic.
// Owner-only: guarded here on role, and the write is a normal admin update
// that RLS refuses for any other account.
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Kicker, Loading, MonoLink } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Exhibition, ImageCandidate, Venue } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

export default function Photos() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const [mode, setMode] = useState<'shows' | 'venues'>('shows');
  const [shows, setShows] = useState<Exhibition[] | null>(null);
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [open, setOpen] = useState<
    { kind: 'show'; show: Exhibition } | { kind: 'venue'; venue: Venue } | null
  >(null);
  const [candidates, setCandidates] = useState<ImageCandidate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (profile?.role === 'admin') {
        api.listAllExhibitions().then((all) => alive && setShows(all));
        api.listVenues().then((all) => alive && setVenues(all));
      }
      return () => {
        alive = false;
      };
    }, [profile])
  );

  const hasPhoto = (e: Exhibition) => !!e.image_url && /^https?:\/\//i.test(e.image_url);

  // Missing pictures first — that is the work to be done.
  const ordered = useMemo(() => {
    const list = (shows ?? []).filter((e) => e.status === 'approved');
    return [...list].sort((a, b) => Number(hasPhoto(a)) - Number(hasPhoto(b)));
  }, [shows]);

  const missing = ordered.filter((e) => !hasPhoto(e)).length;

  const hasVenuePhoto = (v: Venue) => !!v.image_url && /^https?:\/\//i.test(v.image_url);
  const orderedVenues = useMemo(
    () => [...(venues ?? [])].sort((a, b) => Number(hasVenuePhoto(a)) - Number(hasVenuePhoto(b))),
    [venues]
  );
  const missingVenues = orderedVenues.filter((v) => !hasVenuePhoto(v)).length;

  const openShow = async (e: Exhibition) => {
    setOpen({ kind: 'show', show: e });
    setCandidates(null);
    setError(null);
    try {
      setCandidates(await api.listImageCandidates(e.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCandidates([]);
    }
  };

  const openVenue = async (v: Venue) => {
    setOpen({ kind: 'venue', venue: v });
    setCandidates(null);
    setError(null);
    try {
      setCandidates(await api.listVenueImageCandidates(v.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCandidates([]);
    }
  };

  const choose = async (url: string | null) => {
    if (!open) return;
    setBusy(true);
    setError(null);
    try {
      if (open.kind === 'show') {
        await api.setExhibitionImage(open.show.id, url);
        setShows((cur) =>
          (cur ?? []).map((e) => (e.id === open.show.id ? { ...e, image_url: url } : e))
        );
      } else {
        await api.setVenueImage(open.venue.id, url);
        setVenues((cur) =>
          (cur ?? []).map((v) => (v.id === open.venue.id ? { ...v, image_url: url } : v))
        );
      }
      setOpen(null);
      setCandidates(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

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

  const cell = (width - space.page * 2 - space.s) / 2;

  // ── Picking view ─────────────────────────────────────────────────────────
  if (open) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
      >
        <View style={styles.head}>
          <View style={{ flex: 1, paddingRight: space.m }}>
            <Kicker style={{ marginBottom: 8 }}>CHOOSE A PHOTOGRAPH</Kicker>
            <Text style={styles.showTitle} numberOfLines={2}>
              {open.kind === 'show' ? open.show.title : open.venue.name}
            </Text>
            <Text style={styles.showVenue}>
              {open.kind === 'show'
                ? open.show.venue?.name?.toUpperCase()
                : 'VENUE PORTRAIT — SHOWN ON THE VENUE PAGE'}
            </Text>
          </View>
          <Pressable onPress={() => setOpen(null)} hitSlop={12}>
            <Text style={styles.back}>← BACK</Text>
          </Pressable>
        </View>
        <Hairline />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {candidates === null ? (
          <>
            <Loading />
            <Text style={styles.reading}>
              Reading {(open.kind === 'show' ? open.show.venue?.name : open.venue.name) ?? 'the venue site'}…
            </Text>
          </>
        ) : candidates.length === 0 ? (
          <EmptyState>
            No photographs found on this venue&apos;s pages. You can still paste an image address on
            the show&apos;s edit screen.
          </EmptyState>
        ) : (
          <View style={styles.grid}>
            {candidates.map((c) => {
              const currentUrl = open.kind === 'show' ? open.show.image_url : open.venue.image_url;
              const current = currentUrl === c.url;
              return (
                <Pressable
                  key={c.url}
                  style={[styles.cellWrap, { width: cell }, busy && styles.dim]}
                  disabled={busy}
                  onPress={() => choose(c.url)}
                >
                  <Image
                    source={{ uri: c.url }}
                    style={{ width: cell, height: cell }}
                    contentFit="cover"
                    transition={150}
                  />
                  <Text style={styles.cellMeta} numberOfLines={1}>
                    {current ? 'IN USE NOW' : c.featured ? 'PRESS IMAGE' : c.alt || 'FROM THIS PAGE'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {(open.kind === 'show' ? open.show.image_url : open.venue.image_url) ? (
          <Pressable style={styles.clear} disabled={busy} onPress={() => choose(null)}>
            <Text style={styles.clearText}>REMOVE THE CURRENT PHOTO</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <View>
          <Kicker style={{ marginBottom: 10 }}>PHOTOS</Kicker>
          <Text style={type.serifHeading}>Pick the picture</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <View style={styles.toggle}>
        <MonoLink label="SHOWS" active={mode === 'shows'} onPress={() => setMode('shows')} />
        <MonoLink label="VENUES" active={mode === 'venues'} onPress={() => setMode('venues')} />
      </View>
      <Text style={styles.intro}>
        {mode === 'shows'
          ? `Tap a show to see every photograph on its venue's pages, then choose the one you want.${
              missing > 0 ? ` ${missing} without a photo, listed first.` : ' Every show has a photo.'
            }`
          : `Pick each venue's portrait — the photograph on its page in the app.${
              missingVenues > 0
                ? ` ${missingVenues} without a photo, listed first.`
                : ' Every venue has a photo.'
            }`}
      </Text>
      <Hairline />

      {mode === 'shows' ? (
        shows === null ? (
          <Loading />
        ) : ordered.length === 0 ? (
          <EmptyState>No published shows yet.</EmptyState>
        ) : (
          ordered.map((e) => (
            <Pressable key={e.id} style={styles.row} onPress={() => openShow(e)}>
              {hasPhoto(e) ? (
                <Image source={{ uri: e.image_url! }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]}>
                  <Text style={styles.thumbEmptyText}>NONE</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {e.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {e.venue?.name?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          ))
        )
      ) : venues === null ? (
        <Loading />
      ) : orderedVenues.length === 0 ? (
        <EmptyState>No venues in the register yet.</EmptyState>
      ) : (
        orderedVenues.map((v) => (
          <Pressable key={v.id} style={styles.row} onPress={() => openVenue(v)}>
            {hasVenuePhoto(v) ? (
              <Image source={{ uri: v.image_url! }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <Text style={styles.thumbEmptyText}>NONE</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {v.name}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {v.type.toUpperCase()}
                {v.suburb ? ` · ${v.suburb.toUpperCase()}` : ''}
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.5, color: colors.ink },
  toggle: {
    flexDirection: 'row',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  intro: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  reading: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.ink,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingVertical: space.s,
  },
  showTitle: { ...type.serifTitle, fontSize: 20 },
  showVenue: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.ink,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.s,
    paddingHorizontal: space.page,
    paddingTop: space.m,
  },
  cellWrap: { marginBottom: space.s },
  cellMeta: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.ink,
    marginTop: 5,
  },
  dim: { opacity: 0.4 },
  clear: {
    marginHorizontal: space.page,
    marginTop: space.l,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: 13,
    alignItems: 'center',
  },
  clearText: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.5, color: colors.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  thumb: { width: 64, height: 64, backgroundColor: colors.bg },
  thumbEmpty: {
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmptyText: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.ink,
  },
  rowTitle: { ...type.serifTitle, fontSize: 15, lineHeight: 20 },
  rowMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.ink,
    marginTop: 4,
  },
  arrow: { fontFamily: fonts.mono, fontSize: 16, color: colors.ink },
});
