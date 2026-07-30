import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Venue } from '../lib/types';
import { colors, fonts } from '../theme';

/**
 * Schematic venue map — venues plotted by real lat/long on a plain ground,
 * in the app's editorial style (no street tiles, no API keys). Red dots have
 * work on view now; ink dots don't. Bounds fit whatever venues are passed in,
 * so area/type filters zoom the map naturally.
 */
export function VenueMap({
  venues,
  onNowIds,
  selectedId,
  onSelect,
}: {
  venues: Venue[];
  onNowIds: Set<string>;
  selectedId: string | null;
  onSelect: (v: Venue) => void;
}) {
  const placed = useMemo(
    () => venues.filter((v) => v.latitude != null && v.longitude != null),
    [venues]
  );
  const missing = venues.length - placed.length;

  const bounds = useMemo(() => {
    if (!placed.length) return null;
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const v of placed) {
      minLat = Math.min(minLat, v.latitude!);
      maxLat = Math.max(maxLat, v.latitude!);
      minLng = Math.min(minLng, v.longitude!);
      maxLng = Math.max(maxLng, v.longitude!);
    }
    // keep a minimum span so a single venue doesn't divide by zero
    const latSpan = Math.max(maxLat - minLat, 0.01);
    const lngSpan = Math.max(maxLng - minLng, 0.01);
    return { minLat, minLng, latSpan, lngSpan };
  }, [placed]);

  if (!bounds) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No mapped venues in this selection.</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.canvas}>
        {placed.map((v) => {
          // 6% padding so edge venues don't clip
          const x = 0.06 + 0.88 * ((v.longitude! - bounds.minLng) / bounds.lngSpan);
          const y = 0.06 + 0.88 * (1 - (v.latitude! - bounds.minLat) / bounds.latSpan);
          const on = onNowIds.has(v.id);
          const selected = v.id === selectedId;
          return (
            <Pressable
              key={v.id}
              onPress={() => onSelect(v)}
              hitSlop={10}
              style={[styles.pin, { left: `${x * 100}%`, top: `${y * 100}%` }]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: on ? colors.ink : colors.grey },
                  selected && styles.dotSelected,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: colors.ink }]} />
        <Text style={styles.legendText}>ON NOW</Text>
        <View style={[styles.legendDot, { backgroundColor: colors.grey, marginLeft: 14 }]} />
        <Text style={styles.legendText}>VENUE</Text>
        {missing > 0 && (
          <Text style={[styles.legendText, { marginLeft: 'auto' }]}>
            {missing} NOT MAPPED
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bg,
  },
  pin: {
    position: 'absolute',
    // center the dot on its coordinate
    marginLeft: -6,
    marginTop: -6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotSelected: {
    borderWidth: 3,
    borderColor: colors.hairline,
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -3,
    marginTop: -3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.ink,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.serifItalic, letterSpacing: 2, textTransform: 'uppercase',
    fontSize: 14,
    color: colors.ink,
  },
});
