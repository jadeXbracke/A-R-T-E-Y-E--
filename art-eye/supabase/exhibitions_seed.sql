-- ============================================================================
--  ART EYE — verified July 2026 exhibitions (seed)
-- ============================================================================
--  Sourced from the venues' own listings, July 2026. Venue is looked up by
--  slug, so run venues_seed.sql first. Re-running skips rows whose title
--  already exists at that venue.
-- ============================================================================

insert into exhibitions
  (venue_id, title, artists, start_date, end_date, description, status, is_featured, city)
select v.id, x.title, x.artists, x.start_date::date, x.end_date::date, x.description, 'approved'::exhibition_status, x.is_featured, 'Sydney'
from (values
  ('white-rabbit-gallery', 'Black Myth', 'White Rabbit Collection artists', '2026-06-25', '2026-11-15',
   'Drawn from the Judith Neilson collection — new Chinese art that reaches for the mythic: gods, ghosts and machines tangled in one dark, spectacular sweep across all four floors.', true),
  ('artspace', '2026 NSW Visual Arts Fellowship (Emerging)', 'Virginia Keft, Charles Levi, Tia Madden, Amelia Skelton, Sue Jo Wright, Natasha & Caitlin Dubler', '2026-07-03', '2026-10-04',
   'Six emerging practices in one charged room — the state''s sharpest early-career artists make their case for the Fellowship at The Gunnery.', false),
  ('chau-chak-wing-museum', 'Undying: Abdul-Rahman Abdullah', 'Abdul-Rahman Abdullah', '2026-02-16', '2026-07-26',
   'Hand-carved animals meet the museum''s natural history collection — Abdullah''s tender, uncanny menagerie on our entangled lives with the creatures we keep, fear and mourn.', false),
  ('chau-chak-wing-museum', 'Unkept: Kirtika Kain', 'Kirtika Kain', '2026-02-16', '2026-07-26',
   'In a makeshift storehouse in the Penelope Gallery, Kain works gold, tar and pigment into a reckoning with caste, labour and the histories archives fail to keep.', false),
  ('sh-ervin-gallery', 'Salon des Refusés 2026', 'The alternative Archibald & Wynne selection', '2026-05-09', '2026-07-26',
   'The ones that got away — the annual alternative selection from the Archibald and Wynne entries, hung on Observatory Hill and argued over just as fiercely.', false),
  ('nas-gallery', 'Mitch Cairns: Artist''s Mouth', 'Mitch Cairns', '2026-05-01', '2026-07-11',
   'Twenty years of Cairns'' cool, exact painting — 48 works, the 2017 Archibald winner among them — surveyed in the old Darlinghurst Gaol where he trained.', false),
  ('mosman-art-gallery', 'Jasper Knight: Collage, prints and works on paper', 'Jasper Knight', '2026-06-01', '2026-08-09',
   'Harbour light at speed — Knight''s cut, layered and printed Sydney, from ferries to pylons, in a survey of his works on paper at Mosman.', false)
) as x(venue_slug, title, artists, start_date, end_date, description, is_featured)
join venues v on v.slug = x.venue_slug
where not exists (
  select 1 from exhibitions e where e.venue_id = v.id and e.title = x.title
);
