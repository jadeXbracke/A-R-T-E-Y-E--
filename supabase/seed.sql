-- ART EYE — seed: 13 real Sydney exhibitions, July 2026.
-- Image URLs are neutral editorial placeholders (stable, hotlink-safe).
-- Swap in venue press images by updating image_url per row — the app renders
-- whatever URL is present.

-- Venues -------------------------------------------------------------------
insert into public.venues (id, name, type, address, city) values
  ('10000000-0000-4000-8000-000000000001', 'Art Gallery of New South Wales', 'museum', 'Art Gallery Road, The Domain', 'Sydney'),
  ('10000000-0000-4000-8000-000000000002', 'MCA Australia', 'museum', '140 George Street, The Rocks', 'Sydney'),
  ('10000000-0000-4000-8000-000000000003', 'Roslyn Oxley9 Gallery', 'gallery', '8 Soudan Lane, Paddington', 'Sydney'),
  ('10000000-0000-4000-8000-000000000004', 'Cassandra Bird', 'gallery', null, 'Sydney'),
  ('10000000-0000-4000-8000-000000000005', '1301SW', 'gallery', null, 'Sydney'),
  ('10000000-0000-4000-8000-000000000006', 'Ames Yavuz', 'gallery', null, 'Sydney'),
  ('10000000-0000-4000-8000-000000000007', 'OLSEN Annexe', 'gallery', 'Woollahra', 'Sydney'),
  ('10000000-0000-4000-8000-000000000008', 'Grace Cossington Smith Gallery', 'gallery', 'Gate 7, 1666 Pacific Highway, Wahroonga', 'Sydney');

-- Exhibitions ----------------------------------------------------------------
insert into public.exhibitions
  (id, venue_id, title, artists, start_date, end_date, opening_datetime,
   description, image_url, status, is_featured, city)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'Archibald, Wynne & Sulman Prizes 2026', 'Finalists 2026',
   '2026-06-06', '2026-08-16', null,
   'Australia''s most argued-over portraits return, alongside the Wynne landscapes and the Sulman''s wilder tangents. Go for the faces you recognise; stay for the ones you don''t.',
   'https://picsum.photos/seed/arteye-archibald/1200/1500', 'approved', true, 'Sydney'),

  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001',
   'Takashi Murakami', 'Takashi Murakami',
   '2026-05-30', '2026-09-27', null,
   'The Superflat universe at full scale — smiling flowers, karakuri ghosts and centuries of Japanese painting compressed into one relentless, saturated present.',
   'https://picsum.photos/seed/arteye-murakami/1200/1500', 'approved', true, 'Sydney'),

  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002',
   'Primavera 2026: Young Australian Artists', 'Group exhibition',
   '2026-07-03', '2026-09-20', null,
   'The MCA''s annual survey of Australian artists 35 and under — the first place many of the next decade''s names will be seen together.',
   'https://picsum.photos/seed/arteye-primavera/1200/1500', 'approved', true, 'Sydney'),

  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002',
   'Hany Armanious', 'Hany Armanious',
   '2026-06-20', '2026-08-31', null,
   'Cast objects that impersonate the ordinary so precisely they become uncanny — a survey of Armanious''s decades-long sleight of hand.',
   'https://picsum.photos/seed/arteye-armanious/1200/1500', 'approved', false, 'Sydney'),

  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002',
   'Robyn Kahukiwa', 'Robyn Kahukiwa',
   '2026-06-20', '2026-08-31', null,
   'A landmark presentation of the Māori painter and activist, whose figures carry whakapapa, protest and tenderness in equal measure.',
   'https://picsum.photos/seed/arteye-kahukiwa/1200/1500', 'approved', false, 'Sydney'),

  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002',
   'Nell: sculpture commission', 'Nell',
   '2026-05-01', '2026-10-18', null,
   'A new large-scale commission by Nell for the MCA — rock''n''roll, ritual and the smiley face meeting somewhere on the harbour''s edge.',
   'https://picsum.photos/seed/arteye-nell/1200/1500', 'approved', false, 'Sydney'),

  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003',
   'A Constructed World', 'A Constructed World',
   '2026-06-26', '2026-07-18', null,
   'The collaborative duo returns to Roslyn Oxley9 with work that keeps meaning deliberately in motion — speech, eels, and the problem of an audience.',
   'https://picsum.photos/seed/arteye-acw/1200/1500', 'approved', false, 'Sydney'),

  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000004',
   'Places of Delight', 'Robby Bennett',
   '2026-07-03', '2026-07-25', null,
   'Bennett''s new paintings chase the small, specific pleasures of place — gardens, rooms and remembered light.',
   'https://picsum.photos/seed/arteye-bennett/1200/1500', 'approved', false, 'Sydney'),

  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000005',
   'Sally Gabori & Judy Ledgerwood', 'Sally Gabori, Judy Ledgerwood',
   '2026-06-13', '2026-07-11', null,
   'Two painters of colour at scale, generations and hemispheres apart — Gabori''s Kaiadilt country beside Ledgerwood''s chromatic abstraction.',
   'https://picsum.photos/seed/arteye-gabori/1200/1500', 'approved', false, 'Sydney'),

  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000006',
   'Infinite Gesture', 'Group exhibition',
   '2026-06-27', '2026-08-08', null,
   'A group show on the mark that keeps going — gesture as record, repetition and release across painting and performance.',
   'https://picsum.photos/seed/arteye-gesture/1200/1500', 'approved', false, 'Sydney'),

  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000007',
   'Interconnected', 'Aaron Crothers',
   '2026-07-22', '2026-08-15', '2026-07-22 18:00:00+10',
   'Crothers'' new body of work traces the systems that hold landscape together — and what happens when one thread is pulled.',
   'https://picsum.photos/seed/arteye-crothers/1200/1500', 'approved', false, 'Sydney'),

  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000008',
   'Pulse', 'Group exhibition',
   '2026-06-12', '2026-07-11', null,
   'Works that take a heartbeat as their measure — rhythm, breath and the body''s quiet timekeeping.',
   'https://picsum.photos/seed/arteye-pulse/1200/1500', 'approved', false, 'Sydney'),

  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000008',
   'Abbotsleigh Biennial: Finalists', 'Finalists 2026',
   '2026-07-18', '2026-08-15', '2026-07-18 14:00:00+10',
   'The biennial prize''s finalist exhibition — a cross-section of current Australian practice hung in Wahroonga.',
   'https://picsum.photos/seed/arteye-biennial/1200/1500', 'approved', false, 'Sydney');

-- Admin ----------------------------------------------------------------------
-- jadebrack@gmail.com is promoted to admin automatically at signup by
-- public.handle_new_user() (see 0001_init.sql). If the account already
-- exists, run:
--   update public.users set role = 'admin'
--   where id = (select id from auth.users where email = 'jadebrack@gmail.com');
