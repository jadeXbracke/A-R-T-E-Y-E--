// Your own picture behind Today and Growth.
//
// The photo is downscaled and stored as a data URI, so it survives a reload
// and never depends on a file path that may vanish. A scrim sits between the
// picture and the content: without it a vision board eats the type alive, so
// the strength is yours to set.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

const IMAGE_KEY = 'mark.backdrop.image';
const SCRIM_KEY = 'mark.backdrop.scrim';

/** How much of the page ground sits over the picture. Kept well away from
 * opaque: near the top of the range the photo washes out to a flat ground
 * and it reads as if choosing one did nothing at all. */
export const SCRIM_STEPS = [0.35, 0.5, 0.65, 0.8];
const DEFAULT_SCRIM = 0.65;

const MAX_EDGE = 1400;
const QUALITY = 0.72;
/** Room to spare under the usual 5 MB of browser storage. */
const MAX_STORED = 3_000_000;

interface BackdropState {
  uri: string | null;
  scrim: number;
  busy: boolean;
  /** Why the last attempt produced nothing, in words worth showing. */
  error: string | null;
  /** Native only — the web tap lands on a real input, see WebFilePicker. */
  pick(): Promise<void>;
  useFile(file: File): Promise<void>;
  clear(): Promise<void>;
  setScrim(value: number): void;
}

const Ctx = createContext<BackdropState>({
  uri: null,
  scrim: DEFAULT_SCRIM,
  busy: false,
  error: null,
  pick: async () => {},
  useFile: async () => {},
  clear: async () => {},
  setScrim: () => {},
});

/** Read a chosen file and shrink it, so storage stays in kilobytes.
 *
 * Shrinking is an optimisation, never a gate. Every step that can stall on a
 * phone — reading, decoding, drawing — either finishes or falls back to what
 * it already has, because a picker that hangs looks exactly like one that is
 * broken. */
function readAndShrinkOnWeb(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const readTimer = setTimeout(() => reject(new Error('Reading that photo took too long.')), 30000);
    reader.onerror = () => { clearTimeout(readTimer); reject(new Error('Could not read that file.')); };
    reader.onload = () => {
      clearTimeout(readTimer);
      const raw = String(reader.result || '');
      if (!raw.startsWith('data:image')) return reject(new Error('That does not look like an image.'));

      const img = new (window as unknown as { Image: typeof Image }).Image();
      let done = false;
      const keepRaw = () => { if (!done) { done = true; resolve(raw); } };
      const drawTimer = setTimeout(keepRaw, 10000);

      img.onerror = () => { clearTimeout(drawTimer); keepRaw(); };
      img.onload = () => {
        clearTimeout(drawTimer);
        if (done) return;
        done = true;
        try {
          const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(raw);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const out = canvas.toDataURL('image/jpeg', QUALITY);
          resolve(out.length > 32 && out.length < raw.length ? out : raw);
        } catch {
          resolve(raw);
        }
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}

async function pickOnNative(): Promise<string | null> {
  const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
  const Manipulator = require('expo-image-manipulator') as typeof import('expo-image-manipulator');

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('MARK needs permission to open your photos.');

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
  const [error, setError] = useState<string | null>(null);

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

  /** Show it first, then try to keep it: a picture that displays but could
   * not be saved is worth an honest word, not a blank screen. */
  const store = useCallback(async (next: string) => {
    setUri(next);
    if (next.length > MAX_STORED) {
      setError('That photo is too large to keep. It will go when you reload.');
      return;
    }
    try {
      await AsyncStorage.setItem(IMAGE_KEY, next);
    } catch {
      setError('There was no room to save it. It will go when you reload.');
    }
  }, []);

  const useFile = useCallback(async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      await store(await readAndShrinkOnWeb(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That photo could not be used.');
    } finally {
      setBusy(false);
    }
  }, [store]);

  const pick = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await pickOnNative();
      if (next) await store(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That photo could not be used.');
    } finally {
      setBusy(false);
    }
  }, [store]);

  const clear = useCallback(async () => {
    setUri(null);
    setError(null);
    await AsyncStorage.removeItem(IMAGE_KEY).catch(() => {});
  }, []);

  const setScrim = useCallback((value: number) => {
    setScrimState(value);
    AsyncStorage.setItem(SCRIM_KEY, String(value)).catch(() => {});
  }, []);

  return (
    <Ctx.Provider value={{ uri, scrim, busy, error, pick, useFile, clear, setScrim }}>
      {children}
    </Ctx.Provider>
  );
}

/** Wraps the choose button on the web so the tap lands on a real file input.
 *
 * Safari on iOS ignores a click that script fires at an input, which is the
 * whole reason the button did nothing on a phone. Putting the input itself
 * invisibly over the button means the finger opens the picker directly. */
export function WebFilePicker({ children }: { children: React.ReactNode }) {
  const { useFile } = useBackdrop();
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View>
      {children}
      {React.createElement('input', {
        type: 'file',
        accept: 'image/*',
        'aria-label': 'Choose a picture',
        onChange: (event: { target: { files?: FileList | null; value: string } }) => {
          const file = event.target.files?.[0];
          // Clear the value so choosing the same photo twice still fires.
          event.target.value = '';
          if (file) void useFile(file);
        },
        style: {
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          opacity: 0, cursor: 'pointer',
        },
      })}
    </View>
  );
}

export function useBackdrop() {
  return useContext(Ctx);
}
