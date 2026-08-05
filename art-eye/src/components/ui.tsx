import React, { useRef } from 'react';
import {Platform, Alert, ActivityIndicator,
  Animated,
  Image,
  ImageStyle,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,} from 'react-native';
import { colors, fonts, space, type } from '../theme';

/**
 * Pressable with motion: lifts slightly on hover (web) and eases down on
 * press, spring-animated. Wrap list rows and cards for a live, tactile feel.
 */
export function Lift({
  onPress,
  style,
  children,
}: {
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => to(1.015)}
      onHoverOut={() => to(1)}
      onPressIn={() => to(0.985)}
      onPressOut={() => to(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Mono kicker label, e.g. "YOUR RATING" */
export function Kicker({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.kicker, style]}>{children}</Text>;
}

/**
 * The ARTEYE wordmark — the app's logo, rendered from the supplied logo asset.
 * `size` is the glyph height in px; width follows the artwork's aspect ratio.
 * Single source of truth: swap the asset and every header/splash updates.
 */
const WORDMARK = require('../../assets/logo-arteye.png');
const WORDMARK_RATIO = 863 / 115; // artwork width / height

export function Wordmark({ size = 22, style }: { size?: number; style?: ImageStyle }) {
  const height = Math.round(size * 0.92);
  return (
    <Image
      source={WORDMARK}
      style={[{ width: height * WORDMARK_RATIO, height }, style]}
      resizeMode="contain"
      accessibilityLabel="ARTEYE"
    />
  );
}

/** Underlined mono text link — the app's only "button" besides the bars. */
export function MonoLink({
  label,
  active = false,
  onPress,
  color,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={style}>
      <Text
        style={[
          styles.monoLink,
          { color: color ?? colors.ink },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.monoLinkRule,
          { backgroundColor: active ? colors.ink : color ?? colors.hairline },
        ]}
      />
    </Pressable>
  );
}

export function Hairline({ style }: { style?: ViewStyle }) {
  return <View style={[styles.hairline, style]} />;
}

/** The signature red dot — marks a seen work, gallery-convention style. */
export function RedDot({ size = 7, style }: { size?: number; style?: ViewStyle }) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.ink },
        style,
      ]}
    />
  );
}

/** Five circular dots; filled red up to `value`. Interactive when onChange given. */
export function RatingDots({
  value,
  onChange,
  size = 12,
  gap = 12,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  gap?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const dot = (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1,
              borderColor: filled ? colors.ink : colors.ink,
              backgroundColor: filled ? colors.ink : 'transparent',
            }}
          />
        );
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={10}>
            {dot}
          </Pressable>
        ) : (
          <View key={n}>{dot}</View>
        );
      })}
    </View>
  );
}

/** Full-width ink save bar. */
export function InkBar({
  label,
  onPress,
  disabled = false,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={[styles.inkBar, (disabled || busy) && { opacity: 0.4 }]}
    >
      {busy ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <Text style={styles.inkBarLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Square-edged action bar: buttons side by side inside a single 1px ink border. */
export function ActionBar({
  actions,
}: {
  actions: { label: string; onPress: () => void; accent?: boolean; dot?: boolean }[];
}) {
  return (
    <View style={styles.actionBar}>
      {actions.map((a, i) => (
        <Pressable
          key={a.label}
          onPress={a.onPress}
          style={[styles.actionCell, i > 0 && styles.actionCellDivider]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {a.dot && <RedDot />}
            <Text style={[styles.actionLabel, a.accent && { color: colors.ink }]}>{a.label}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/** Mono-labelled input with hairline underline. */
export function Field({
  label,
  style,
  inputStyle,
  ...props
}: TextInputProps & { label: string; style?: ViewStyle; inputStyle?: object }) {
  return (
    <View style={[{ marginBottom: space.l }, style]}>
      <Kicker style={{ marginBottom: 8 }}>{label}</Kicker>
      <TextInput
        placeholderTextColor={colors.grey}
        style={[styles.input, inputStyle]}
        {...props}
      />
    </View>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ paddingVertical: space.xxl, paddingHorizontal: space.page }}>
      <Text style={styles.empty}>{children}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: space.xxl, alignItems: 'center' }}>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { ...type.monoLabel },
  monoLink: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    paddingBottom: 4,
  },
  monoLinkRule: { height: 1 },
  hairline: { height: 1, backgroundColor: colors.hairline },
  inkBar: {
    backgroundColor: colors.ink,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inkBarLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 2.4,
    color: colors.white,
  },
  actionBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.ink,
  },
  actionCell: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCellDivider: { borderLeftWidth: 1, borderLeftColor: colors.ink },
  actionLabel: { ...type.monoButton },
  input: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  empty: {
    fontFamily: fonts.serifItalic,
    fontSize: 20,
    lineHeight: 30,
    color: colors.ink,
  },
});

// Alert.alert silently does nothing on web, so route confirmations through
// window.confirm there — otherwise destructive buttons look dead in a browser.
export function confirmDialog(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}
