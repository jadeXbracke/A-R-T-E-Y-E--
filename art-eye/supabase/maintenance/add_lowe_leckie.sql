-- ============================================================================
--  ART EYE — add Lowe + Leckie to the live register
-- ============================================================================
--  The venue is in the seed files now, but seed files only run on a fresh
--  database. The live Supabase project already exists, so paste this into the
--  SQL editor once to add the gallery to the site.
--
--  Safe to run repeatedly: matched on slug, so a second run just updates the
--  existing row instead of creating a duplicate.
--
--  The street number and map pin are NOT known yet — the gallery's site could
--  not be reached when this was written. Fill them in from the app (Curator →
--  venue register → Lowe + Leckie), or set them here before running.
-- ============================================================================

insert into venues (slug, name, type, category, tier, editorial_note, address, suburb, website, instagram, latitude, longitude, city) values
  ('lowe-leckie', 'Lowe + Leckie', 'gallery', 'commercial', '3', 'Young Paddington gallery; viewings and stockroom by appointment.', null, 'Paddington', 'https://www.loweleckie.com', '@loweleckie.gallery', null, null, 'Sydney')
on conflict (slug) do update set
  name = excluded.name,
  type = excluded.type,
  category = excluded.category,
  tier = excluded.tier,
  editorial_note = excluded.editorial_note,
  suburb = excluded.suburb,
  website = excluded.website,
  instagram = excluded.instagram,
  city = excluded.city;

-- Check it landed.
select slug, name, suburb, website, instagram, address, latitude, longitude
from venues
where slug = 'lowe-leckie';
