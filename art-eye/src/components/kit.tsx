import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { color, dot, space } from '../theme';
import { BodyItalic, Mono, MonoLabel } from './Type';

/** Full-width hairline rule. */
export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.hairline, style]} />;
}

/** The signature red dot — marks a seen exhibition. */
export function SeenDot({ size = 8, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color.red },
        style,
      ]}
    />
  );
}

/** Underlined mono text link — filters and toggles are never pills. */
export function TextLink({
  label,
  active = false,
  muted = false,
  onPress,
  style,
}: {
  label: string;
  active?: boolean;
  muted?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={style}>
      <MonoLabel
        style={{
          color: active ? color.ink : muted ? color.grey : color.ink,
          textDecorationLine: 'underline',
          textDecorationColor: active ? color.red : color.hairline,
        }}
      >
        {label}
      </MonoLabel>
    </Pressable>
  );
}

/**
 * The square action bar: side-by-side mono buttons inside a single
 * 1px ink border. `primary` renders ink-filled with paper text.
 */
export function ActionBar({
  actions,
  style,
}: {
  actions: {
    label: string;
    onPress: () => void;
    primary?: boolean;
    active?: boolean;
    disabled?: boolean;
  }[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.actionBar, style]}>
      {actions.map((a, i) => (
        <Pressable
          key={a.label}
          onPress={a.onPress}
          disabled={a.disabled}
          style={({ pressed }) => [
            styles.actionCell,
            i > 0 && styles.actionCellDivider,
            a.primary && styles.actionCellPrimary,
            (pressed || a.active) && !a.primary && styles.actionCellActive,
            a.disabled && { opacity: 0.4 },
          ]}
        >
          {({ pressed }) => (
            <MonoLabel
              style={{
                color: a.primary || pressed || a.active ? color.paper : color.ink,
                textAlign: 'center',
              }}
            >
              {a.label}
            </MonoLabel>
          )}
        </Pressable>
      ))}
    </View>
  );
}

/** Five circular outline dots that fill red when selected. */
export function RatingDots({
  value,
  size = dot.ratingSize,
  onChange,
  style,
}: {
  value: number;
  size?: number;
  onChange?: (n: number) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flexDirection: 'row', gap: size >= 14 ? space.m : 5 }, style]}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const d = (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1,
              borderColor: filled ? color.red : color.grey,
              backgroundColor: filled ? color.red : 'transparent',
            }}
          />
        );
        if (!onChange) return <View key={n}>{d}</View>;
        return (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={10}>
            {d}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Empty states in the prototype's tone: an italic serif line, nothing else. */
export function EmptyState({
  text,
  action,
}: {
  text: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.empty}>
      <BodyItalic style={{ color: color.grey, textAlign: 'center' }}>{text}</BodyItalic>
      {action ? (
        <View style={{ marginTop: space.l, alignItems: 'center' }}>
          <TextLink label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={color.ink} />
    </View>
  );
}

/** Mono status/error line under forms. */
export function FormNote({ text, error = false }: { text: string; error?: boolean }) {
  if (!text) return null;
  return (
    <Mono style={{ color: error ? color.red : color.grey, marginTop: space.s }}>{text}</Mono>
  );
}

const styles = StyleSheet.create({
  hairline: {
    height: StyleSheet.hairlineWidth > 0 ? 1 : 1,
    backgroundColor: color.hairline,
    alignSelf: 'stretch',
  },
  actionBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: color.ink,
    alignSelf: 'stretch',
  },
  actionCell: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: space.s,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.paper,
  },
  actionCellDivider: {
    borderLeftWidth: 1,
    borderLeftColor: color.ink,
  },
  actionCellPrimary: {
    backgroundColor: color.ink,
  },
  actionCellActive: {
    backgroundColor: color.ink,
  },
  empty: {
    paddingVertical: space.xxl * 1.5,
    paddingHorizontal: space.xl,
    alignItems: 'center',
  },
});
