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
  ('white-rabbit-gallery', 'Black Myth', 'White Rabbit Collection artists', '2026-06-25', '2026-11-08',
   'Drawn from the Judith Neilson collection — new Chinese art that reaches for the mythic: gods, ghosts and machines tangled in one dark, spectacular sweep across all four floors.', true),
  ('artspace', '2026 NSW Visual Arts Fellowship (Emerging)', 'Virginia Keft, Charles Levi, Tia Madden, Amelia Skelton, Sue Jo Wright, Natasha & Caitlin Dubler', '2026-07-03', '2026-09-06',
   'Six emerging practices in one charged room — the state''s sharpest early-career artists make their case for the Fellowship at The Gunnery.', false),
  ('chau-chak-wing-museum', 'Undying: Abdul-Rahman Abdullah', 'Abdul-Rahman Abdullah', '2026-02-07', '2026-07-26',
   'Hand-carved animals meet the museum''s natural history collection — Abdullah''s tender, uncanny menagerie on our entangled lives with the creatures we keep, fear and mourn.', false),
  ('chau-chak-wing-museum', 'Unkept: Kirtika Kain', 'Kirtika Kain', '2026-02-07', '2026-07-26',
   'In a makeshift storehouse in the Penelope Gallery, Kain works gold, tar and pigment into a reckoning with caste, labour and the histories archives fail to keep.', false),
  ('sh-ervin-gallery', 'Salon des Refusés 2026', 'The alternative Archibald & Wynne selection', '2026-05-09', '2026-07-26',
   'The ones that got away — the annual alternative selection from the Archibald and Wynne entries, hung on Observatory Hill and argued over just as fiercely.', false),
  ('nas-gallery', 'Mitch Cairns: Artist''s Mouth', 'Mitch Cairns', '2026-05-01', '2026-07-11',
   'Twenty years of Cairns'' cool, exact painting — 48 works, the 2017 Archibald winner among them — surveyed in the old Darlinghurst Gaol where he trained.', false),
  ('mosman-art-gallery', 'Jasper Knight: Collage, prints and works on paper', 'Jasper Knight', '2026-06-01', '2026-08-09',
   'Harbour light at speed — Knight''s cut, layered and printed Sydney, from ferries to pylons, in a survey of his works on paper at Mosman.', false),
  ('manly-art-gallery-museum', 'Tamara Dean: Leave Only Footprints', 'Tamara Dean', '2026-06-12', '2026-08-02',
   'Bodies folded into bushland, ocean and storm — the first survey of Dean''s staged photomedia, where the human figure is one animal among many.', false),
  ('manly-art-gallery-museum', 'Min Wong: You shall definitely pass', 'Min Wong', '2026-06-12', '2026-08-02',
   'Fresh from residencies in Berlin and Athens, Wong builds an immersive installation on power, belonging and the promises of self-improvement.', false),
  ('manly-art-gallery-museum', 'Chronos: Australian ceramics from 1933', 'Australian ceramicists, 1933 to now', '2026-03-21', '2027-03-14',
   'Nine decades of Australian clay — how ceramic practice holds and hands on cultural change, traced through the gallery''s collection.', false),
  ('campbelltown-arts-centre', 'Friends Annual & Focus: Zara Collins', 'Friends of Campbelltown Arts Centre, Zara Collins', '2026-06-27', '2026-09-13',
   'The region''s artists on their own walls — the Friends'' eclectic annual across styles and mediums, with Zara Collins as this year''s Focus artist.', false),
  ('firstdraft', 'You wouldn''t remember him', 'Nina Dorabialski', '2026-07-18', '2026-08-22',
   'The family album, present only by inference — Dorabialski circles the pictures never shown, unsettling the stories nuclear families tell about themselves.', false),
  ('king-street-gallery', 'The Quick and the Slow', 'John Bartley', '2026-07-07', '2026-08-01',
   'Bartley''s new paintings hold two speeds at once — quick marks over slow ground, landscape as something felt in tempo rather than seen in place.', false),
  ('king-street-gallery', 'Proverbial', 'Nathan Nhan', '2026-07-07', '2026-08-01',
   'Nhan takes the worn wisdom of proverbs and paints it strange again — inherited sayings tested against a first-generation present.', false)
) as x(venue_slug, title, artists, start_date, end_date, description, is_featured)
join venues v on v.slug = x.venue_slug
where not exists (
  select 1 from exhibitions e where e.venue_id = v.id and e.title = x.title
);


-- ---------------------------------------------------------------------------
-- Discovery sweep of 2026-07-21 — 30 shows verified against venue sites,
-- councils and listings. Same re-runnable shape as the block above.
-- ---------------------------------------------------------------------------
insert into exhibitions
  (venue_id, title, artists, start_date, end_date, description, status, is_featured, city)
select v.id, x.title, x.artists, x.start_date::date, x.end_date::date, x.description, 'approved'::exhibition_status, x.is_featured, 'Sydney'
from (values
  ('wollongong-art-gallery', 'Once Upon a Doll', 'Raquel Caballero', '2026-07-03', '2026-11-01',
   'Sixteen hand-built dolls by Raquel Caballero — craft turned uncanny, childhood forms carrying very adult freight.', false),
  ('wollongong-art-gallery', 'Popular Versus Culture', 'Georgia Banks', '2026-06-06', '2026-09-06',
   'Made in the wake of a residency at The Andy Warhol Museum, Banks pushes Warhol''s obsession with fame and fandom into the feed-scroll present.', false),
  ('ngununggula', 'New Religion', 'Hayley Millar Baker, Nell, Julia Robinson, Brent Harris & others', '2026-06-27', '2026-10-18',
   'Faith and its afterimages — contemporary work alongside loans from the AGNSW and NGA, from Dürer to now, on symbols that outlive belief.', false),
  ('bundanon', 'Man on Fire: Visions of Nebuchadnezzar', 'Arthur Boyd, Shaun Gladwell', '2026-07-04', '2026-10-11',
   'Boyd''s Nebuchadnezzar paintings — a king burning through his own hubris — meet a major new Shaun Gladwell commission on the same unravelling.', true),
  ('blue-mountains-cultural-centre', 'The Art of Adaptation', 'Kandos School of Cultural Adaptation', '2026-06-20', '2026-08-02',
   'The Kandos School of Cultural Adaptation brings its field-tested art-and-land experiments to Katoomba — practical, hopeful, unromantic.', false),
  ('newcastle-art-gallery', 'Brian Robinson: Multiverse', 'Brian Robinson', '2026-05-23', '2026-08-30',
   'The Torres Strait Islander artist''s first major NSW solo — monumental linocuts, larger-than-life sculpture and an immersive animation in the reopened gallery.', false),
  ('newcastle-art-gallery', 'Tiyan Baker', 'Tiyan Baker', '2026-07-25', '2026-09-06',
   'Baker''s first institutional solo, on home ground — part of the reopened Newcastle Art Gallery''s statement 2026 program.', false),
  ('the-lock-up', 'Into the Dark', 'Wendy Sharpe', '2026-07-18', '2026-09-13',
   'Archibald winner Wendy Sharpe paints the night side — staged in the cells of a former police lock-up, which suits the work.', false),
  ('gosford-regional-gallery', '20 x 20 Art Exhibition 2026', 'Central Coast artists, anonymous until sold', '2026-07-22', '2026-08-03',
   'A wall of anonymous 20-centimetre squares at $100 each — the annual leveller where a name means nothing until the red dot goes up.', false),
  ('gosford-regional-gallery', 'Confluence', 'David Collins, Ana Pollak', '2026-07-25', '2026-09-13',
   'Partners for forty years, Collins and Pollak hang side by side — two practices that meet the way rivers do, keeping their own currents.', false),
  ('carriageworks', 'Sydney Contemporary 2026', '100+ galleries, 500+ artists', '2026-09-03', '2026-09-06',
   'The southern hemisphere''s biggest art fair takes over the Eveleigh rail sheds — a hundred galleries, five hundred artists, four dense days.', false),
  ('4a-centre', 'Archetypes: 30 Years of 4A', 'Asian-Australian artists across three decades', '2026-07-11', '2026-09-20',
   'Three decades of Asian-Australian art and advocacy — new commissions hung against the archive that made them possible.', false),
  ('nas-gallery', 'Margaret Olley: Australian Intimiste', 'Margaret Olley', '2026-07-31', '2026-10-25',
   'Interiors, ranunculus, the unmade table — the National Art School honours its most beloved alum with a full survey of the great intimiste.', true),
  ('hazelhurst-arts-centre', 'Milli Jannides', 'Milli Jannides', '2026-07-04', '2026-08-30',
   'Dreamlike, loose-limbed painting from the Sydney-born, Aotearoa-based Jannides — canvases that feel remembered rather than observed.', false),
  ('hazelhurst-arts-centre', 'Mango Flesh Identikit', 'Edward Inchbold', '2026-07-10', '2026-07-28',
   'Inchbold''s new paintings hold two readings at once — identity and memory worked over until the image refuses to settle.', false),
  ('penrith-regional-gallery', 'Ngalawan: We Live', 'Leanne Tobin', '2026-07-04', '2026-11-01',
   'Dharug artist Leanne Tobin on Country, presence and persistence — the gallery''s major solo through spring.', false),
  ('penrith-regional-gallery', 'Penrith Youth Art Prize 2026', 'Young artists of the Penrith region', '2026-06-27', '2026-09-09',
   'The region''s youngest artists on the big walls — an annual prize show with more nerve than polish, in the best way.', false),
  ('fairfield-city-museum-gallery', 'We Are Here', 'Fairfield communities', '2026-04-11', '2026-09-19',
   'Fairfield''s communities tell their own arrival stories — a museum show built from the suburb outward.', false),
  ('hawkesbury-regional-gallery', 'Entangled Grounds', 'Yandell Walton, Mar Serinyà Gou', '2026-06-06', '2026-08-23',
   'Walton and Serinyà Gou turn residencies on the edge of Wollemi National Park into work about roots, networks and what connects underneath.', false),
  ('hurstville-museum-gallery', 'Woven from a hundred flowers', 'Nepalese community artists of the Georges River', '2026-05-01', '2026-08-30',
   'Stories and textiles of the Nepalese community of the Georges River — culture carried in cloth.', false),
  ('pari', 'Domain', 'Chloe Abdelnour, Katerina Asistin, Lingam Brown & others', '2026-06-21', '2026-08-16',
   'Western Sydney voices on their own terms — Pari''s group show holds the neighbourhood close.', false),
  ('utopia-art-sydney', 'David Aspden', 'David Aspden', '2026-07-25', '2026-08-15',
   'Unseen major Aspdens from the 1970s — colour as weather — opening the gallery''s new Waterloo rooms.', false),
  ('martin-browne-contemporary', 'Introspection', 'Adrienne Gaha', '2026-07-04', '2026-07-25',
   'Gaha''s veiled, luminous canvases — painting that looks inward and lets the light do the arguing.', false),
  ('martin-browne-contemporary', 'La Madrugá', 'Rose Espinosa', '2026-07-04', '2026-07-25',
   'Espinosa''s small hours — works named for the hush before dawn, hung alongside Gaha''s Introspection.', false),
  ('mosman-art-gallery', 'Shireen Taweel: the trig point', 'Shireen Taweel', '2026-05-16', '2026-08-09',
   'Taweel maps sacred architecture onto the observatory — a silk house of seven circles and a sonic score of navigation, migration and faith.', false),
  ('mosman-art-gallery', 'Merciful Navigation', 'Casey Chen', '2026-05-16', '2026-08-09',
   'Chen redraws a mythical Song-dynasty China through ceramic tradition and pop culture — an allegorical map of a country in turmoil.', false),
  ('gallery-lane-cove', 'Evolution: Founders of the Indigenous Art Movement', 'Albert Namatjira, Emily Kngwarreye, Ronnie Tjampitjinpa & others', '2026-07-01', '2026-07-25',
   'Namatjira, Kngwarreye, Tjampitjinpa — the founders of the desert painting movement, curated by Brenda Colahan at Lane Cove.', false),
  ('art-space-on-the-concourse', 'THREADLINES', 'Five First Nations artists, curated by Nicole Monks', '2026-07-02', '2026-08-02',
   'Weaving as method, collaboration as subject — five artists in residence, with work spilling into the library next door.', false),
  ('art-space-on-the-concourse', 'Operation Art 2026', 'NSW school students for Westmead Children''s Hospital', '2026-08-08', '2026-10-04',
   'Schoolchildren painting for the children''s hospital — hundreds of small works of unguarded sincerity, picked for the wards at Westmead.', false),
  ('dominik-mersch-gallery', 'DMG Curator Award 2026: After Hours', 'Group show curated by Liam Garstang', '2026-07-10', '2026-08-01',
   'Curator Award winner Liam Garstang keeps the lights on late — a group show about what work does to time.', false)
) as x(venue_slug, title, artists, start_date, end_date, description, is_featured)
join venues v on v.slug = x.venue_slug
where not exists (
  select 1 from exhibitions e where e.venue_id = v.id and e.title = x.title
);

-- Venues found permanently closed or without premises in the same sweep.
update venues set status = 'archived', verification_source = 'discovery sweep 2026-07-21'
where slug in ('australian-design-centre', 'blacktown-arts', 'galerie-pompom',
               'sarah-cottier-gallery', 'incinerator-art-space', 'cement-fondu');
