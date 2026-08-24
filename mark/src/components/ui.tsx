// Shared building blocks — the calm, monochrome shell every screen uses.
import Constants from 'expo-constants';
import React from 'react';
import {
  Pressable, ScrollView, StyleProp, Text, TextInput, TextInputProps, TextStyle, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme-context';
import { space, type } from '../theme';

export function Wordmark({ size = 15 }: { size?: number }) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={[type.wordmark, { fontSize: size, color: palette.inkDeep }]}>MARK</Text>
      <View
        style={{
          width: size * 0.36, height: size * 0.36, borderRadius: size,
          backgroundColor: palette.inkDeep, marginLeft: 3, marginTop: 3,
        }}
      />
    </View>
  );
}

export function Screen({ children, title, subtitle, greeting }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  greeting?: string;
}) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space.l,
        paddingHorizontal: space.page,
        paddingBottom: space.xxl * 2,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Wordmark />
      {greeting ? (
        <Text style={[type.label, { color: palette.dim, marginTop: space.xl }]}>{greeting}</Text>
      ) : null}
      <Text style={[type.heading, { color: palette.inkDeep, marginTop: greeting ? space.s : space.xl }]}>{title}</Text>
      {subtitle ? (
        <Text style={[type.small, { color: palette.dim, marginTop: space.xs }]}>{subtitle}</Text>
      ) : null}
      <View style={{ marginTop: space.xl }}>{children}</View>
    </ScrollView>
  );
}

export function Label({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { palette } = useTheme();
  return <Text style={[type.label, { color: palette.dim }, style]}>{children}</Text>;
}

export function Body({ children, dim, style }: {
  children: React.ReactNode;
  dim?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const { palette } = useTheme();
  return <Text style={[type.body, { color: dim ? palette.dim : palette.ink }, style]}>{children}</Text>;
}

/** A name in a list — habits, log rows, anything that reads as an entry. */
export function Item({ children, dim, style }: {
  children: React.ReactNode;
  dim?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const { palette } = useTheme();
  return <Text style={[type.item, { color: dim ? palette.dim : palette.ink }, style]}>{children}</Text>;
}

export function Hairline({ spacing = space.l }: { spacing?: number }) {
  const { palette } = useTheme();
  return <View style={{ height: 1, backgroundColor: palette.hairline, marginVertical: spacing }} />;
}

export function Section({ label, children, right }: {
  label: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: space.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.m }}>
        <Label>{label}</Label>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Chip({ label, active, onPress }: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
        borderWidth: 1, borderColor: active ? palette.ink : palette.hairline,
        backgroundColor: active ? palette.ink : 'transparent',
      }}
    >
      <Text style={[type.label, { color: active ? palette.bg : palette.dim }]}>{label}</Text>
    </Pressable>
  );
}

export function Button({ label, onPress, disabled }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        borderWidth: 1, borderColor: palette.ink, borderRadius: 999,
        paddingVertical: 12, alignItems: 'center',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text style={[type.label, { color: palette.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  const { palette } = useTheme();
  return (
    <TextInput
      placeholderTextColor={palette.dim}
      {...props}
      style={[
        type.body,
        {
          color: palette.ink,
          borderBottomWidth: 1, borderBottomColor: palette.hairline,
          paddingVertical: 10,
        },
        props.style,
      ]}
    />
  );
}

export function BuildStamp() {
  const { palette } = useTheme();
  const extra = (Constants.expoConfig?.extra ?? {}) as { buildSha?: string; buildDate?: string };
  return (
    <Text style={[type.small, { color: palette.dim }]}>
      {`build ${extra.buildSha ?? '?'} · ${extra.buildDate ?? '?'}`}
    </Text>
  );
}
