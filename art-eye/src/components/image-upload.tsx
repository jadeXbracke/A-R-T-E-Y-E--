import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, space } from '../theme';
import { MonoLink } from './ui';

/**
 * Pick a photo from the library. Reports the local uri via onPick; the caller
 * uploads it (api.uploadImage) when saving. A uri that already starts with
 * http/asset is shown as the current image.
 */
export function PhotoPicker({
  uri,
  onPick,
  media = 'image',
  addLabel,
}: {
  uri: string | null;
  onPick: (localUri: string) => void;
  media?: 'image' | 'video';
  addLabel?: string;
}) {
  const [picking, setPicking] = useState(false);
  const isVideo = media === 'video';
  const noun = isVideo ? 'VIDEO' : 'PHOTO';

  const pick = async () => {
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: isVideo ? ['videos'] : ['images'],
        quality: 0.85,
        videoMaxDuration: 60, // keep user clips short
      });
      if (!result.canceled && result.assets[0]) onPick(result.assets[0].uri);
    } finally {
      setPicking(false);
    }
  };

  const set = !!uri && !uri.startsWith('asset:');

  return (
    <View>
      {set && !isVideo && (
        <Image source={{ uri: uri! }} style={styles.preview} contentFit="cover" />
      )}
      {set && isVideo && <Text style={styles.videoTag}>VIDEO ATTACHED ✓</Text>}
      <MonoLink
        label={picking ? 'OPENING LIBRARY…' : set ? `REPLACE ${noun}` : addLabel ?? `ADD ${noun}`}
        active
        onPress={pick}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: '100%',
    aspectRatio: 3 / 2,
    backgroundColor: colors.dim,
    marginBottom: space.m,
  },
  videoTag: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.ink,
    marginBottom: space.m,
  },
});
