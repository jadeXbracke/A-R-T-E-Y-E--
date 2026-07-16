import { Exhibition, Venue } from './types';

/**
 * Seed catalogue — 13 real Sydney exhibitions, July 2026.
 * Image note: venue press images could not be redistributed with the repo,
 * so each exhibition ships with a neutral bundled placeholder (see art.ts).
 * Swap in press images by setting image_url.
 */

export const SEED_VENUES: Venue[] = [
  { id: 'v-agnsw', name: 'Art Gallery of New South Wales', type: 'museum', address: 'Art Gallery Rd, The Domain', city: 'Sydney', owner_user_id: null },
  { id: 'v-mca', name: 'MCA Australia', type: 'museum', address: '140 George St, The Rocks', city: 'Sydney', owner_user_id: null },
  { id: 'v-oxley', name: 'Roslyn Oxley9 Gallery', type: 'gallery', address: '8 Soudan Ln, Paddington', city: 'Sydney', owner_user_id: null },
  { id: 'v-bird', name: 'Cassandra Bird', type: 'gallery', address: 'Paddington', city: 'Sydney', owner_user_id: null },
  { id: 'v-1301sw', name: '1301SW', type: 'gallery', address: 'Sydney', city: 'Sydney', owner_user_id: null },
  { id: 'v-yavuz', name: 'Ames Yavuz', type: 'gallery', address: 'Sydney', city: 'Sydney', owner_user_id: null },
  { id: 'v-olsen', name: 'OLSEN Annexe', type: 'gallery', address: 'Jersey Rd, Woollahra', city: 'Sydney', owner_user_id: null },
  { id: 'v-gcs', name: 'Grace Cossington Smith Gallery', type: 'gallery', address: 'Gate 7, 1666 Pacific Hwy, Wahroonga', city: 'Sydney', owner_user_id: null },
];

const base = {
  status: 'approved' as const,
  rejection_reason: null,
  city: 'Sydney',
  submitted_by: null,
  image_url: null,
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
    opening_datetime: null,
    description:
      'Australia’s most argued-over walls. The Archibald’s portraits, the Wynne’s landscapes and the Sulman’s subject pictures hang side by side — one century-old conversation about who we are, renewed for 2026.',
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
    opening_datetime: null,
    description:
      'The Superflat universe arrives in Sydney at full scale. Murakami’s smiling flowers, wrathful deities and mile-wide panoramas collapse four centuries of Japanese painting into a single, relentless present.',
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
    opening_datetime: null,
    description:
      'The MCA’s annual survey of artists aged 35 and under — the room where you meet the names everyone will claim to have known first. New commissions across painting, video, sculpture and sound.',
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
    opening_datetime: null,
    description:
      'Casts of the overlooked — candle stubs, foam offcuts, drink lids — remade with alchemical precision until the worthless becomes uncanny. A survey of one of Australia’s most quietly influential sculptors.',
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
    opening_datetime: null,
    description:
      'A landmark presentation of the Aotearoa painter whose images of Māori women — monumental, frontal, unapologetic — became icons of Indigenous self-determination across the Tasman.',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-nell',
    venue_id: 'v-mca',
    title: 'Nell: Sculpture Commission',
    artists: 'Nell',
    start_date: '2026-05-01',
    end_date: '2026-10-18',
    opening_datetime: null,
    description:
      'A new large-scale commission from Nell, whose practice moves between rock’n’roll, Buddhism and the smiley face without ever losing its nerve. On the MCA’s public-facing spaces through spring.',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-acw',
    venue_id: 'v-oxley',
    title: 'A Constructed World',
    artists: 'A Constructed World',
    start_date: '2026-06-26',
    end_date: '2026-07-18',
    opening_datetime: null,
    description:
      'The collaborative duo returns to Roslyn Oxley9 with work that treats the exhibition itself as a live, unstable proposition — painting, performance residue and text that refuses to explain itself.',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-bennett',
    venue_id: 'v-bird',
    title: 'Places of Delight',
    artists: 'Robby Bennett',
    start_date: '2026-07-03',
    end_date: '2026-07-25',
    opening_datetime: null,
    description:
      'Bennett’s gardens are remembered rather than observed — lush, slightly wrong, painted with the confidence of a place you can no longer return to. New paintings at Cassandra Bird.',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-gabori',
    venue_id: 'v-1301sw',
    title: 'Sally Gabori & Judy Ledgerwood',
    artists: 'Sally Gabori, Judy Ledgerwood',
    start_date: '2026-06-13',
    end_date: '2026-07-11',
    opening_datetime: null,
    description:
      'An improbable, exhilarating pairing: Gabori’s vast remembered geographies of Bentinck Island beside Ledgerwood’s chromatic American abstraction. Two painters, two continents, one argument about colour.',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-gesture',
    venue_id: 'v-yavuz',
    title: 'Infinite Gesture',
    artists: 'Group Exhibition',
    start_date: '2026-06-27',
    end_date: '2026-08-08',
    opening_datetime: null,
    description:
      'A group exhibition on the mark that keeps moving — gestural abstraction across generations and geographies, from calligraphic sweep to digital trace, at Ames Yavuz.',
    is_featured: false,
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
      'Crothers maps the systems beneath the visible — root, reef, network — in paintings that hover between diagram and dream. Opening night at the OLSEN Annexe, 22 July, 6–8pm.',
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
    opening_datetime: null,
    description:
      'Works that keep time — rhythm, repetition and the body’s tempo, gathered at the Grace Cossington Smith Gallery.',
    is_featured: false,
  },
  {
    ...base,
    id: 'e-abbotsleigh',
    venue_id: 'v-gcs',
    title: 'Abbotsleigh Biennial: Finalists',
    artists: 'Biennial Finalists',
    start_date: '2026-07-18',
    end_date: '2026-08-15',
    opening_datetime: '2026-07-18T14:00:00+10:00',
    description:
      'The finalists of the Abbotsleigh Biennial, hung salon-close at the Grace Cossington Smith Gallery. Opening Saturday 18 July at 2pm.',
    is_featured: false,
  },
];
