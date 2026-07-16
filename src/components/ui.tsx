import { Image } from 'expo-image';
import React from 'react';
import {
  ActivityIndicator,
  ImageStyle,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { color, font, hairline, plateTone, type } from '@/theme';

/** Mono uppercase kicker/label — VENUE, YOUR RATING, ON NOW … */
export function MonoLabel({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[type.monoLabel, style]}>{children}</Text>;
}

/** Mono meta line — dates, venues */
export function MonoText({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[type.mono, style]}>{children}</Text>;
}

/** Letterspaced caps artist name */
export function ArtistCaps({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[type.artistCaps, style]}>{children}</Text>;
}

export function HairRule({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: hairline, backgroundColor: color.hairline }, style]} />;
}

/**
 * Underlined mono text link — the prototype's filters and toggles.
 * Active state underlines in red; inactive is grey with no underline.
 */
export function UnderlineLink({
  label,
  active,
  onPress,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={style}>
      <Text
        style={[
          type.monoAction,
          { color: active ? color.ink : color.grey },
          active && {
            textDecorationLine: 'underline',
            textDecorationColor: color.red,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Square-edged action button. variant ink = filled, line = 1px ink border. */
export function InkButton({
  label,
  onPress,
  variant = 'ink',
  active,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'ink' | 'line';
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const filled = variant === 'ink' || active;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'line' && { borderWidth: 1, borderColor: color.ink },
        filled && { backgroundColor: color.ink },
        (pressed || disabled) && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={filled ? color.white : color.ink} />
      ) : (
        <Text style={[type.monoAction, { color: filled ? color.white : color.ink }]}>{label}</Text>
      )}
    </Pressable>
  );
}

/** The signature red dot — marks a seen exhibition. */
export function SeenDot({ size = 8, style }: { size?: number; style?: ViewStyle }) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color.red },
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
  gap = 10,
}: {
  value: number;
  onChange?: (n: number) => void;
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
              backgroundColor: filled ? color.red : 'transparent',
              borderWidth: filled ? 0 : 1,
              borderColor: color.grey,
            }}
          />
        );
        return onChange ? (
          <Pressable key={n} hitSlop={10} onPress={() => onChange(n)}>
            {dot}
          </Pressable>
        ) : (
          <View key={n}>{dot}</View>
        );
      })}
    </View>
  );
}

/**
 * Exhibition image, or the neutral tonal plate when no press image exists:
 * a muted tone chosen deterministically per exhibition, with an inset
 * hairline frame — a matted plate, not a broken image.
 */
export function ArtImage({
  uri,
  toneKey,
  style,
}: {
  uri: string | null;
  toneKey: string;
  style?: StyleProp<ViewStyle>;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ backgroundColor: color.hairline }, style as StyleProp<ImageStyle>]}
        contentFit="cover"
        transition={200}
      />
    );
  }
  return (
    <View style={[{ backgroundColor: plateTone(toneKey) }, style]}>
      <View style={styles.plateFrame} />
    </View>
  );
}

/** Mono form label above an input */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <MonoLabel style={{ marginBottom: 6, color: color.ink }}>{children}</MonoLabel>;
}

/** Square, hairline-bordered text input */
export function Field(props: TextInputProps & { serif?: boolean }) {
  const { serif, style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={color.grey}
      {...rest}
      style={[
        styles.input,
        serif
          ? { fontFamily: font.serifItalic, fontSize: 17, lineHeight: 22 }
          : { fontFamily: font.mono, fontSize: 13, letterSpacing: 0.3 },
        style,
      ]}
    />
  );
}

/** Row of underlined mono options acting as a single-select. */
export function OptionRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 10 }}>
      {options.map((o) => (
        <UnderlineLink
          key={o.key}
          label={o.label}
          active={value === o.key}
          onPress={() => onChange(o.key)}
        />
      ))}
    </View>
  );
}

/** Centered empty-state block, serif italic in the prototype's tone. */
export function EmptyState({ text }: { text: string }) {
  return (
    <View style={{ paddingVertical: 64, paddingHorizontal: 32 }}>
      <Text style={[type.noteSerif, { color: color.grey, textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  input: {
    borderWidth: hairline,
    borderColor: color.ink,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: color.ink,
    backgroundColor: color.white,
  },
  plateFrame: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: hairline,
    borderColor: 'rgba(255,255,255,0.45)',
  },
});
