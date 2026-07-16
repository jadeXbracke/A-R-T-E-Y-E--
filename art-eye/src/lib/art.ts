import { ImageSourcePropType } from 'react-native';
import { Exhibition } from './types';

/** Bundled neutral artworks for the seed catalogue (press images unavailable offline). */
const SEED_ART: Record<string, ImageSourcePropType> = {
  'e-archibald': require('../../assets/art/e-archibald.png'),
  'e-murakami': require('../../assets/art/e-murakami.png'),
  'e-primavera': require('../../assets/art/e-primavera.png'),
  'e-armanious': require('../../assets/art/e-armanious.png'),
  'e-kahukiwa': require('../../assets/art/e-kahukiwa.png'),
  'e-nell': require('../../assets/art/e-nell.png'),
  'e-acw': require('../../assets/art/e-acw.png'),
  'e-bennett': require('../../assets/art/e-bennett.png'),
  'e-gabori': require('../../assets/art/e-gabori.png'),
  'e-gesture': require('../../assets/art/e-gesture.png'),
  'e-crothers': require('../../assets/art/e-crothers.png'),
  'e-pulse': require('../../assets/art/e-pulse.png'),
  'e-abbotsleigh': require('../../assets/art/e-abbotsleigh.png'),
};

const POOL = Object.values(SEED_ART);

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Resolve the image source for an exhibition:
 * a real image_url when present, otherwise its bundled seed artwork,
 * otherwise a deterministic neutral placeholder.
 */
export function artSource(e: Pick<Exhibition, 'id' | 'image_url'>): ImageSourcePropType {
  if (e.image_url) return { uri: e.image_url };
  if (SEED_ART[e.id]) return SEED_ART[e.id];
  return POOL[hash(e.id) % POOL.length];
}
