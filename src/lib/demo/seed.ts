import type { Exhibition, Venue } from '../types';

/**
 * Demo-mode dataset — a TypeScript mirror of supabase/seed.sql, so the app
 * is fully demoable before a Supabase project is connected.
 */

const V = (n: number) => `10000000-0000-4000-8000-00000000000${n}`;
const E = (n: number) =>
  `20000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`;

export const SEED_VENUES: Venue[] = [
  { id: V(1), name: 'Art Gallery of New South Wales', type: 'museum', address: 'Art Gallery Road, The Domain', city: 'Sydney' },
  { id: V(2), name: 'MCA Australia', type: 'museum', address: '140 George Street, The Rocks', city: 'Sydney' },
  { id: V(3), name: 'Roslyn Oxley9 Gallery', type: 'gallery', address: '8 Soudan Lane, Paddington', city: 'Sydney' },
  { id: V(4), name: 'Cassandra Bird', type: 'gallery', address: null, city: 'Sydney' },
  { id: V(5), name: '1301SW', type: 'gallery', address: null, city: 'Sydney' },
  { id: V(6), name: 'Ames Yavuz', type: 'gallery', address: null, city: 'Sydney' },
  { id: V(7), name: 'OLSEN Annexe', type: 'gallery', address: 'Woollahra', city: 'Sydney' },
  { id: V(8), name: 'Grace Cossington Smith Gallery', type: 'gallery', address: 'Gate 7, 1666 Pacific Highway, Wahroonga', city: 'Sydney' },
];

const img = (seed: string) => `https://picsum.photos/seed/arteye-${seed}/1200/1500`;

const base = {
  status: 'approved' as const,
  rejection_reason: null,
  city: 'Sydney',
  opening_datetime: null,
};

export const SEED_EXHIBITIONS: Exhibition[] = [
  {
    ...base, id: E(1), venue_id: V(1), is_featured: true,
    title: 'Archibald, Wynne & Sulman Prizes 2026', artists: 'Finalists 2026',
    start_date: '2026-06-06', end_date: '2026-08-16',
    description:
      "Australia's most argued-over portraits return, alongside the Wynne landscapes and the Sulman's wilder tangents. Go for the faces you recognise; stay for the ones you don't.",
    image_url: img('archibald'),
  },
  {
    ...base, id: E(2), venue_id: V(1), is_featured: true,
    title: 'Takashi Murakami', artists: 'Takashi Murakami',
    start_date: '2026-05-30', end_date: '2026-09-27',
    description:
      'The Superflat universe at full scale — smiling flowers, karakuri ghosts and centuries of Japanese painting compressed into one relentless, saturated present.',
    image_url: img('murakami'),
  },
  {
    ...base, id: E(3), venue_id: V(2), is_featured: true,
    title: 'Primavera 2026: Young Australian Artists', artists: 'Group exhibition',
    start_date: '2026-07-03', end_date: '2026-09-20',
    description:
      "The MCA's annual survey of Australian artists 35 and under — the first place many of the next decade's names will be seen together.",
    image_url: img('primavera'),
  },
  {
    ...base, id: E(4), venue_id: V(2), is_featured: false,
    title: 'Hany Armanious', artists: 'Hany Armanious',
    start_date: '2026-06-20', end_date: '2026-08-31',
    description:
      "Cast objects that impersonate the ordinary so precisely they become uncanny — a survey of Armanious's decades-long sleight of hand.",
    image_url: img('armanious'),
  },
  {
    ...base, id: E(5), venue_id: V(2), is_featured: false,
    title: 'Robyn Kahukiwa', artists: 'Robyn Kahukiwa',
    start_date: '2026-06-20', end_date: '2026-08-31',
    description:
      'A landmark presentation of the Māori painter and activist, whose figures carry whakapapa, protest and tenderness in equal measure.',
    image_url: img('kahukiwa'),
  },
  {
    ...base, id: E(6), venue_id: V(2), is_featured: false,
    title: 'Nell: sculpture commission', artists: 'Nell',
    start_date: '2026-05-01', end_date: '2026-10-18',
    description:
      "A new large-scale commission by Nell for the MCA — rock'n'roll, ritual and the smiley face meeting somewhere on the harbour's edge.",
    image_url: img('nell'),
  },
  {
    ...base, id: E(7), venue_id: V(3), is_featured: false,
    title: 'A Constructed World', artists: 'A Constructed World',
    start_date: '2026-06-26', end_date: '2026-07-18',
    description:
      'The collaborative duo returns to Roslyn Oxley9 with work that keeps meaning deliberately in motion — speech, eels, and the problem of an audience.',
    image_url: img('acw'),
  },
  {
    ...base, id: E(8), venue_id: V(4), is_featured: false,
    title: 'Places of Delight', artists: 'Robby Bennett',
    start_date: '2026-07-03', end_date: '2026-07-25',
    description:
      "Bennett's new paintings chase the small, specific pleasures of place — gardens, rooms and remembered light.",
    image_url: img('bennett'),
  },
  {
    ...base, id: E(9), venue_id: V(5), is_featured: false,
    title: 'Sally Gabori & Judy Ledgerwood', artists: 'Sally Gabori, Judy Ledgerwood',
    start_date: '2026-06-13', end_date: '2026-07-11',
    description:
      "Two painters of colour at scale, generations and hemispheres apart — Gabori's Kaiadilt country beside Ledgerwood's chromatic abstraction.",
    image_url: img('gabori'),
  },
  {
    ...base, id: E(10), venue_id: V(6), is_featured: false,
    title: 'Infinite Gesture', artists: 'Group exhibition',
    start_date: '2026-06-27', end_date: '2026-08-08',
    description:
      'A group show on the mark that keeps going — gesture as record, repetition and release across painting and performance.',
    image_url: img('gesture'),
  },
  {
    ...base, id: E(11), venue_id: V(7), is_featured: false,
    title: 'Interconnected', artists: 'Aaron Crothers',
    start_date: '2026-07-22', end_date: '2026-08-15',
    opening_datetime: '2026-07-22T18:00:00+10:00',
    description:
      "Crothers' new body of work traces the systems that hold landscape together — and what happens when one thread is pulled.",
    image_url: img('crothers'),
  },
  {
    ...base, id: E(12), venue_id: V(8), is_featured: false,
    title: 'Pulse', artists: 'Group exhibition',
    start_date: '2026-06-12', end_date: '2026-07-11',
    description:
      "Works that take a heartbeat as their measure — rhythm, breath and the body's quiet timekeeping.",
    image_url: img('pulse'),
  },
  {
    ...base, id: E(13), venue_id: V(8), is_featured: false,
    title: 'Abbotsleigh Biennial: Finalists', artists: 'Finalists 2026',
    start_date: '2026-07-18', end_date: '2026-08-15',
    opening_datetime: '2026-07-18T14:00:00+10:00',
    description:
      "The biennial prize's finalist exhibition — a cross-section of current Australian practice hung in Wahroonga.",
    image_url: img('biennial'),
  },
];
