-- Seed: Sydney venues + the 13 real July 2026 exhibitions.
-- image_url uses "asset:<slug>" → the app renders its bundled neutral
-- placeholder; replace with venue press image URLs (or Storage URLs) as
-- they are cleared for use.

insert into venues (id, name, type, address, city, image_url) values
  ('00000000-0000-0000-0000-00000000000a', 'Art Gallery of New South Wales', 'museum', 'Art Gallery Road, The Domain, Sydney NSW 2000', 'Sydney', 'https://upload.wikimedia.org/wikipedia/commons/4/42/Art_Gallery_of_New_South_Wales.JPG'),
  ('00000000-0000-0000-0000-00000000000b', 'MCA Australia', 'museum', '140 George Street, The Rocks, Sydney NSW 2000', 'Sydney', 'https://upload.wikimedia.org/wikipedia/commons/f/f5/The_Museum_of_Contemporary_Art%2C_Sydney_%28former_MSB_Building%29.jpg'),
  ('00000000-0000-0000-0000-00000000000c', 'Roslyn Oxley9 Gallery', 'gallery', '8 Soudan Lane, Paddington NSW 2021', 'Sydney', null),
  ('00000000-0000-0000-0000-00000000000d', 'Cassandra Bird', 'gallery', '54 Kellett Street, Potts Point NSW 2011', 'Sydney', null),
  ('00000000-0000-0000-0000-00000000000e', '1301SW', 'gallery', '3 Hiles Street, Alexandria NSW 2015', 'Sydney', null),
  ('00000000-0000-0000-0000-00000000000f', 'Ames Yavuz', 'gallery', '114 Commonwealth Street, Surry Hills NSW 2010', 'Sydney', null),
  ('00000000-0000-0000-0000-000000000010', 'OLSEN Annexe', 'gallery', '74 Queen Street, Woollahra NSW 2025', 'Sydney', null),
  ('00000000-0000-0000-0000-000000000011', 'Grace Cossington Smith Gallery', 'gallery', 'Gate 7, 1666 Pacific Highway, Wahroonga NSW 2076', 'Sydney', null);

insert into exhibitions
  (venue_id, title, artists, start_date, end_date, opening_datetime, description, image_url, status, is_featured, city)
values
  ('00000000-0000-0000-0000-00000000000a', 'Archibald, Wynne & Sulman Prizes 2026', 'Finalists 2026',
   '2026-06-06', '2026-08-16', null,
   'Australia’s most argued-over walls. The Archibald’s portraits, the Wynne’s landscapes and the Sulman’s subject pictures hang side by side — a yearly census of who we are and how we want to be seen.',
   'asset:archibald', 'approved', true, 'Sydney'),

  ('00000000-0000-0000-0000-00000000000a', 'Takashi Murakami', 'Takashi Murakami',
   '2026-05-30', '2026-09-27', null,
   'The superflat universe at full scale — smiling flowers, silver screens and centuries of Japanese painting compressed into one relentless surface. Murakami’s first major Sydney survey.',
   'https://upload.wikimedia.org/wikipedia/commons/8/80/Takashi_Murakami_at_Versailles_Sept._2010_%281%29.jpg', 'approved', true, 'Sydney'),

  ('00000000-0000-0000-0000-00000000000b', 'Primavera 2026: Young Australian Artists', 'Young Australian Artists',
   '2026-07-03', '2026-09-20', null,
   'The MCA’s annual exhibition of Australian artists aged 35 and under — the clearest early signal of where Australian art is going next.',
   'asset:primavera', 'approved', true, 'Sydney'),

  ('00000000-0000-0000-0000-00000000000b', 'Hany Armanious', 'Hany Armanious',
   '2026-06-20', '2026-08-31', null,
   'Casts of the overlooked — foam, wax, candle stubs, offcuts — remade with such fidelity that the ordinary turns uncanny. A survey of one of Australia’s most quietly influential sculptors.',
   'asset:armanious', 'approved', false, 'Sydney'),

  ('00000000-0000-0000-0000-00000000000b', 'Robyn Kahukiwa', 'Robyn Kahukiwa',
   '2026-06-20', '2026-08-31', null,
   'Paintings that carry whakapapa like a current — the late Māori artist’s figures of women and ancestors, political and tender at once, gathered for Sydney audiences.',
   'asset:kahukiwa', 'approved', false, 'Sydney'),

  ('00000000-0000-0000-0000-00000000000b', 'Nell: Sculpture Commission', 'Nell',
   '2026-05-01', '2026-10-18', null,
   'A new commission by Nell — where rock’n’roll, Buddhism and the eucalypt meet. On the MCA’s public-facing spaces through spring.',
   'asset:nell', 'approved', false, 'Sydney'),

  ('00000000-0000-0000-0000-00000000000c', 'A Constructed World', 'A Constructed World',
   '2026-06-26', '2026-07-18', null,
   'The collaborative practice of Geoff Lowe and Jacqueline Riva — painting, performance and speech acts that keep meaning deliberately unstable.',
   'asset:constructed-world', 'approved', false, 'Sydney'),

  ('00000000-0000-0000-0000-00000000000d', 'Places of Delight', 'Robby Bennett',
   '2026-07-03', '2026-07-25', null,
   'New paintings by Robby Bennett — gardens, rooms and remembered places rendered as sites of pleasure and slight unease.',
   'asset:bennett', 'approved', false, 'Sydney'),

  ('00000000-0000-0000-0000-00000000000e', 'Sally Gabori & Judy Ledgerwood', 'Sally Gabori, Judy Ledgerwood',
   '2026-06-13', '2026-07-11', null,
   'Two painters of colour at scale, an ocean apart — Gabori’s Kaiadilt country in saturated fields beside Ledgerwood’s rhythmic Chicago abstraction.',
   'asset:gabori-ledgerwood', 'approved', false, 'Sydney'),

  ('00000000-0000-0000-0000-00000000000f', 'Infinite Gesture', 'Group Exhibition',
   '2026-06-27', '2026-08-08', null,
   'A group exhibition on the mark as a unit of thought — gesture repeated, extended and abstracted across painting and works on paper.',
   'asset:infinite-gesture', 'approved', false, 'Sydney'),

  ('00000000-0000-0000-0000-000000000010', 'Interconnected', 'Aaron Crothers',
   '2026-07-22', '2026-08-15', '2026-07-22T18:00:00+10:00',
   'Aaron Crothers maps the systems beneath landscape — geology, weather, root and network — in paintings that read like aerial diagrams of connection.',
   'asset:crothers', 'approved', false, 'Sydney'),

  ('00000000-0000-0000-0000-000000000011', 'Pulse', 'Group Exhibition',
   '2026-06-12', '2026-07-11', null,
   'Works that take rhythm as subject and method — repetition, beat and breath across media at the Grace Cossington Smith Gallery.',
   'asset:pulse', 'approved', false, 'Sydney'),

  ('00000000-0000-0000-0000-000000000011', 'Abbotsleigh Biennial: Finalists', 'Biennial Finalists',
   '2026-07-18', '2026-08-15', '2026-07-18T14:00:00+10:00',
   'Finalists of the Abbotsleigh Biennial — a cross-section of current practice selected for the gallery’s biennial exhibition and prize.',
   'asset:abbotsleigh', 'approved', false, 'Sydney');

-- After signing up in the app with jadebrack@gmail.com, promote to admin:
-- update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'jadebrack@gmail.com');
