// Shared building blocks — the calm, monochrome shell every screen uses.
import Constants from 'expo-constants';
import React from 'react';
import { router } from 'expo-router';
import {
  Image, ImageSourcePropType, Pressable, ScrollView, StyleProp, Text, TextInput, TextInputProps,
  TextStyle, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackdrop } from '../lib/backdrop';
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

function ScreenHeader({ title, subtitle, greeting, moreLink }: {
  title: string;
  subtitle?: string;
  greeting?: string;
  moreLink: boolean;
}) {
  const { palette } = useTheme();
  return (
    <>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Wordmark />
      {moreLink ? (
        <Pressable
          onPress={() => router.push('/instellingen')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="More"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={[type.label, { color: palette.dim }]}>More</Text>
          <View
            style={{
              width: 18, height: 18, borderRadius: 9,
              borderWidth: 1.25, borderColor: palette.ink,
            }}
          />
        </Pressable>
      ) : null}
    </View>
    {greeting ? (
      <Text style={[type.label, { color: palette.dim, marginTop: space.xl }]}>{greeting}</Text>
    ) : null}
    <Text style={[type.heading, { color: palette.inkDeep, marginTop: greeting ? space.s : space.xl }]}>{title}</Text>
    {subtitle ? (
      <Text style={[type.small, { color: palette.dim, marginTop: space.xs }]}>{subtitle}</Text>
    ) : null}
    </>
  );
}

export function Screen({
  children, title, subtitle, greeting, moreLink = true, backdrop = false, scene,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  greeting?: string;
  /** The small entry point to More, top-right beside the wordmark. Off on
   * the More screen itself, since it would otherwise open onto itself. */
  moreLink?: boolean;
  /** Show the user's own picture behind this screen, if they set one. */
  backdrop?: boolean;
  /** A picture that belongs to the screen itself rather than to the user. */
  scene?: ImageSourcePropType;
}) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { uri, scrim } = useBackdrop();
  const own = backdrop && uri ? { uri } : null;
  const source = own ?? scene ?? null;

  if (source) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        {/* Filling the screen edge to edge. Contained leaves bands of ground
          * above and below, which reads as a picture pasted onto the page
          * rather than the page standing on the picture. */}
        <Image
          source={source}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {/* the ground, laid back over the picture so type stays readable */}
        <View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: palette.bg, opacity: own ? scrim : 0.6,
          }}
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + space.l,
            paddingHorizontal: space.page,
            paddingBottom: space.xxl * 2,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title={title} subtitle={subtitle} greeting={greeting} moreLink={moreLink}
          />
          <View style={{ marginTop: space.xl }}>{children}</View>
        </ScrollView>
      </View>
    );
  }

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
      <ScreenHeader title={title} subtitle={subtitle} greeting={greeting} moreLink={moreLink} />
      <View style={{ marginTop: space.xl }}>{children}</View>
    </ScrollView>
  );
}

/** A picture that opens a section, as a band rather than wallpaper.
 *
 * Behind a block of controls a photo has nowhere to go: a bright one turns
 * to mud under the scrim, a dark one disappears into the ground, and either
 * way the chips and fields sit in a haze. Given its own band it stays a
 * picture, and the controls keep the clean ground they need. */
export function SceneBlock({ source, children, height = 340 }: {
  source: ImageSourcePropType;
  children: React.ReactNode;
  height?: number;
}) {
  const { palette } = useTheme();
  return (
    <View>
      {/* Bleeding past the page margin, so the picture meets both edges of
        * the screen the way it does on Today. */}
      <View
        style={{
          position: 'relative', overflow: 'hidden',
          marginTop: space.m, marginHorizontal: -space.page,
        }}
      >
        <Image source={source} resizeMode="cover" style={{ width: '100%', height }} />
        {/* just enough ground to settle the picture into the page */}
        <View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: palette.bg, opacity: 0.18,
          }}
        />
      </View>
      {children}
    </View>
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
