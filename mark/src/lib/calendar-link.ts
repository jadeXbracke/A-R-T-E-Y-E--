// "Put it in your own calendar" — MARK deliberately has no agenda of its
// own. This opens a pre-filled event in the user's calendar (Google Calendar
// template URL, which iOS/Android/web all resolve to a calendar app).
import { Linking } from 'react-native';

export function addToOwnCalendar(title: string, minutes = 30): void {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0); // next full hour
  const end = new Date(start.getTime() + minutes * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + `&text=${encodeURIComponent(title)}`
    + `&dates=${fmt(start)}/${fmt(end)}`;
  Linking.openURL(url).catch(() => {});
}
