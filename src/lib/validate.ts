import { ExhibitionInput, VenueType } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/;

export interface ExhibitionFormValues {
  venueName: string;
  venueType: VenueType | null;
  title: string;
  artists: string;
  start: string;
  end: string;
  opening: string;
  description: string;
  imageUrl: string | null;
  contact: string;
}

/** Returns a validated ExhibitionInput, or a human-readable error string. */
export function buildInput(f: ExhibitionFormValues): ExhibitionInput | string {
  if (!f.venueName.trim()) return 'Venue name is required.';
  if (!f.venueType) return 'Choose museum or gallery.';
  if (!f.title.trim()) return 'Exhibition title is required.';
  if (!f.artists.trim()) return 'Artist name(s) are required.';
  if (!DATE_RE.test(f.start.trim())) return 'Start date must be YYYY-MM-DD.';
  if (!DATE_RE.test(f.end.trim())) return 'End date must be YYYY-MM-DD.';
  if (f.end.trim() < f.start.trim()) return 'End date is before start date.';
  const opening = f.opening.trim();
  if (opening && !DATETIME_RE.test(opening)) return 'Opening must be YYYY-MM-DD HH:MM.';
  return {
    venue_name: f.venueName.trim(),
    venue_type: f.venueType,
    title: f.title.trim(),
    artists: f.artists.trim(),
    start_date: f.start.trim(),
    end_date: f.end.trim(),
    opening_datetime: opening ? opening.replace(' ', 'T') : null,
    description: f.description.trim(),
    image_url: f.imageUrl,
    submitter_contact: f.contact.trim() || null,
  };
}
