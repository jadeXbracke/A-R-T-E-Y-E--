// Shared building blocks — the calm, monochrome shell every screen uses.
import Constants from 'expo-constants';
import React from 'react';
import { router } from 'expo-router';
import {
  AccessibilityInfo, Animated, Easing, Image, ImageSourcePropType, Platform, Pressable, ScrollView,
  StyleProp, Text, TextInput, TextInputProps, TextStyle, View,
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

/** Whether the viewer has asked for less movement. Background motion is
 * exactly what that setting is about. */
function useStillness(): boolean {
  const [still, setStill] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(on => { if (alive) setStill(on); })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setStill);
    return () => { alive = false; sub.remove(); };
  }, []);
  return still;
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
  /** A picture that belongs to the screen itself rather than to the user.
   * The user's own choice, when there is one, takes its place. */
  scene?: Scene;
}) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { uri, scrim } = useBackdrop();
  const [box, setBox] = React.useState({ width: 0, height: 0 });
  const still = useStillness();

  const own: Scene | null = backdrop && uri ? { source: { uri }, focus: 0.5, focusX: 0.5 } : null;
  const active = own ?? scene ?? null;
  const veil = own ? scrim : active?.scrim ?? 0.6;

  if (active) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        {/* Filling the screen edge to edge. Contained leaves bands of ground
          * above and below, which reads as a picture pasted onto the page
          * rather than the page standing on the picture. */}
        <View
          onLayout={e => setBox({
            width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height,
          })}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
        >
          {box.width > 0 ? (
            <SceneLayer scene={active} width={box.width} height={box.height} still={still} />
          ) : null}
        </View>
        {/* the ground, laid back over the picture so type stays readable */}
        <View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: palette.bg, opacity: veil,
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
/** How long one picture holds before handing over to the next. Slow on
 * purpose: this is a room you sit in, not a slideshow. */
const HOLD = 9000;
const FADE = 3500;
const DRIFT = 26000;

export interface Scene {
  source: ImageSourcePropType;
  /** Which part of a tall frame the band should keep: 0 is the top, 1 the
   * bottom. These are portrait photographs whose subject stands low, so a
   * plain centre crop lands on empty wall. */
  focus?: number;
  /** How far the frame rises and falls, in points, and how long one full
   * rise and fall takes.
   *
   * The whole picture moves, not a cut-out figure. Both of these were shot
   * against a plain wall, so travel of a few points is invisible in the
   * ground and visible only in the body: the runner takes a stride, the
   * held pose breathes. It is an illusion of movement, not real footage —
   * the limbs are as still as they were in the photograph. */
  bob?: number;
  period?: number;
  /** Which part of a wide frame to keep, the same idea sideways. */
  focusX?: number;
  /** How much ground sits over this picture. */
  scrim?: number;
  /** How much of the box the picture claims, from 0 to 1.
   *
   * At 0 every edge of the frame survives and the ground carries what is
   * left over. At 1 the picture fills the box and whatever will not fit is
   * cropped. A square photograph on a tall screen has to give up one or the
   * other, so the ground in between is where it usually wants to sit. */
  fill?: number;
  /** Where a picture smaller than the box sits: 0 is flush to the top. */
  anchor?: number;
  /** A drift along the frame over the same beat, for a body that also
   * travels rather than only rising. */
  sway?: number;
}

/** How tall a picture is per unit of width.
 *
 * A bundled asset carries its size in different places on each platform, and
 * react-native-web has no resolveAssetSource at all, so every shape gets a
 * look before falling back to measuring the file itself. */
function useAspect(source: ImageSourcePropType): number {
  const [ratio, setRatio] = React.useState(1.5);
  React.useEffect(() => {
    const raw = source as unknown as { width?: number; height?: number; uri?: string };
    if (raw?.width && raw?.height) { setRatio(raw.height / raw.width); return; }

    const resolve = (Image as unknown as {
      resolveAssetSource?: (s: ImageSourcePropType) => { width?: number; height?: number } | null;
    }).resolveAssetSource;
    const meta = typeof resolve === 'function' ? resolve(source) : null;
    if (meta?.width && meta?.height) { setRatio(meta.height / meta.width); return; }

    const uri = typeof source === 'string' ? source : raw?.uri;
    if (typeof uri === 'string') {
      Image.getSize(uri, (w, h) => { if (w) setRatio(h / w); }, () => {});
    }
  }, [source]);
  return ratio;
}

/** One picture in the band, cropped around its subject and drifting. */
export function SceneLayer({ scene, width, height, opacity, still }: {
  scene: Scene;
  width: number;
  height: number;
  opacity?: Animated.Value;
  still: boolean;
}) {
  // Cover the box, then slide whichever overflow there is to the chosen
  // focus, so a subject that sits off centre is the part that survives.
  const ratio = useAspect(scene.source);
  const fill = Math.min(Math.max(scene.fill ?? 1, 0), 1);

  // The two ends of the choice, and the ground between them.
  const coverW = Math.max(width, height / ratio);
  const coverH = Math.max(height, width * ratio);
  const drawnW = width + (coverW - width) * fill;
  const drawnH = width * ratio + (coverH - width * ratio) * fill;

  const slackX = Math.max(0, drawnW - width);
  const slackY = Math.max(0, drawnH - height);
  const spare = Math.max(0, height - drawnH);
  const lift = spare > 0
    // Room left over goes above the picture, in the share asked for.
    ? spare * Math.min(Math.max(scene.anchor ?? 0, 0), 1)
    : -slackY * Math.min(Math.max(scene.focus ?? 0.6, 0), 1);
  const pan = -slackX * Math.min(Math.max(scene.focusX ?? 0.5, 0), 1);

  const drift = React.useRef(new Animated.Value(0)).current;
  const beat = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (still) return;
    const native = Platform.OS !== 'web';
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: DRIFT, easing: Easing.inOut(Easing.ease), useNativeDriver: native }),
      Animated.timing(drift, { toValue: 0, duration: DRIFT, easing: Easing.inOut(Easing.ease), useNativeDriver: native }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [drift, still]);
  const bob = scene.bob ?? 0;
  const period = scene.period ?? 2000;
  const sway = scene.sway ?? 0;
  const moving = bob > 0 || sway > 0;

  React.useEffect(() => {
    if (!moving || still) return;
    const native = Platform.OS !== 'web';
    const half = { duration: period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: native };
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(beat, { toValue: 1, ...half }),
      Animated.timing(beat, { toValue: 0, ...half }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [beat, moving, period, still]);

  // Only as much larger than the box as the sideways travel needs. At exactly
  // box width any travel drags a bare strip in at the edge; more than that
  // and the picture is cropped for nothing.
  // Headroom only where there is something to spare. A picture kept whole
  // that is zoomed is no longer whole.
  const scale = drift.interpolate({
    inputRange: [0, 1], outputRange: [1 + 0.05 * fill, 1 + 0.12 * fill],
  });
  const shift = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -6 * fill] });
  const rise = beat.interpolate({ inputRange: [0, 1], outputRange: [bob / 2, -bob / 2] });
  const step = beat.interpolate({ inputRange: [0, 1], outputRange: [-sway / 2, sway / 2] });

  return (
    <Animated.Image
      source={scene.source}
      resizeMode="cover"
      style={{
        position: 'absolute', top: 0, left: 0,
        width: drawnW, height: drawnH,
        opacity,
        transform: [
          { translateY: lift }, { translateX: pan }, { scale }, { translateX: shift },
          { translateY: rise }, { translateX: step },
        ],
      }}
    />
  );
}

/** A picture that opens a section, bleeding to both edges of the screen.
 *
 * Behind a block of controls a photo has nowhere to go: a bright one turns
 * to mud under the scrim, a dark one disappears into the ground, and either
 * way the chips and fields sit in a haze. Given its own band it stays a
 * picture, and the controls keep the clean ground they need.
 *
 * Given more than one it drifts and crosses between them. */
export function SceneBlock({ scenes, children, height = 340, motion = false }: {
  scenes: Scene[];
  children: React.ReactNode;
  height?: number;
  /** A band holds still unless it is asked to move. */
  motion?: boolean;
}) {
  const { palette } = useTheme();
  const [index, setIndex] = React.useState(0);
  const [width, setWidth] = React.useState(0);
  const fade = React.useRef(new Animated.Value(0)).current;
  const still = useStillness() || !motion;

  const many = scenes.length > 1 && !still;

  React.useEffect(() => {
    if (!many) return;
    const native = Platform.OS !== 'web';
    let timer: ReturnType<typeof setTimeout>;
    const cross = () => {
      timer = setTimeout(() => {
        Animated.timing(fade, { toValue: 1, duration: FADE, easing: Easing.inOut(Easing.ease), useNativeDriver: native })
          .start(({ finished }) => {
            if (!finished) return;
            // Swap underneath while the top layer is fully opaque, so the
            // reset itself is never visible.
            setIndex(i => (i + 1) % scenes.length);
            fade.setValue(0);
            cross();
          });
      }, HOLD);
    };
    cross();
    return () => clearTimeout(timer);
  }, [fade, many, scenes.length]);

  return (
    <View>
      {/* Bleeding past the page margin, so the picture meets both edges of
        * the screen the way it does on Today. */}
      <View
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
        style={{
          position: 'relative', overflow: 'hidden', height,
          marginTop: space.m, marginHorizontal: -space.page,
        }}
      >
        {width > 0 ? (
          <>
            <SceneLayer scene={scenes[index]} width={width} height={height} still={still} />
            {many ? (
              <SceneLayer
                scene={scenes[(index + 1) % scenes.length]}
                width={width} height={height} opacity={fade} still={still}
              />
            ) : null}
          </>
        ) : null}
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
