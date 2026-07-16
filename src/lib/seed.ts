import { Exhibition, Venue } from './types';

/**
 * The 13 real Sydney exhibitions, July 2026.
 * `image_url: null` renders the neutral tonal plate — swap in real venue
 * press images by setting the URL here and in supabase/seed.sql.
 */

export const SEED_VENUES: Venue[] = [
  { id: 'v-agnsw', name: 'Art Gallery of New South Wales', type: 'museum', address: 'Art Gallery Road, The Domain', city: 'Sydney', owner_user_id: null },
  { id: 'v-mca', name: 'MCA Australia', type: 'museum', address: '140 George Street, The Rocks', city: 'Sydney', owner_user_id: null },
  { id: 'v-oxley', name: 'Roslyn Oxley9 Gallery', type: 'gallery', address: '8 Soudan Lane, Paddington', city: 'Sydney', owner_user_id: null },
  { id: 'v-bird', name: 'Cassandra Bird', type: 'gallery', address: 'Paddington', city: 'Sydney', owner_user_id: null },
  { id: 'v-1301sw', name: '1301SW', type: 'gallery', address: 'Paddington', city: 'Sydney', owner_user_id: null },
  { id: 'v-yavuz', name: 'Ames Yavuz', type: 'gallery', address: 'Surry Hills', city: 'Sydney', owner_user_id: null },
  { id: 'v-olsen', name: 'OLSEN Annexe', type: 'gallery', address: '74 Queen Street, Woollahra', city: 'Sydney', owner_user_id: null },
  { id: 'v-gcs', name: 'Grace Cossington Smith Gallery', type: 'gallery', address: '1666 Pacific Highway, Wahroonga', city: 'Sydney', owner_user_id: null },
];

const base = {
  opening_datetime: null as string | null,
  image_url: null as string | null,
  status: 'approved' as const,
  rejection_reason: null,
  is_featured: false,
  city: 'Sydney',
  submitted_by: null,
  submitter_contact: null,
};

export const SEED_EXHIBITIONS: Exhibition[] = [
  {
    ...base,
    id: 'e-archibald',
    venue_id: 'v-agnsw',
    title: 'Archibald, Wynne & Sulman Prizes 2026',
    artists: 'The 2026 finalists',
    start_date: '2026-06-06',
    end_date: '2026-08-16',
    description:
      'The country sits for its portrait. The Archibald, alongside the Wynne landscape and Sulman genre prizes, remains the exhibition Sydney argues about over dinner — and the argument is the point.',
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
      'Murakami’s first major Sydney survey moves from nihonga discipline to superflat delirium — flowers, skulls and screens at a scale that makes the gallery feel briefly weightless.',
    is_featured: true,
  },
  {
    ...base,
    id: 'e-primavera',
    venue_id: 'v-mca',
    title: 'Primavera 2026',
    artists: 'Young Australian artists',
    start_date: '2026-07-03',
    end_date: '2026-09-20',
    description:
      'The MCA’s annual exhibition of Australian artists aged 35 and under — the room where you meet the names you will be following for the next decade.',
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
      'Armanious casts the overlooked — foam, wax, bottle tops — into sculptures of uncanny fidelity, until you stop trusting your own eye. A survey of quiet, exact illusions.',
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
      'A landmark presentation of the Māori artist’s figurative paintings — ancestral presence, motherhood and sovereignty carried in saturated colour.',
  },
  {
    ...base,
    id: 'e-nell',
    venue_id: 'v-mca',
    title: 'Sculpture commission',
    artists: 'Nell',
    start_date: '2026-05-01',
    end_date: '2026-10-18',
    description:
      'Nell’s new commission holds the MCA’s public space through spring — part talisman, part grin, entirely hers.',
  },
  {
    ...base,
    id: 'e-acw',
    venue_id: 'v-oxley',
    title: 'A Constructed World',
    artists: 'A Constructed World',
    start_date: '2026-06-26',
    end_date: '2026-07-18',
    description:
      'The collaborative duo return to Roslyn Oxley9 with work that treats the exhibition itself as a live proposition — speech, eels and the problem of an audience.',
  },
  {
    ...base,
    id: 'e-bennett',
    venue_id: 'v-bird',
    title: 'Places of Delight',
    artists: 'Robby Bennett',
    start_date: '2026-07-03',
    end_date: '2026-07-25',
    description:
      'Bennett’s new paintings map pleasure as geography — gardens, interiors and remembered rooms rendered with a colourist’s appetite.',
  },
  {
    ...base,
    id: 'e-gabori',
    venue_id: 'v-1301sw',
    title: 'Sally Gabori & Judy Ledgerwood',
    artists: 'Sally Gabori & Judy Ledgerwood',
    start_date: '2026-06-13',
    end_date: '2026-07-11',
    description:
      'A cross-generational pairing: Gabori’s vast Kaiadilt country in colour beside Ledgerwood’s American chromatic abstraction. Two painters, one conviction about what colour can carry.',
  },
  {
    ...base,
    id: 'e-gesture',
    venue_id: 'v-yavuz',
    title: 'Infinite Gesture',
    artists: 'Group exhibition',
    start_date: '2026-06-27',
    end_date: '2026-08-08',
    description:
      'A group exhibition on the mark as inheritance — gesture passed between hands, generations and geographies across the Asia-Pacific.',
  },
  {
    ...base,
    id: 'e-crothers',
    venue_id: 'v-olsen',
    title: 'Interconnected',
    artists: 'Aaron Crothers',
    start_date: '2026-07-22',
    end_date: '2026-08-15',
    opening_datetime: '2026-07-22T18:00:00+10:00',
    description:
      'Crothers’ new body of work traces the systems beneath landscape — root, current, signal — in paintings that read as diagrams of belonging.',
  },
  {
    ...base,
    id: 'e-pulse',
    venue_id: 'v-gcs',
    title: 'Pulse',
    artists: 'Group exhibition',
    start_date: '2026-06-12',
    end_date: '2026-07-11',
    description:
      'A group exhibition taking rhythm as its measure — repetition, breath and beat across painting, textile and video.',
  },
  {
    ...base,
    id: 'e-biennial',
    venue_id: 'v-gcs',
    title: 'Abbotsleigh Biennial — Finalists',
    artists: 'The finalists',
    start_date: '2026-07-18',
    end_date: '2026-08-15',
    opening_datetime: '2026-07-18T14:00:00+10:00',
    description:
      'The finalists of the Abbotsleigh Biennial hang together for the first time — a reading of where Australian art practice sits right now, judged in public.',
  },
];
