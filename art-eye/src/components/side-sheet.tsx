import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, space } from '../theme';
import { Kicker } from './ui';

/**
 * A panel that slides in from the right over a dimmed scrim — the app's
 * side menu. Tap the scrim or CLOSE to dismiss. No navigation dependency,
 * so any screen can host one (filters, menus).
 */
export function SideSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelWidth = Math.min(width * 0.8, 340);
  const slide = useRef(new Animated.Value(panelWidth)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
    } else {
      Animated.timing(slide, { toValue: panelWidth, duration: 180, useNativeDriver: true }).start(
        () => setMounted(false)
      );
    }
  }, [visible, panelWidth, slide]);

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.scrim} onPress={onClose} />
      <Animated.View
        style={[
          styles.panel,
          {
            width: panelWidth,
            paddingTop: insets.top + space.l,
            paddingBottom: insets.bottom + space.l,
            transform: [{ translateX: slide }],
          },
        ]}
      >
        <View style={styles.head}>
          <Kicker>{title}</Kicker>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>CLOSE ✕</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </Animated.View>
    </View>
  );
}

/** One row inside a SideSheet: mono label, hairline underneath. */
export function SheetRow({
  label,
  active,
  accent,
  onPress,
}: {
  label: string;
  active?: boolean;
  accent?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          active && { color: colors.red },
          accent && { color: colors.red },
        ]}
      >
        {label}
      </Text>
      {active && <Text style={styles.rowDot}>●</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 18, 16, 0.35)' },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderLeftWidth: 1,
    borderLeftColor: colors.hairline,
    paddingHorizontal: space.page,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    marginBottom: space.s,
  },
  close: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, color: colors.ink },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowLabel: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.6, color: colors.ink },
  rowDot: { color: colors.red, fontSize: 10 },
});
