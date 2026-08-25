// Data export, restore and erasure — GDPR articles 15, 17 and 20, and the
// in-app account deletion Apple requires.
//
// The export is deliberately one plain JSON file the person can read: their
// own data should not need our app to be legible. It includes the
// device-only cycle data, which exists nowhere else, so an export is also
// the only backup that data can ever have.
import { Platform } from 'react-native';
import { api } from './api';
import { cycleStore } from './cycle-store';
import { ExportBundle } from './types';

export async function buildExport(): Promise<ExportBundle> {
  const core = await api.exportAll();
  const [periods, entries] = await Promise.all([
    cycleStore.listPeriods().catch(() => []),
    cycleStore.listEntries().catch(() => []),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...core,
    ...(periods.length || entries.length ? { cycle: { periods, entries } } : {}),
  };
}

function fileName(): string {
  return `mark-export-${new Date().toISOString().slice(0, 10)}.json`;
}

/**
 * Hand the export to the person: a share sheet on a phone, a download in a
 * browser. Resolves to a short line describing what happened.
 */
export async function exportToFile(): Promise<string> {
  const bundle = await buildExport();
  const json = JSON.stringify(bundle, null, 2);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName();
    a.click();
    URL.revokeObjectURL(url);
    return 'Downloaded.';
  }

  const { File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
  const Sharing = require('expo-sharing') as typeof import('expo-sharing');
  const file = new File(Paths.cache, fileName());
  file.create({ overwrite: true });
  file.write(json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
    return 'Shared.';
  }
  return `Saved to ${file.uri}`;
}

function parseBundle(raw: string): ExportBundle {
  const parsed = JSON.parse(raw) as ExportBundle;
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.pillars)) {
    throw new Error('That file is not a MARK export.');
  }
  return parsed;
}

/** Read an export back — the other half of switching phones. */
export async function importFromFile(): Promise<string> {
  let raw: string;

  if (Platform.OS === 'web') {
    raw = await new Promise<string>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return reject(new Error('No file chosen.'));
        file.text().then(resolve, reject);
      };
      input.click();
    });
  } else {
    const DocumentPicker = require('expo-document-picker') as typeof import('expo-document-picker');
    const { File } = require('expo-file-system') as typeof import('expo-file-system');
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (picked.canceled || !picked.assets?.[0]) throw new Error('No file chosen.');
    raw = await new File(picked.assets[0].uri).text();
  }

  const bundle = parseBundle(raw);
  await api.importAll(bundle);
  if (bundle.cycle) await cycleStore.restore(bundle.cycle.periods, bundle.cycle.entries);
  const count = bundle.marks?.length ?? 0;
  return `Restored ${count} ${count === 1 ? 'mark' : 'marks'}.`;
}

/**
 * Erase everything, everywhere: the account and its rows, plus the
 * device-only cycle store. There is no undo, which is the point.
 */
export async function deleteEverything(): Promise<void> {
  await cycleStore.wipeAll();
  await api.deleteAccount();
}
