import { Linking, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme';

function platformLabel(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('tiktok.com')) return 'WATCH ON TIKTOK';
  if (u.includes('instagram.com')) return 'WATCH THE REEL';
  return 'WATCH THE CLIP';
}

/** Opens the venue's or exhibition's own Reel/TikTok post — a direct link to
 *  content they already published, no embedding or scraping involved. */
export function ReelLink({ url, style }: { url: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      style={[styles.row, style]}
      onPress={() => Linking.openURL(url).catch(() => {})}
      hitSlop={6}
    >
      <Text style={styles.glyph}>▶</Text>
      <Text style={styles.label}>{platformLabel(url)} ↗</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  glyph: { fontSize: 11, color: colors.red },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.ink,
  },
});
