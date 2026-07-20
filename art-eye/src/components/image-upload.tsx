import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '../theme';
import { MonoLink } from './ui';

/**
 * Pick a photo from the library. Reports the local uri via onPick; the caller
 * uploads it (api.uploadImage) when saving. A uri that already starts with
 * http/asset is shown as the current image.
 */
export function PhotoPicker({
  uri,
  onPick,
  addLabel = 'ADD PHOTO',
}: {
  uri: string | null;
  onPick: (localUri: string) => void;
  addLabel?: string;
}) {
  const [picking, setPicking] = useState(false);

  const pick = async () => {
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) onPick(result.assets[0].uri);
    } finally {
      setPicking(false);
    }
  };

  const showPreview = !!uri && !uri.startsWith('asset:');

  return (
    <View>
      {showPreview && (
        <Image source={{ uri: uri! }} style={styles.preview} contentFit="cover" />
      )}
      <MonoLink
        label={picking ? 'OPENING LIBRARY…' : uri ? 'REPLACE PHOTO' : addLabel}
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
    backgroundColor: colors.hairline,
    marginBottom: space.m,
  },
});
