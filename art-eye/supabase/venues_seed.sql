-- ============================================================================
--  ART EYE — SYDNEY VENUE REGISTER  (seed / upsert)
-- ============================================================================
--  Safe to run as many times as you like: rows are matched on `slug`, so
--  re-running updates existing venues instead of creating duplicates.
--
--  Run AFTER the migrations in ./migrations (needs the new columns + slug).
--
--  HOW TO ADD A VENUE
--   1. Copy one line from the "ADD YOUR VENUES HERE" block below.
--   2. Fill in: name, type, address, suburb, website, instagram, lat, long.
--      - type must be one of:  'gallery' | 'museum' | 'ari'
--      - slug: lower-case, words-joined-by-hyphens, must be unique.
--        (Leave it and the DB will generate one from the name, but setting it
--         yourself keeps re-runs stable.)
--      - website/instagram/latitude/longitude may be NULL if unknown.
--   3. Run this file again. Done.
-- ============================================================================

-- ---- Known, verified venues (the 13 July-2026 exhibitions hang here) --------
insert into venues (slug, name, type, address, suburb, website, instagram, latitude, longitude, city) values
  ('art-gallery-of-new-south-wales', 'Art Gallery of New South Wales', 'museum',
     'Art Gallery Road, The Domain, Sydney NSW 2000', 'The Domain',
     'https://www.artgallery.nsw.gov.au', '@artgalleryofnsw', -33.8688, 151.2173, 'Sydney'),

  ('mca-australia', 'MCA Australia', 'museum',
     '140 George Street, The Rocks, Sydney NSW 2000', 'The Rocks',
     'https://www.mca.com.au', '@mca_australia', -33.8599, 151.2088, 'Sydney'),

  ('roslyn-oxley9-gallery', 'Roslyn Oxley9 Gallery', 'gallery',
     '8 Soudan Lane, Paddington NSW 2021', 'Paddington',
     'https://www.roslynoxley9.com.au', null, null, null, 'Sydney'),

  ('cassandra-bird', 'Cassandra Bird', 'gallery',
     '54 Kellett Street, Potts Point NSW 2011', 'Potts Point',
     null, null, null, null, 'Sydney'),

  ('1301sw', '1301SW', 'gallery',
     '3 Hiles Street, Alexandria NSW 2015', 'Alexandria',
     null, null, null, null, 'Sydney'),

  ('ames-yavuz', 'Ames Yavuz', 'gallery',
     '114 Commonwealth Street, Surry Hills NSW 2010', 'Surry Hills',
     null, null, null, null, 'Sydney'),

  ('olsen-annexe', 'OLSEN Annexe', 'gallery',
     '74 Queen Street, Woollahra NSW 2025', 'Woollahra',
     null, null, null, null, 'Sydney'),

  ('grace-cossington-smith-gallery', 'Grace Cossington Smith Gallery', 'gallery',
     'Gate 7, 1666 Pacific Highway, Wahroonga NSW 2076', 'Wahroonga',
     null, null, null, null, 'Sydney')

-- ============================================================================
-- ▼▼▼  ADD YOUR VENUES HERE  ▼▼▼
-- Duplicate a line, keep the comma between rows, no comma after the last row.
-- Aim for ~50 real Sydney galleries / museums / ARIs.
--
--   ,('carriageworks', 'Carriageworks', 'ari',
--       '245 Wilson Street, Eveleigh NSW 2015', 'Eveleigh',
--       'https://carriageworks.com.au', '@carriageworks', -33.8949, 151.1946, 'Sydney')
--   ,('your-venue-slug', 'Your Venue Name', 'gallery',
--       'Street address', 'Suburb',
--       null, null, null, null, 'Sydney')
--
-- ▲▲▲  END OF YOUR VENUES  ▲▲▲
-- ============================================================================

on conflict (slug) do update set
  name      = excluded.name,
  type      = excluded.type,
  address   = excluded.address,
  suburb    = excluded.suburb,
  website   = excluded.website,
  instagram = excluded.instagram,
  latitude  = excluded.latitude,
  longitude = excluded.longitude,
  city      = excluded.city;
