// Web version of the venue map: a real, zoomable OpenStreetMap (Leaflet),
// restyled to the house look — greyscale tiles, ink dots. Metro picks this
// file automatically for web builds; native keeps the schematic dot plot.
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Venue } from '../lib/types';
import { colors, fonts } from '../theme';

const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

// Loads Leaflet once and caches the promise across mounts.
let leafletReady: Promise<unknown> | null = null;
function loadLeaflet(): Promise<unknown> {
  if (leafletReady) return leafletReady;
  leafletReady = new Promise((resolve, reject) => {
    const w = window as unknown as { L?: unknown };
    if (w.L) return resolve(w.L);
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET_CSS;
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = LEAFLET_JS;
    js.onload = () => resolve((window as unknown as { L: unknown }).L);
    js.onerror = () => reject(new Error('map library failed to load'));
    document.head.appendChild(js);
  });
  return leafletReady;
}

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
  const hostRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);
  const placed = venues.filter((v) => v.latitude != null && v.longitude != null);
  const missing = venues.length - placed.length;

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((Lany) => {
      if (cancelled || !hostRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = Lany as any;
      if (!mapRef.current) {
        mapRef.current = L.map(hostRef.current, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true,
        });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          className: 'arteye-tiles', // greyscale via the css filter below
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapRef.current);
        // house style: monochrome ground
        const style = document.createElement('style');
        style.textContent = '.arteye-tiles { filter: grayscale(1) contrast(0.92); }';
        document.head.appendChild(style);
      }
      if (layerRef.current) layerRef.current.remove();
      const group = L.featureGroup();
      for (const v of placed) {
        const onNow = onNowIds.has(v.id);
        const sel = v.id === selectedId;
        const marker = L.circleMarker([v.latitude!, v.longitude!], {
          radius: sel ? 9 : onNow ? 7 : 5,
          color: '#131211',
          weight: sel ? 3 : 1.5,
          fillColor: '#131211',
          // filled dot = work on view now; open dot = between shows
          fillOpacity: onNow || sel ? 1 : 0.15,
        });
        marker.bindTooltip(v.name.toUpperCase(), {
          direction: 'top',
          offset: L.point(0, -8),
          className: 'arteye-tip',
        });
        marker.on('click', () => onSelect(v));
        marker.addTo(group);
      }
      group.addTo(mapRef.current);
      layerRef.current = group;
      if (placed.length) {
        mapRef.current.fitBounds(group.getBounds().pad(0.15), { maxZoom: 15 });
      }
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [placed.map((v) => v.id).join(','), selectedId, onNowIds.size]);

  useEffect(
    () => () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    },
    []
  );

  return (
    <View>
      <View style={styles.frame}>
        {React.createElement('div', {
          ref: hostRef,
          style: { width: '100%', height: '100%' },
        })}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>● WORK ON VIEW NOW   ○ BETWEEN SHOWS</Text>
        {missing > 0 && (
          <Text style={styles.legendText}>{missing} VENUES WITHOUT MAP POSITION</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 440,
    borderWidth: 1,
    borderColor: colors.ink,
    overflow: 'hidden',
  },
  legend: { marginTop: 8, gap: 2 },
  legendText: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.ink,
  },
});
