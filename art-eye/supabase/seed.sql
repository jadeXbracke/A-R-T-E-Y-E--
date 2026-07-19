-- ART EYE — seed: the eight venues and thirteen real Sydney exhibitions
-- of July 2026. Image URLs are left as neutral placeholders ("asset:<key>",
-- rendered from the app bundle); replace with venue press image URLs as they
-- are cleared for use.
--
-- The admin account: sign up in the app with jadebrack@gmail.com — the
-- handle_new_user trigger assigns the admin role automatically.

insert into public.venues (id, name, type, address, city) values
  ('00000000-0000-4000-8000-000000000001', 'Art Gallery of New South Wales', 'museum', 'Art Gallery Road, The Domain', 'Sydney'),
  ('00000000-0000-4000-8000-000000000002', 'MCA Australia', 'museum', '140 George Street, The Rocks', 'Sydney'),
  ('00000000-0000-4000-8000-000000000003', 'Roslyn Oxley9 Gallery', 'gallery', '8 Soudan Lane, Paddington', 'Sydney'),
  ('00000000-0000-4000-8000-000000000004', 'Cassandra Bird', 'gallery', 'Paddington', 'Sydney'),
  ('00000000-0000-4000-8000-000000000005', '1301SW', 'gallery', 'Sydney CBD', 'Sydney'),
  ('00000000-0000-4000-8000-000000000006', 'Ames Yavuz', 'gallery', 'Surry Hills', 'Sydney'),
  ('00000000-0000-4000-8000-000000000007', 'OLSEN Annexe', 'gallery', 'Queen Street, Woollahra', 'Sydney'),
  ('00000000-0000-4000-8000-000000000008', 'Grace Cossington Smith Gallery', 'gallery', 'Gate 7, 1666 Pacific Highway, Wahroonga', 'Sydney');

insert into public.exhibitions
  (venue_id, title, artists, start_date, end_date, opening_datetime, description, image_url, status, is_featured, city)
values
  ('00000000-0000-4000-8000-000000000001', 'Archibald, Wynne & Sulman Prizes 2026', 'Finalists 2026',
   '2026-06-06', '2026-08-16', null,
   'Australia’s most closely watched portrait prize returns alongside the Wynne and Sulman. A room-by-room census of who we are and how we want to be seen — painted, argued over, and loved in equal measure.',
   'asset:archibald', 'approved', true, 'Sydney'),

  ('00000000-0000-4000-8000-000000000001', 'Takashi Murakami', 'Takashi Murakami',
   '2026-05-30', '2026-09-27', null,
   'The Superflat universe arrives in Sydney at full scale — flowers, fear and five centuries of Japanese painting compressed into one relentless surface. Murakami’s first major Australian survey.',
   'asset:murakami', 'approved', true, 'Sydney'),

  ('00000000-0000-4000-8000-000000000002', 'Primavera 2026: Young Australian Artists', 'Young Australian Artists',
   '2026-07-03', '2026-09-20', null,
   'The MCA’s annual exhibition of Australian artists aged 35 and under — the clearest early sightline on where Australian art is going next.',
   'asset:primavera', 'approved', true, 'Sydney'),

  ('00000000-0000-4000-8000-000000000002', 'Hany Armanious', 'Hany Armanious',
   '2026-06-20', '2026-08-31', null,
   'Casts of the overlooked — bottle caps, candle stubs, offcuts — remade with alchemical patience until the throwaway becomes votive. A survey of one of Australia’s most quietly influential sculptors.',
   'asset:armanious', 'approved', false, 'Sydney'),

  ('00000000-0000-4000-8000-000000000002', 'Robyn Kahukiwa', 'Robyn Kahukiwa',
   '2026-06-20', '2026-08-31', null,
   'Paintings of mana wahine — Māori women rendered monumental, political and tender. A focused presentation of the late Aotearoa painter’s unmistakable figuration.',
   'asset:kahukiwa', 'approved', false, 'Sydney'),

  ('00000000-0000-4000-8000-000000000002', 'Sculpture Commission: Nell', 'Nell',
   '2026-05-01', '2026-10-18', null,
   'A new large-scale commission by Nell for the MCA — rock’n’roll and ritual, lightning bolts and ghosts, holding the harbour front like a talisman.',
   'asset:nell', 'approved', false, 'Sydney'),

  ('00000000-0000-4000-8000-000000000003', 'A Constructed World', 'A Constructed World',
   '2026-06-26', '2026-07-18', null,
   'The collaborative practice of Geoff Lowe and Jacqueline Riva — painting, performance and conversation folded into one another, sceptical of art and devoted to it at once.',
   'asset:constructed-world', 'approved', false, 'Sydney'),

  ('00000000-0000-4000-8000-000000000004', 'Places of Delight', 'Robby Bennett',
   '2026-07-03', '2026-07-25', null,
   'New paintings by Robby Bennett — landscapes remembered rather than observed, where pleasure is taken seriously as a subject.',
   'asset:places-of-delight', 'approved', false, 'Sydney'),

  ('00000000-0000-4000-8000-000000000005', 'Sally Gabori & Judy Ledgerwood', 'Mirdidingkingathi Juwarnda Sally Gabori, Judy Ledgerwood',
   '2026-06-13', '2026-07-11', null,
   'Two painters of colour at scale, a continent and a generation apart — Gabori’s Bentinck Island country beside Ledgerwood’s American chromatic abstraction.',
   'asset:gabori-ledgerwood', 'approved', false, 'Sydney'),

  ('00000000-0000-4000-8000-000000000006', 'Infinite Gesture', 'Group Exhibition',
   '2026-06-27', '2026-08-08', null,
   'A group exhibition on the mark that keeps moving — gesture as inheritance, repetition and release across painting and works on paper.',
   'asset:infinite-gesture', 'approved', false, 'Sydney'),

  ('00000000-0000-4000-8000-000000000007', 'Interconnected', 'Aaron Crothers',
   '2026-07-22', '2026-08-15', '2026-07-22 18:00:00+10',
   'Aaron Crothers maps the systems beneath landscape — geology, weather, memory — in paintings that read like cross-sections of time. Opening night Wednesday 22 July, 6–8pm.',
   'asset:interconnected', 'approved', false, 'Sydney'),

  ('00000000-0000-4000-8000-000000000008', 'Pulse', 'Group Exhibition',
   '2026-06-12', '2026-07-11', null,
   'Works that take rhythm as their organising principle — the beat of the body, the tide and the city, held in paint, print and thread.',
   'asset:pulse', 'approved', false, 'Sydney'),

  ('00000000-0000-4000-8000-000000000008', 'Abbotsleigh Biennial Finalists', 'Biennial Finalists',
   '2026-07-18', '2026-08-15', '2026-07-18 14:00:00+10',
   'Finalists of the Abbotsleigh Biennial — a cross-section of current Australian practice selected for the school’s public gallery. Opens Saturday 18 July, 2pm.',
   'asset:abbotsleigh', 'approved', false, 'Sydney');
