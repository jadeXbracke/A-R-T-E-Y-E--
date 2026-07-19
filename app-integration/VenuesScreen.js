// ============================================================================
// VenuesScreen.js — Sydney venue register voor ART EYE (Expo / React Native)
//
// Kopieer dit bestand naar je ART EYE-project (bijv. screens/VenuesScreen.js)
// en voeg het scherm toe aan je navigatie. Geen extra packages nodig —
// gebruikt alleen react-native built-ins, werkt direct in Expo Go.
//
// De data komt live uit het venue-register in de D-I-S-APP- repo op GitHub.
// Update je het register daar (seed opnieuw draaien + venues.json opnieuw
// genereren + pushen), dan ziet de app de nieuwe venues bij de volgende
// keer openen — zonder app-update.
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator, FlatList, Linking, Pressable,
  RefreshControl, StyleSheet, Text, View,
} from 'react-native';

const VENUES_URL =
  'https://raw.githubusercontent.com/jadeXbracke/D-I-S-APP-/claude/sydney-venues-migration-2k48yb/data/venues.json';
// Na merge naar main wordt dit:
// 'https://raw.githubusercontent.com/jadeXbracke/D-I-S-APP-/main/data/venues.json'

const TYPE_LABELS = { museum: 'Museum', gallery: 'Gallery', ari: 'Artist-run' };
const TYPE_ORDER = { museum: 0, gallery: 1, ari: 2 };

export default function VenuesScreen() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(VENUES_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const sorted = [...json.venues].sort(
        (a, b) =>
          (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9) ||
          a.name.localeCompare(b.name)
      );
      setVenues(sorted);
    } catch (e) {
      setError('Venues konden niet geladen worden. Controleer je verbinding.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Venues laden…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Opnieuw proberen</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={venues}
      keyExtractor={(v) => v.slug}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={[styles.badge, styles[`badge_${item.type}`]]}>
              <Text style={styles.badgeText}>{TYPE_LABELS[item.type] ?? item.type}</Text>
            </View>
          </View>
          {!!item.address && (
            <Text style={styles.muted}>{item.address}{item.suburb ? `, ${item.suburb}` : ''}</Text>
          )}
          <View style={styles.links}>
            {!!item.website && (
              <Pressable onPress={() => Linking.openURL(item.website)}>
                <Text style={styles.link}>Website</Text>
              </Pressable>
            )}
            {!!item.instagram && (
              <Pressable onPress={() => Linking.openURL(`https://instagram.com/${item.instagram}`)}>
                <Text style={styles.link}>@{item.instagram}</Text>
              </Pressable>
            )}
            {item.lat != null && item.lng != null && (
              <Pressable
                onPress={() =>
                  Linking.openURL(
                    `https://maps.apple.com/?q=${encodeURIComponent(item.name)}&ll=${item.lat},${item.lng}`
                  )
                }
              >
                <Text style={styles.link}>Kaart</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badge_museum: { backgroundColor: '#E8ECF9' },
  badge_gallery: { backgroundColor: '#EAF6EC' },
  badge_ari: { backgroundColor: '#FBF0E5' },
  badgeText: { fontSize: 12, fontWeight: '500' },
  muted: { color: '#666', marginTop: 4 },
  links: { flexDirection: 'row', gap: 16, marginTop: 10 },
  link: { color: '#2456C6', fontWeight: '500' },
  error: { color: '#B3261E', textAlign: 'center' },
  retry: { backgroundColor: '#2456C6', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
});
