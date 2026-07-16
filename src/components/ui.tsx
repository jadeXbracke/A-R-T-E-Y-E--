import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, dot, fonts, type } from '../theme';

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export function MonoLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.monoLabel, style]}>{children}</Text>;
}

export function MonoText({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.monoSmall, style]}>{children}</Text>;
}

export function SerifTitle({ children, style, numberOfLines }: { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return (
    <Text style={[type.serifTitle, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function CapsArtist({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.capsArtist, style]}>{children}</Text>;
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.hairline, style]} />;
}

/** The signature red dot — marks a seen exhibition. */
export function SeenDot({ size = 8 }: { size?: number }) {
  return <View style={dot(size, true)} />;
}

/** Five circular outline dots that fill red — ratings. */
export function RatingDots({
  rating,
  size = 10,
  gap = 8,
  onSelect,
}: {
  rating: number;
  size?: number;
  gap?: number;
  onSelect?: (n: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3, 4, 5].map((n) =>
        onSelect ? (
          <Pressable
            key={n}
            onPress={() => onSelect(n)}
            hitSlop={10}
            accessibilityLabel={`Rate ${n} of 5`}
          >
            <View style={dot(size, n <= rating)} />
          </Pressable>
        ) : (
          <View key={n} style={dot(size, n <= rating)} />
        ),
      )}
    </View>
  );
}

/**
 * Underlined mono text link — the app's only "chip"/filter/toggle idiom.
 * Active state gets the red underline; inactive is grey with no underline.
 */
export function TextLink({
  label,
  active = false,
  onPress,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={style}>
      <Text
        style={[
          type.monoButton,
          {
            fontSize: 11,
            color: active ? colors.ink : colors.grey,
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={{
          height: 1,
          marginTop: 3,
          backgroundColor: active ? colors.red : 'transparent',
        }}
      />
    </Pressable>
  );
}

/**
 * The square action bar: side-by-side mono buttons inside a single
 * 1px ink border. `filled` renders ink-on-white inverted.
 */
export function ActionBar({
  actions,
}: {
  actions: {
    label: string;
    onPress: () => void;
    filled?: boolean;
    accent?: boolean;
    disabled?: boolean;
  }[];
}) {
  return (
    <View style={styles.actionBar}>
      {actions.map((a, i) => (
        <Pressable
          key={a.label}
          testID={`action-${a.label}`}
          onPress={a.onPress}
          disabled={a.disabled}
          style={({ pressed }) => [
            styles.actionButton,
            i > 0 && styles.actionButtonDivider,
            a.filled && styles.actionButtonFilled,
            pressed && { opacity: 0.6 },
            a.disabled && { opacity: 0.35 },
          ]}
        >
          <Text
            style={[
              type.monoButton,
              { color: a.filled ? colors.bg : a.accent ? colors.red : colors.ink },
            ]}
          >
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Full-width ink bar (e.g. SAVE TO YOUR RECORD). */
export function InkBar({
  label,
  onPress,
  disabled,
  busy,
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
      style={({ pressed }) => [
        styles.inkBar,
        (pressed || disabled) && { opacity: disabled ? 0.35 : 0.75 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.bg} />
      ) : (
        <Text style={[type.monoButton, { color: colors.bg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Forms — square-edged, hairline-underlined fields with mono labels
// ---------------------------------------------------------------------------

export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginBottom: 24 }, style]}>
      <MonoLabel style={{ marginBottom: 8 }}>{label}</MonoLabel>
      <TextInput
        placeholderTextColor={colors.grey}
        style={[styles.input, props.multiline && styles.inputMultiline]}
        {...props}
      />
    </View>
  );
}

export function EmptyState({ title, body }: { title?: string; body: string }) {
  return (
    <View style={styles.empty}>
      {title ? <SerifTitle style={{ marginBottom: 12 }}>{title}</SerifTitle> : null}
      <Text style={[type.serifQuote, { color: colors.grey, textAlign: 'center' }]}>
        {body}
      </Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  hairline: {
    height: 1,
    backgroundColor: colors.hairline,
  },
  actionBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.ink,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.bg,
  },
  actionButtonDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.ink,
  },
  actionButtonFilled: {
    backgroundColor: colors.ink,
  },
  inkBar: {
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  input: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    borderRadius: 0,
  },
  inputMultiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  empty: {
    paddingVertical: 64,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
});
