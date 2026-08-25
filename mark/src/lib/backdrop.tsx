// Your own picture behind Today and Growth.
//
// The photo is downscaled and stored as a data URI, so it survives a reload
// and never depends on a file path that may vanish. A scrim sits between the
// picture and the content: without it a vision board eats the type alive, so
// the strength is yours to set.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const IMAGE_KEY = 'mark.backdrop.image';
const SCRIM_KEY = 'mark.backdrop.scrim';

/** How much of the page ground sits over the picture. Kept low: at anything
 * near opaque the photo washes out to a flat ground and it reads as if
 * choosing one did nothing at all. */
export const SCRIM_STEPS = [0.35, 0.5, 0.65, 0.8];
const DEFAULT_SCRIM = 0.65;

const MAX_EDGE = 1400;
const QUALITY = 0.72;

interface BackdropState {
  uri: string | null;
  scrim: number;
  busy: boolean;
  pick(): Promise<void>;
  clear(): Promise<void>;
  setScrim(value: number): void;
}

const Ctx = createContext<BackdropState>({
  uri: null,
  scrim: DEFAULT_SCRIM,
  busy: false,
  pick: async () => {},
  clear: async () => {},
  setScrim: () => {},
});

/** Read a chosen file and shrink it, so storage stays in kilobytes. */
function readAndShrinkOnWeb(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new (window as unknown as { Image: typeof Image }).Image();
      img.onerror = () => reject(new Error('That does not look like an image.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not process that image.'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', QUALITY));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function pickOnWeb(): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // Safari on iOS ignores a click on an input that is not in the document,
    // so it has to be mounted — hidden, but really there.
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);

    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return finish(null);
      readAndShrinkOnWeb(file).then(finish, () => finish(null));
    };
    // Cancelling the file dialog fires no change event. Without this the
    // promise never settles and the button stays stuck on "choosing".
    input.oncancel = () => finish(null);
    window.addEventListener('focus', () => {
      setTimeout(() => { if (!input.files?.length) finish(null); }, 800);
    }, { once: true });

    input.click();
  });
}

async function pickOnNative(): Promise<string | null> {
  const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
  const Manipulator = require('expo-image-manipulator') as typeof import('expo-image-manipulator');

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const shrunk = await Manipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: MAX_EDGE } }],
    { compress: QUALITY, format: Manipulator.SaveFormat.JPEG, base64: true },
  );
  return shrunk.base64 ? `data:image/jpeg;base64,${shrunk.base64}` : null;
}

export function BackdropProvider({ children }: { children: React.ReactNode }) {
  const [uri, setUri] = useState<string | null>(null);
  const [scrim, setScrimState] = useState(DEFAULT_SCRIM);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([IMAGE_KEY, SCRIM_KEY]).then(pairs => {
      for (const [key, value] of pairs) {
        if (key === IMAGE_KEY && value) setUri(value);
        if (key === SCRIM_KEY && value) {
          const n = parseFloat(value);
          if (Number.isFinite(n)) setScrimState(n);
        }
      }
    }).catch(() => {});
  }, []);

  const pick = useCallback(async () => {
    setBusy(true);
    try {
      const next = Platform.OS === 'web' ? await pickOnWeb() : await pickOnNative();
      if (!next) return;
      setUri(next);
      await AsyncStorage.setItem(IMAGE_KEY, next).catch(() => {});
    } finally {
      setBusy(false);
    }
  }, []);

  const clear = useCallback(async () => {
    setUri(null);
    await AsyncStorage.removeItem(IMAGE_KEY).catch(() => {});
  }, []);

  const setScrim = useCallback((value: number) => {
    setScrimState(value);
    AsyncStorage.setItem(SCRIM_KEY, String(value)).catch(() => {});
  }, []);

  return (
    <Ctx.Provider value={{ uri, scrim, busy, pick, clear, setScrim }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBackdrop() {
  return useContext(Ctx);
}
