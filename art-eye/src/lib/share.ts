// Native share sheet helpers. Links point at the published web app so a
// recipient without the app still lands somewhere that works.
import { Share } from 'react-native';
import { Exhibition, FeedItem } from './types';

const WEB_BASE = 'https://jadexbracke.github.io/D-I-S-APP-';

export async function shareExhibition(e: Exhibition): Promise<void> {
  const line = `${e.artists} — ${e.title}${e.venue ? ` at ${e.venue.name}` : ''}`;
  const url = `${WEB_BASE}/exhibition/${e.id}`;
  try {
    // iOS takes url separately; Android wants it inside the message.
    await Share.share({ message: `${line} · seen on ARTEYE\n${url}`, url });
  } catch {
    // user dismissed the sheet — nothing to do
  }
}

export async function sharePost(item: FeedItem): Promise<void> {
  const line = `${item.display_name} saw ${item.exhibition_title}${item.venue_name ? ` at ${item.venue_name}` : ''}`;
  const url = `${WEB_BASE}/post/${item.user_id}/${item.exhibition_id}`;
  try {
    await Share.share({ message: `${line} · on ARTEYE\n${url}`, url });
  } catch {
    // user dismissed the sheet — nothing to do
  }
}
