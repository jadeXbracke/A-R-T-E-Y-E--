-- ART EYE — seed: 8 Sydney venues, 13 real exhibitions (July 2026).
-- image_url is null where no press image has been uploaded yet — the app
-- renders a neutral tonal plate. To use real venue press images, upload
-- them to the exhibition-images bucket and set image_url below.

with v as (
  insert into public.venues (id, name, type, address, city) values
    (gen_random_uuid(), 'Art Gallery of New South Wales', 'museum', 'Art Gallery Road, The Domain', 'Sydney'),
    (gen_random_uuid(), 'MCA Australia', 'museum', '140 George Street, The Rocks', 'Sydney'),
    (gen_random_uuid(), 'Roslyn Oxley9 Gallery', 'gallery', '8 Soudan Lane, Paddington', 'Sydney'),
    (gen_random_uuid(), 'Cassandra Bird', 'gallery', 'Paddington', 'Sydney'),
    (gen_random_uuid(), '1301SW', 'gallery', 'Paddington', 'Sydney'),
    (gen_random_uuid(), 'Ames Yavuz', 'gallery', 'Surry Hills', 'Sydney'),
    (gen_random_uuid(), 'OLSEN Annexe', 'gallery', '74 Queen Street, Woollahra', 'Sydney'),
    (gen_random_uuid(), 'Grace Cossington Smith Gallery', 'gallery', '1666 Pacific Highway, Wahroonga', 'Sydney')
  returning id, name
)
insert into public.exhibitions
  (venue_id, title, artists, start_date, end_date, opening_datetime, description, status, is_featured, city)
select v.id, e.title, e.artists, e.start_date::date, e.end_date::date, e.opening_datetime::timestamptz,
       e.description, 'approved', e.is_featured, 'Sydney'
from v
join (values
  ('Art Gallery of New South Wales', 'Archibald, Wynne & Sulman Prizes 2026', 'The 2026 finalists', '2026-06-06', '2026-08-16', null,
   'The country sits for its portrait. The Archibald, alongside the Wynne landscape and Sulman genre prizes, remains the exhibition Sydney argues about over dinner — and the argument is the point.', true),
  ('Art Gallery of New South Wales', 'Takashi Murakami', 'Takashi Murakami', '2026-05-30', '2026-09-27', null,
   'Murakami''s first major Sydney survey moves from nihonga discipline to superflat delirium — flowers, skulls and screens at a scale that makes the gallery feel briefly weightless.', true),
  ('MCA Australia', 'Primavera 2026', 'Young Australian artists', '2026-07-03', '2026-09-20', null,
   'The MCA''s annual exhibition of Australian artists aged 35 and under — the room where you meet the names you will be following for the next decade.', true),
  ('MCA Australia', 'Hany Armanious', 'Hany Armanious', '2026-06-20', '2026-08-31', null,
   'Armanious casts the overlooked — foam, wax, bottle tops — into sculptures of uncanny fidelity, until you stop trusting your own eye. A survey of quiet, exact illusions.', false),
  ('MCA Australia', 'Robyn Kahukiwa', 'Robyn Kahukiwa', '2026-06-20', '2026-08-31', null,
   'A landmark presentation of the Māori artist''s figurative paintings — ancestral presence, motherhood and sovereignty carried in saturated colour.', false),
  ('MCA Australia', 'Sculpture commission', 'Nell', '2026-05-01', '2026-10-18', null,
   'Nell''s new commission holds the MCA''s public space through spring — part talisman, part grin, entirely hers.', false),
  ('Roslyn Oxley9 Gallery', 'A Constructed World', 'A Constructed World', '2026-06-26', '2026-07-18', null,
   'The collaborative duo return to Roslyn Oxley9 with work that treats the exhibition itself as a live proposition — speech, eels and the problem of an audience.', false),
  ('Cassandra Bird', 'Places of Delight', 'Robby Bennett', '2026-07-03', '2026-07-25', null,
   'Bennett''s new paintings map pleasure as geography — gardens, interiors and remembered rooms rendered with a colourist''s appetite.', false),
  ('1301SW', 'Sally Gabori & Judy Ledgerwood', 'Sally Gabori & Judy Ledgerwood', '2026-06-13', '2026-07-11', null,
   'A cross-generational pairing: Gabori''s vast Kaiadilt country in colour beside Ledgerwood''s American chromatic abstraction. Two painters, one conviction about what colour can carry.', false),
  ('Ames Yavuz', 'Infinite Gesture', 'Group exhibition', '2026-06-27', '2026-08-08', null,
   'A group exhibition on the mark as inheritance — gesture passed between hands, generations and geographies across the Asia-Pacific.', false),
  ('OLSEN Annexe', 'Interconnected', 'Aaron Crothers', '2026-07-22', '2026-08-15', '2026-07-22 18:00+10',
   'Crothers'' new body of work traces the systems beneath landscape — root, current, signal — in paintings that read as diagrams of belonging.', false),
  ('Grace Cossington Smith Gallery', 'Pulse', 'Group exhibition', '2026-06-12', '2026-07-11', null,
   'A group exhibition taking rhythm as its measure — repetition, breath and beat across painting, textile and video.', false),
  ('Grace Cossington Smith Gallery', 'Abbotsleigh Biennial — Finalists', 'The finalists', '2026-07-18', '2026-08-15', '2026-07-18 14:00+10',
   'The finalists of the Abbotsleigh Biennial hang together for the first time — a reading of where Australian art practice sits right now, judged in public.', false)
) as e(venue_name, title, artists, start_date, end_date, opening_datetime, description, is_featured)
  on e.venue_name = v.name;

-- Promote the test account to admin (run AFTER signing up in the app
-- with this email):
update public.users set role = 'admin'
where id = (select id from auth.users where email = 'jadebrack@gmail.com');
