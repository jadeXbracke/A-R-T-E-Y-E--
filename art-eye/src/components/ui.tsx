import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewProps,
} from 'react-native';
import { colors, fonts, space, type } from '../lib/theme';

// ---------- typography ----------

export function Mono({ style, children, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[type.mono, style]}>
      {children}
    </Text>
  );
}

export function MonoInk({ style, children, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[type.monoInk, style]}>
      {children}
    </Text>
  );
}

/** Archivo letterspaced uppercase — artist names, wordmark. */
export function Caps({ style, children, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[type.caps, style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

/** Cormorant italic — exhibition titles, large headings. */
export function SerifItalic({ style, children, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[type.serifTitle, style]}>
      {children}
    </Text>
  );
}

export function SerifHeading({ style, children, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[type.serifHeading, style]}>
      {children}
    </Text>
  );
}

// ---------- structure ----------

export function Hairline({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[{ height: 1, backgroundColor: colors.hairline }, style]} />;
}

export function Dot({ size = 8, filled = true, color = colors.accent }: { size?: number; filled?: boolean; color?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: filled ? color : 'transparent',
        borderWidth: filled ? 0 : 1,
        borderColor: color,
      }}
    />
  );
}

// ---------- interactive ----------

/** Underlined mono text link — the prototype's filter/toggle idiom. No pills. */
export function MonoLink({
  label,
  active = false,
  onPress,
  color,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const c = color ?? (active ? colors.ink : colors.grey);
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <View style={{ paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: active ? colors.accent : 'transparent' }}>
        <Text style={[type.mono, { color: c }]}>{label.toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

/** Square-edged action bar: buttons side-by-side inside one 1px ink border. */
export function ActionBar({
  actions,
}: {
  actions: { label: string; onPress: () => void; primary?: boolean; accent?: boolean; disabled?: boolean }[];
}) {
  return (
    <View style={styles.actionBar}>
      {actions.map((a, i) => (
        <Pressable
          key={a.label}
          onPress={a.onPress}
          disabled={a.disabled}
          style={({ pressed }) => [
            styles.actionButton,
            i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.ink },
            a.primary && { backgroundColor: colors.ink },
            pressed && { opacity: 0.7 },
            a.disabled && { opacity: 0.35 },
          ]}
        >
          <Text
            style={[
              type.monoInk,
              a.primary && { color: colors.paper },
              a.accent && { color: colors.accent },
            ]}
          >
            {a.label.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Full-width ink bar button (the log flow's save bar). */
export function InkBar({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.inkBar, pressed && { opacity: 0.8 }, disabled && { opacity: 0.35 }]}
    >
      <Text style={[type.monoInk, { color: colors.paper }]}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

/** Five circular outline dots that fill red — rating input and display. */
export function RatingDots({
  value,
  onChange,
  size = 22,
  gap = 14,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  gap?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const dot = (
          <View
            key={n}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1,
              borderColor: n <= value ? colors.accent : colors.grey,
              backgroundColor: n <= value ? colors.accent : 'transparent',
            }}
          />
        );
        if (!onChange) return dot;
        return (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} testID={`rating-dot-${n}`}>
            {dot}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- forms ----------

export function Field({
  label,
  hint,
  ...inputProps
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: space.l }}>
      <Mono style={{ marginBottom: space.s }}>{label.toUpperCase()}</Mono>
      <TextInput
        placeholderTextColor={colors.grey}
        {...inputProps}
        style={[styles.input, inputProps.multiline && styles.inputMultiline, inputProps.style]}
      />
      {hint ? (
        <Text style={[type.serifItalicBody, { fontSize: 14, lineHeight: 19, color: colors.grey, marginTop: space.s }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

// ---------- states ----------

export function EmptyState({ children }: { children: string }) {
  return (
    <View style={{ paddingHorizontal: space.screenX, paddingVertical: space.xxl }}>
      <Text style={[type.serifItalicBody, { color: colors.grey, fontSize: 18, lineHeight: 27 }]}>{children}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ padding: space.xxl, alignItems: 'center' }}>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.ink,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  inkBar: {
    backgroundColor: colors.ink,
    alignItems: 'center',
    paddingVertical: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.ink,
    backgroundColor: colors.paper,
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 24,
  },
});
