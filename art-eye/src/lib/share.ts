import { Platform, Share } from 'react-native';

// The app's own address on GitHub Pages — deep links into it resolve via the
// 404.html fallback (see scripts/finish-pages.js), so a shared exhibition
// link opens straight to that show, not just the agenda root.
const APP_URL = 'https://jadexbracke.github.io/D-I-S-APP-/';

export async function shareExhibition(id: string, title: string, venueName?: string) {
  const url = `${APP_URL}exhibition/${id}`;
  const message = venueName ? `${title} at ${venueName} — on ART EYE` : `${title} — on ART EYE`;

  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> }) : null;
    if (nav?.share) {
      try {
        await nav.share({ title, text: message, url });
      } catch {
        // user cancelled the share sheet — not an error
      }
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${message}\n${url}`);
      if (typeof window !== 'undefined') window.alert('Link copied — paste it anywhere to invite someone.');
    }
    return;
  }

  await Share.share({ message: `${message}\n${url}`, url }).catch(() => {});
}
