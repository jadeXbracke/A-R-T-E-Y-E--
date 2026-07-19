import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Header } from '../../src/components/Header';
import {
  Caps,
  HeadingXL,
  MonoLabelMuted,
  MonoMuted,
  SerifItalic,
} from '../../src/components/Type';
import { EmptyState, Loading } from '../../src/components/kit';
import { imageSource } from '../../src/data/placeholders';
import { client } from '../../src/lib/client';
import { dateRange } from '../../src/lib/format';
import { useAppState } from '../../src/state/AppState';
import { color, space } from '../../src/theme';
import type { Exhibition } from '../../src/types';

/** The approval desk: everything pending, oldest opening first. */
export default function AdminQueue() {
  const router = useRouter();
  const { profile } = useAppState();
  const [pending, setPending] = useState<Exhibition[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (profile?.role === 'admin') {
        client.listPendingExhibitions().then(setPending);
      }
    }, [profile]),
  );

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.screen}>
        <Header back />
        <EmptyState text="The approval desk is for admins only." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header back />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <MonoLabelMuted>ADMIN</MonoLabelMuted>
          <HeadingXL style={{ marginTop: space.s }}>Awaiting review</HeadingXL>
        </View>

        {pending === null ? (
          <Loading />
        ) : pending.length === 0 ? (
          <EmptyState text="The queue is clear. Every submission has been seen to." />
        ) : (
          <View style={styles.list}>
            {pending.map((e) => (
              <Pressable
                key={e.id}
                style={styles.row}
                onPress={() => router.push(`/admin/review/${e.id}`)}
              >
                <Image
                  source={imageSource(e.image_url)}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <MonoMuted style={{ fontSize: 10 }}>
                    {dateRange(e.start_date, e.end_date)}
                  </MonoMuted>
                  <SerifItalic numberOfLines={2} style={{ marginTop: 4 }}>
                    {e.title}
                  </SerifItalic>
                  <Caps numberOfLines={1} style={{ marginTop: 4 }}>
                    {e.artists.toUpperCase()}
                  </Caps>
                  <MonoMuted numberOfLines={1} style={{ marginTop: 2 }}>
                    {e.venue?.name.toUpperCase() ?? ''}
                    {!e.image_url ? '  ·  NO IMAGE' : ''}
                  </MonoMuted>
                </View>
              </Pressable>
            ))}
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
    flexDirection: 'row',
    gap: space.m,
    paddingHorizontal: space.gutter,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  thumb: {
    width: 56,
    height: 70,
    backgroundColor: color.hairline,
  },
});
