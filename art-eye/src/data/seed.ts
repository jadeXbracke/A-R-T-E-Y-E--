import type { Exhibition, Venue } from '../types';

/**
 * The thirteen real Sydney exhibitions of July 2026 that seed the agenda,
 * mirrored in supabase/seed.sql. Image URLs use bundled neutral placeholders
 * ("asset:<key>") — swap in venue press image URLs as they are cleared.
 */

export const SEED_VENUES: Venue[] = [
  { id: 'v-agnsw', name: 'Art Gallery of New South Wales', type: 'museum', address: 'Art Gallery Road, The Domain', city: 'Sydney', owner_user_id: null },
  { id: 'v-mca', name: 'MCA Australia', type: 'museum', address: '140 George Street, The Rocks', city: 'Sydney', owner_user_id: null },
  { id: 'v-roslyn-oxley9', name: 'Roslyn Oxley9 Gallery', type: 'gallery', address: '8 Soudan Lane, Paddington', city: 'Sydney', owner_user_id: null },
  { id: 'v-cassandra-bird', name: 'Cassandra Bird', type: 'gallery', address: 'Paddington', city: 'Sydney', owner_user_id: null },
  { id: 'v-1301sw', name: '1301SW', type: 'gallery', address: 'Sydney CBD', city: 'Sydney', owner_user_id: null },
  { id: 'v-ames-yavuz', name: 'Ames Yavuz', type: 'gallery', address: 'Surry Hills', city: 'Sydney', owner_user_id: null },
  { id: 'v-olsen-annexe', name: 'OLSEN Annexe', type: 'gallery', address: 'Queen Street, Woollahra', city: 'Sydney', owner_user_id: null },
  { id: 'v-gcs', name: 'Grace Cossington Smith Gallery', type: 'gallery', address: 'Gate 7, 1666 Pacific Highway, Wahroonga', city: 'Sydney', owner_user_id: null },
];

const base = {
  status: 'approved' as const,
  rejection_reason: null,
  city: 'Sydney',
  submitted_by: null,
  opening_datetime: null as string | null,
};

export const SEED_EXHIBITIONS: Exhibition[] = [
  {
    ...base,
    id: 'e-archibald',
    venue_id: 'v-agnsw',
    title: 'Archibald, Wynne & Sulman Prizes 2026',
    artists: 'Finalists 2026',
    start_date: '2026-06-06',
    end_date: '2026-08-16',
    description:
      'Australia’s most closely watched portrait prize returns alongside the Wynne and Sulman. A room-by-room census of who we are and how we want to be seen — painted, argued over, and loved in equal measure.',
    image_url: 'asset:archibald',
    is_featured: true,
  },
  {
    ...base,
    id: 'e-murakami',
    venue_id: 'v-agnsw',
    title: 'Takashi Murakami',
    artists: 'Takashi Murakami',
    start_date: '2026-05-30',
    end_date: '2026-09-27',
    description:
      'The Superflat universe arrives in Sydney at full scale — flowers, fear and five centuries of Japanese painting compressed into one relentless surface. Murakami’s first major Australian survey.',
    image_url: 'asset:murakami',
    is_featured: true,
  },
  {
    ...base,
    id: 'e-primavera',
    venue_id: 'v-mca',
    title: 'Primavera 2026: Young Australian Artists',
    artists: 'Young Australian Artists',
    start_date: '2026-07-03',
    end_date: '2026-09-20',
    description:
      'The MCA’s annual exhibition of Australian artists aged 35 and under — the clearest early sightline on where Australian art is going next.',
    image_url: 'asset:primavera',
    is_featured: true,
  },
  {
    ...base,
    id: 'e-armanious',
    venue_id: 'v-mca',
    title: 'Hany Armanious',
    artists: 'Hany Armanious',
    start_date: '2026-06-20',
    end_date: '2026-08-31',
    description:
      'Casts of the overlooked — bottle caps, candle stubs, offcuts — remade with alchemical patience until the throwaway becomes votive. A survey of one of Australia’s most quietly influential sculptors.',
    image_url: 'asset:armanious',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-kahukiwa',
    venue_id: 'v-mca',
    title: 'Robyn Kahukiwa',
    artists: 'Robyn Kahukiwa',
    start_date: '2026-06-20',
    end_date: '2026-08-31',
    description:
      'Paintings of mana wahine — Māori women rendered monumental, political and tender. A focused presentation of the late Aotearoa painter’s unmistakable figuration.',
    image_url: 'asset:kahukiwa',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-nell',
    venue_id: 'v-mca',
    title: 'Sculpture Commission: Nell',
    artists: 'Nell',
    start_date: '2026-05-01',
    end_date: '2026-10-18',
    description:
      'A new large-scale commission by Nell for the MCA — rock’n’roll and ritual, lightning bolts and ghosts, holding the harbour front like a talisman.',
    image_url: 'asset:nell',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-constructed-world',
    venue_id: 'v-roslyn-oxley9',
    title: 'A Constructed World',
    artists: 'A Constructed World',
    start_date: '2026-06-26',
    end_date: '2026-07-18',
    description:
      'The collaborative practice of Geoff Lowe and Jacqueline Riva — painting, performance and conversation folded into one another, sceptical of art and devoted to it at once.',
    image_url: 'asset:constructed-world',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-places-of-delight',
    venue_id: 'v-cassandra-bird',
    title: 'Places of Delight',
    artists: 'Robby Bennett',
    start_date: '2026-07-03',
    end_date: '2026-07-25',
    description:
      'New paintings by Robby Bennett — landscapes remembered rather than observed, where pleasure is taken seriously as a subject.',
    image_url: 'asset:places-of-delight',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-gabori-ledgerwood',
    venue_id: 'v-1301sw',
    title: 'Sally Gabori & Judy Ledgerwood',
    artists: 'Mirdidingkingathi Juwarnda Sally Gabori, Judy Ledgerwood',
    start_date: '2026-06-13',
    end_date: '2026-07-11',
    description:
      'Two painters of colour at scale, a continent and a generation apart — Gabori’s Bentinck Island country beside Ledgerwood’s American chromatic abstraction.',
    image_url: 'asset:gabori-ledgerwood',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-infinite-gesture',
    venue_id: 'v-ames-yavuz',
    title: 'Infinite Gesture',
    artists: 'Group Exhibition',
    start_date: '2026-06-27',
    end_date: '2026-08-08',
    description:
      'A group exhibition on the mark that keeps moving — gesture as inheritance, repetition and release across painting and works on paper.',
    image_url: 'asset:infinite-gesture',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-interconnected',
    venue_id: 'v-olsen-annexe',
    title: 'Interconnected',
    artists: 'Aaron Crothers',
    start_date: '2026-07-22',
    end_date: '2026-08-15',
    opening_datetime: '2026-07-22T18:00:00+10:00',
    description:
      'Aaron Crothers maps the systems beneath landscape — geology, weather, memory — in paintings that read like cross-sections of time. Opening night Wednesday 22 July, 6–8pm.',
    image_url: 'asset:interconnected',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-pulse',
    venue_id: 'v-gcs',
    title: 'Pulse',
    artists: 'Group Exhibition',
    start_date: '2026-06-12',
    end_date: '2026-07-11',
    description:
      'Works that take rhythm as their organising principle — the beat of the body, the tide and the city, held in paint, print and thread.',
    image_url: 'asset:pulse',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-abbotsleigh',
    venue_id: 'v-gcs',
    title: 'Abbotsleigh Biennial Finalists',
    artists: 'Biennial Finalists',
    start_date: '2026-07-18',
    end_date: '2026-08-15',
    opening_datetime: '2026-07-18T14:00:00+10:00',
    description:
      'Finalists of the Abbotsleigh Biennial — a cross-section of current Australian practice selected for the school’s public gallery. Opens Saturday 18 July, 2pm.',
    image_url: 'asset:abbotsleigh',
    is_featured: false,
  },
];

/** Signing up with this address makes the account an admin (mirrors seed.sql). */
export const ADMIN_EMAIL = 'jadebrack@gmail.com';
