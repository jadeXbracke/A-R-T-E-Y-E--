import type { ImageSourcePropType } from 'react-native';

/**
 * Bundled neutral placeholders, used when an exhibition has no press image
 * (image_url of the form "asset:<key>") and as fallback while remote images load.
 */
const PLACEHOLDERS: Record<string, ImageSourcePropType> = {
  archibald: require('../../assets/placeholders/archibald.png'),
  murakami: require('../../assets/placeholders/murakami.png'),
  primavera: require('../../assets/placeholders/primavera.png'),
  armanious: require('../../assets/placeholders/armanious.png'),
  kahukiwa: require('../../assets/placeholders/kahukiwa.png'),
  nell: require('../../assets/placeholders/nell.png'),
  'constructed-world': require('../../assets/placeholders/constructed-world.png'),
  'places-of-delight': require('../../assets/placeholders/places-of-delight.png'),
  'gabori-ledgerwood': require('../../assets/placeholders/gabori-ledgerwood.png'),
  'infinite-gesture': require('../../assets/placeholders/infinite-gesture.png'),
  interconnected: require('../../assets/placeholders/interconnected.png'),
  pulse: require('../../assets/placeholders/pulse.png'),
  abbotsleigh: require('../../assets/placeholders/abbotsleigh.png'),
  generic: require('../../assets/placeholders/generic.png'),
};

export function imageSource(imageUrl: string | null): ImageSourcePropType {
  if (!imageUrl) return PLACEHOLDERS.generic;
  if (imageUrl.startsWith('asset:')) {
    return PLACEHOLDERS[imageUrl.slice(6)] ?? PLACEHOLDERS.generic;
  }
  return { uri: imageUrl };
}
