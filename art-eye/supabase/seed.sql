-- ART EYE — seed: 13 real Sydney exhibitions, July 2026.
-- image_url is left null (venue press images to be dropped in by hand);
-- the app renders a neutral bundled placeholder when image_url is null.

with v as (
  insert into public.venues (id, name, type, address, city) values
    ('00000000-0000-4000-8000-000000000001', 'Art Gallery of New South Wales', 'museum', 'Art Gallery Rd, The Domain', 'Sydney'),
    ('00000000-0000-4000-8000-000000000002', 'MCA Australia', 'museum', '140 George St, The Rocks', 'Sydney'),
    ('00000000-0000-4000-8000-000000000003', 'Roslyn Oxley9 Gallery', 'gallery', '8 Soudan Ln, Paddington', 'Sydney'),
    ('00000000-0000-4000-8000-000000000004', 'Cassandra Bird', 'gallery', 'Paddington', 'Sydney'),
    ('00000000-0000-4000-8000-000000000005', '1301SW', 'gallery', 'Sydney', 'Sydney'),
    ('00000000-0000-4000-8000-000000000006', 'Ames Yavuz', 'gallery', 'Sydney', 'Sydney'),
    ('00000000-0000-4000-8000-000000000007', 'OLSEN Annexe', 'gallery', 'Jersey Rd, Woollahra', 'Sydney'),
    ('00000000-0000-4000-8000-000000000008', 'Grace Cossington Smith Gallery', 'gallery', 'Gate 7, 1666 Pacific Hwy, Wahroonga', 'Sydney')
  returning id
)
select count(*) from v;

insert into public.exhibitions
  (venue_id, title, artists, start_date, end_date, opening_datetime, description, status, is_featured, city)
values
  ('00000000-0000-4000-8000-000000000001', 'Archibald, Wynne & Sulman Prizes 2026', 'Finalists 2026',
   '2026-06-06', '2026-08-16', null,
   'Australia’s most argued-over walls. The Archibald’s portraits, the Wynne’s landscapes and the Sulman’s subject pictures hang side by side — one century-old conversation about who we are, renewed for 2026.',
   'approved', true, 'Sydney'),
  ('00000000-0000-4000-8000-000000000001', 'Takashi Murakami', 'Takashi Murakami',
   '2026-05-30', '2026-09-27', null,
   'The Superflat universe arrives in Sydney at full scale. Murakami’s smiling flowers, wrathful deities and mile-wide panoramas collapse four centuries of Japanese painting into a single, relentless present.',
   'approved', true, 'Sydney'),
  ('00000000-0000-4000-8000-000000000002', 'Primavera 2026: Young Australian Artists', 'Young Australian Artists',
   '2026-07-03', '2026-09-20', null,
   'The MCA’s annual survey of artists aged 35 and under — the room where you meet the names everyone will claim to have known first. New commissions across painting, video, sculpture and sound.',
   'approved', true, 'Sydney'),
  ('00000000-0000-4000-8000-000000000002', 'Hany Armanious', 'Hany Armanious',
   '2026-06-20', '2026-08-31', null,
   'Casts of the overlooked — candle stubs, foam offcuts, drink lids — remade with alchemical precision until the worthless becomes uncanny. A survey of one of Australia’s most quietly influential sculptors.',
   'approved', false, 'Sydney'),
  ('00000000-0000-4000-8000-000000000002', 'Robyn Kahukiwa', 'Robyn Kahukiwa',
   '2026-06-20', '2026-08-31', null,
   'A landmark presentation of the Aotearoa painter whose images of Māori women — monumental, frontal, unapologetic — became icons of Indigenous self-determination across the Tasman.',
   'approved', false, 'Sydney'),
  ('00000000-0000-4000-8000-000000000002', 'Nell: Sculpture Commission', 'Nell',
   '2026-05-01', '2026-10-18', null,
   'A new large-scale commission from Nell, whose practice moves between rock’n’roll, Buddhism and the smiley face without ever losing its nerve. On the MCA’s public-facing spaces through spring.',
   'approved', false, 'Sydney'),
  ('00000000-0000-4000-8000-000000000003', 'A Constructed World', 'A Constructed World',
   '2026-06-26', '2026-07-18', null,
   'The collaborative duo returns to Roslyn Oxley9 with work that treats the exhibition itself as a live, unstable proposition — painting, performance residue and text that refuses to explain itself.',
   'approved', false, 'Sydney'),
  ('00000000-0000-4000-8000-000000000004', 'Places of Delight', 'Robby Bennett',
   '2026-07-03', '2026-07-25', null,
   'Bennett’s gardens are remembered rather than observed — lush, slightly wrong, painted with the confidence of a place you can no longer return to. New paintings at Cassandra Bird.',
   'approved', false, 'Sydney'),
  ('00000000-0000-4000-8000-000000000005', 'Sally Gabori & Judy Ledgerwood', 'Sally Gabori, Judy Ledgerwood',
   '2026-06-13', '2026-07-11', null,
   'An improbable, exhilarating pairing: Gabori’s vast remembered geographies of Bentinck Island beside Ledgerwood’s chromatic American abstraction. Two painters, two continents, one argument about colour.',
   'approved', false, 'Sydney'),
  ('00000000-0000-4000-8000-000000000006', 'Infinite Gesture', 'Group Exhibition',
   '2026-06-27', '2026-08-08', null,
   'A group exhibition on the mark that keeps moving — gestural abstraction across generations and geographies, from calligraphic sweep to digital trace, at Ames Yavuz.',
   'approved', false, 'Sydney'),
  ('00000000-0000-4000-8000-000000000007', 'Interconnected', 'Aaron Crothers',
   '2026-07-22', '2026-08-15', '2026-07-22T18:00:00+10:00',
   'Crothers maps the systems beneath the visible — root, reef, network — in paintings that hover between diagram and dream. Opening night at the OLSEN Annexe, 22 July, 6–8pm.',
   'approved', false, 'Sydney'),
  ('00000000-0000-4000-8000-000000000008', 'Pulse', 'Group Exhibition',
   '2026-06-12', '2026-07-11', null,
   'Works that keep time — rhythm, repetition and the body’s tempo, gathered at the Grace Cossington Smith Gallery.',
   'approved', false, 'Sydney'),
  ('00000000-0000-4000-8000-000000000008', 'Abbotsleigh Biennial: Finalists', 'Biennial Finalists',
   '2026-07-18', '2026-08-15', '2026-07-18T14:00:00+10:00',
   'The finalists of the Abbotsleigh Biennial, hung salon-close at the Grace Cossington Smith Gallery. Opening Saturday 18 July at 2pm.',
   'approved', false, 'Sydney');

-- Promote the test account to admin (run after the account has signed up once).
update public.users u
set role = 'admin'
from auth.users au
where au.id = u.id and au.email = 'jadebrack@gmail.com';
