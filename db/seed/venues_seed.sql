-- ============================================================================
-- venues_seed.sql — Sydney venue register (V2)
--
-- Idempotent: upserts on slug, so you can run this as often as you like.
-- Re-running updates the details of existing rows but NEVER touches
-- is_claimed / is_fixture (those are owned by the app / migration 003).
--
-- ✅ VERIFIED July 2026 via web research against official sources (venue
--    websites + Instagram). Status, addresses, websites and IG handles are
--    current as of mid-2026. Coordinates are street-level accurate (~100 m);
--    for pin-perfect maps, re-geocode before launch.
--    Closed / venue-less organisations are listed (commented out) at the
--    bottom of this file so they don't enter the register.
--
-- Columns: name, slug, address, suburb, type (gallery|museum|ari),
--          website, instagram (handle without @), lat, lng
-- ============================================================================

INSERT INTO public.venues
  (name, slug, address, suburb, type, website, instagram, lat, lng)
VALUES

-- ═══════════════════════════ MUSEUMS ═══════════════════════════
('Art Gallery of New South Wales', 'art-gallery-of-nsw', 'Art Gallery Road, The Domain', 'Sydney', 'museum', 'https://www.artgallery.nsw.gov.au', 'artgalleryofnsw', -33.8688, 151.2173),
('Museum of Contemporary Art Australia', 'mca-australia', '140 George Street', 'The Rocks', 'museum', 'https://www.mca.com.au', 'mca_australia', -33.8601, 151.2090),
('White Rabbit Gallery', 'white-rabbit-gallery', '30 Balfour Street', 'Chippendale', 'museum', 'https://whiterabbitcollection.org', 'whiterabbitgallery', -33.8865, 151.2003),
-- Powerhouse Parramatta: building complete, opens late 2026 (Ultimo dicht voor renovatie tot ~2027)
('Powerhouse Parramatta', 'powerhouse-parramatta', '34 Phillip Street', 'Parramatta', 'museum', 'https://powerhouse.com.au/visit/parramatta', 'powerhousemuseum', -33.8100, 151.0044),
('Australian Museum', 'australian-museum', '1 William Street', 'Sydney', 'museum', 'https://australian.museum', 'australianmuseum', -33.8712, 151.2133),
('Chau Chak Wing Museum', 'chau-chak-wing-museum', 'University Place, University of Sydney', 'Camperdown', 'museum', 'https://www.sydney.edu.au/museum/', 'ccwm_sydney', -33.8853, 151.1905),
-- Sydney Jewish Museum: dicht voor verbouwing, heropening verwacht eind 2026
('Sydney Jewish Museum', 'sydney-jewish-museum', '148 Darlinghurst Road', 'Darlinghurst', 'museum', 'https://sydneyjewishmuseum.com.au', 'sydneyjewishmuseum', -33.8790, 151.2203),
('Museum of Sydney', 'museum-of-sydney', 'Cnr Phillip & Bridge Streets', 'Sydney', 'museum', 'https://mhnsw.au/visit-us/museum-of-sydney/', 'museumsofhistorynsw', -33.8636, 151.2114),

-- ══════════════ PUBLIC / INSTITUTIONAL GALLERIES ══════════════
('Artspace', 'artspace', '43–51 Cowper Wharf Roadway (The Gunnery)', 'Woolloomooloo', 'gallery', 'https://www.artspace.org.au', 'artspacesydney', -33.8696, 151.2205),
('Carriageworks', 'carriageworks', '245 Wilson Street', 'Eveleigh', 'gallery', 'https://carriageworks.com.au', 'carriageworks', -33.8946, 151.1935),
('S.H. Ervin Gallery', 'sh-ervin-gallery', 'Watson Road, Observatory Hill', 'Millers Point', 'gallery', 'https://www.shervingallery.com.au', 'shervingallery', -33.8599, 151.2049),
('UNSW Galleries', 'unsw-galleries', 'Cnr Oxford Street & Greens Road', 'Paddington', 'gallery', 'https://www.galleries.unsw.edu.au', 'unswgalleries', -33.8845, 151.2223),
('UTS Gallery', 'uts-gallery', 'Level 4, Building 6, 702 Harris Street', 'Ultimo', 'gallery', 'https://art.uts.edu.au', 'uts_art', -33.8805, 151.2000),
('Verge Gallery', 'verge-gallery', 'Jane Foss Russell Plaza, 154 City Road', 'Darlington', 'gallery', 'https://www.verge-gallery.net', 'vergegallery', -33.8888, 151.1866),
('National Art School Gallery', 'nas-gallery', '156 Forbes Street', 'Darlinghurst', 'gallery', 'https://nas.edu.au', 'nas_au', -33.8788, 151.2172),
('4A Centre for Contemporary Asian Art', '4a-centre', '181–187 Hay Street', 'Haymarket', 'gallery', 'https://4a.com.au', '4a_aus', -33.8790, 151.2037),
('Phoenix Central Park', 'phoenix-central-park', '37–49 O''Connor Street', 'Chippendale', 'gallery', 'https://phoenixcentralpark.com.au', 'phoenixcentralpark', -33.8865, 151.1990),
('Campbelltown Arts Centre', 'campbelltown-arts-centre', '1 Art Gallery Road', 'Campbelltown', 'gallery', 'https://c-a-c.com.au', 'campbelltownartscentre', -34.0728, 150.8090),
-- Voorheen "Casula Powerhouse Arts Centre" — in 2025 hernoemd door Liverpool City Council
('Liverpool Powerhouse', 'liverpool-powerhouse', '1 Powerhouse Road', 'Casula', 'gallery', 'https://www.liverpoolpowerhouse.com.au', 'liverpoolpowerhouse', -33.9493, 150.9129),
('Hazelhurst Arts Centre', 'hazelhurst-arts-centre', '782 Kingsway', 'Gymea', 'gallery', 'https://hazelhurst.sutherlandshire.nsw.gov.au', 'hazelhurstartscentre', -34.0329, 151.0874),
('Mosman Art Gallery', 'mosman-art-gallery', '1 Art Gallery Way', 'Mosman', 'gallery', 'https://mosmanartgallery.org.au', 'mosmanart', -33.8279, 151.2406),
('Manly Art Gallery & Museum', 'manly-art-gallery-museum', '1a West Esplanade', 'Manly', 'gallery', 'https://www.northernbeaches.nsw.gov.au/things-to-do/arts-and-culture/manly-art-gallery-museum', 'magamnsw', -33.7986, 151.2814),
('Penrith Regional Gallery', 'penrith-regional-gallery', '86 River Road', 'Emu Plains', 'gallery', 'https://www.penrithregionalgallery.com.au', 'penrithregionalgallery', -33.7458, 150.6669),
('Bankstown Arts Centre', 'bankstown-arts-centre', '5 Olympic Parade', 'Bankstown', 'gallery', 'https://www.bankstownartscentre.com.au', 'bankstownartscentre', -33.9185, 151.0342),
('Fairfield City Museum & Gallery', 'fairfield-city-museum-gallery', '634 The Horsley Drive', 'Smithfield', 'museum', 'https://www.fcmg.nsw.gov.au', 'fairfieldcitymuseumgallery', -33.8481, 150.9427),
-- Granville: beperkte openingstijden (programma's/events) — check vóór bezoek
('Granville Centre Art Gallery', 'granville-centre-art-gallery', '1 Memorial Drive', 'Granville', 'gallery', 'https://www.cumberland.nsw.gov.au/granville-centre-art-gallery', 'granvillecentreartgallery', -33.8310, 151.0140),
('Gallery Lane Cove', 'gallery-lane-cove', 'Level 3, 164 Longueville Road', 'Lane Cove', 'gallery', 'https://www.gallerylanecove.com.au', 'gallerylanecove', -33.8160, 151.1697),

-- ═══════════════════ COMMERCIAL GALLERIES ═══════════════════
('Roslyn Oxley9 Gallery', 'roslyn-oxley9', '8 Soudan Lane', 'Paddington', 'gallery', 'https://www.roslynoxley9.com.au', 'roslynoxley9', -33.8826, 151.2341),
('Sullivan+Strumpf', 'sullivan-strumpf', '799 Elizabeth Street', 'Zetland', 'gallery', 'https://www.sullivanstrumpf.com', 'sullivanstrumpf', -33.9065, 151.2067),
('Martin Browne Contemporary', 'martin-browne-contemporary', '15 Hampden Street', 'Paddington', 'gallery', 'https://martinbrownecontemporary.com', 'martinbrownecontemporary', -33.8825, 151.2338),
('Olsen Gallery', 'olsen-gallery', '63 Jersey Road', 'Woollahra', 'gallery', 'https://www.olsengallery.com', 'olsen_gallery', -33.8875, 151.2337),
-- Michael Reid: in 2024/25 verhuisd van Surry Hills naar Chippendale
('Michael Reid Sydney', 'michael-reid-sydney', '109 Shepherd Street', 'Chippendale', 'gallery', 'https://michaelreid.com.au', 'michaelreidsydney', -33.8877, 151.1951),
('Chalk Horse', 'chalk-horse', '167 William Street (lower ground)', 'Darlinghurst', 'gallery', 'https://www.chalkhorse.com.au', 'chalkhorsegallery', -33.8750, 151.2189),
-- COMA: sinds jan 2025 in voormalig koffiepakhuis in Marrickville
('COMA Gallery', 'coma-gallery', '37 Chapel Street', 'Marrickville', 'gallery', 'https://www.comagallery.com', 'comagallery', -33.9078, 151.1640),
('STATION Sydney', 'station-sydney', '91 Campbell Street', 'Surry Hills', 'gallery', 'https://stationgallery.com', 'stationgalleryaustralia', -33.8796, 151.2102),
-- N.Smith: in 2024 verhuisd van Paddington naar Surry Hills
('N.Smith Gallery', 'n-smith-gallery', '15 Foster Street', 'Surry Hills', 'gallery', 'https://www.nsmithgallery.com', 'n.smithgallery', -33.8800, 151.2097),
('Darren Knight Gallery', 'darren-knight-gallery', '840 Elizabeth Street', 'Waterloo', 'gallery', 'https://darrenknightgallery.com', 'darrenknightgallery', -33.9070, 151.2072),
('Dominik Mersch Gallery', 'dominik-mersch-gallery', '1/75 McLachlan Avenue', 'Rushcutters Bay', 'gallery', 'https://dominikmerschgallery.com', 'dominikmerschgallery', -33.8783, 151.2238),
('King Street Gallery on William', 'king-street-gallery', '177 William Street', 'Darlinghurst', 'gallery', 'https://kingstreetgallery.com.au', 'kingstreetgallery', -33.8747, 151.2184),
('Liverpool Street Gallery', 'liverpool-street-gallery', '243a Liverpool Street', 'Darlinghurst', 'gallery', 'https://www.liverpoolstgallery.com.au', 'liverpoolstreetgallery', -33.8777, 151.2152),
('Australian Galleries', 'australian-galleries-sydney', '15 Roylston Street', 'Paddington', 'gallery', 'https://australiangalleries.com.au', 'australiangalleries', -33.8810, 151.2246),
('Saint Cloche', 'saint-cloche', '37 MacDonald Street', 'Paddington', 'gallery', 'https://saintcloche.com', 'saint_cloche', -33.8824, 151.2231),
('Nanda\Hobbs', 'nanda-hobbs', '12–14 Meagher Street', 'Chippendale', 'gallery', 'https://nandahobbs.com', 'nandahobbs', -33.8867, 151.1986),
('Utopia Art Sydney', 'utopia-art-sydney', '983 Bourke Street', 'Waterloo', 'gallery', 'https://utopiaartsydney.com.au', 'utopiaartsydney', -33.9000, 151.2106),
('Arthouse Gallery', 'arthouse-gallery', '66 McLachlan Avenue', 'Rushcutters Bay', 'gallery', 'https://arthousegallery.com.au', 'arthousegallery', -33.8781, 151.2236),
-- Fine Arts, Sydney: verhuisd van CBD naar Paddington
('Fine Arts, Sydney', 'fine-arts-sydney', '23 Hampden Street', 'Paddington', 'gallery', 'https://www.finearts.sydney', 'fineartssydney', -33.8828, 151.2211),
('China Heights Gallery', 'china-heights', 'Level 3, 16–28 Foster Street', 'Surry Hills', 'gallery', 'https://chinaheights.com', 'chinaheights', -33.8797, 151.2103),

-- ═══════════ ARTIST-RUN INITIATIVES (ARIs) ═══════════
('Firstdraft', 'firstdraft', '13–17 Riley Street', 'Woolloomooloo', 'ari', 'https://firstdraft.org.au', 'firstdraft_', -33.8725, 151.2155),
('Boomalli Aboriginal Artists Co-operative', 'boomalli', '55–59 Flood Street', 'Leichhardt', 'ari', 'https://boomalli.com.au', 'boomalli_aboriginal_art', -33.8858, 151.1504),
('Pari', 'pari', 'Shop 7, 14 Hunter Street', 'Parramatta', 'ari', 'https://pariari.org', 'pari_ari_', -33.8130, 150.9987),
('Articulate Project Space', 'articulate-project-space', '497 Parramatta Road', 'Leichhardt', 'ari', 'https://www.articulateprojectspace.org', 'articulateprojectspace', -33.8776, 151.1552),
('Tortuga Studios', 'tortuga-studios', '31 Princes Highway', 'St Peters', 'ari', 'https://tortugastudios.org.au', 'tortuga.studios', -33.9100, 151.1808),
('Frontyard Projects', 'frontyard-projects', '228 Illawarra Road', 'Marrickville', 'ari', 'https://www.frontyardprojects.org', 'frontyardorg', -33.9107, 151.1549),
('Scratch Art Space', 'scratch-art-space', '67 Sydenham Road', 'Marrickville', 'ari', 'https://www.scratchartspace.com', 'scratchartspace', -33.9065, 151.1614),

-- ═══════════════════════════════════════════════════════════════
-- >>> VOEG HIER JE EIGEN VENUES TOE / ADD YOUR OWN VENUES HERE <<<
--
-- Format (copy one line, comma-separated, keep the quotes):
-- ('Venue Name', 'venue-slug', 'Street address', 'Suburb', 'gallery|museum|ari', 'https://website', 'instagram_handle', lat, lng),
--
-- Voorbeeld / example:
-- ('My New Gallery', 'my-new-gallery', '1 Example Street', 'Newtown', 'gallery', 'https://example.com', 'mynewgallery', -33.8960, 151.1790),
-- ═══════════════════════════════════════════════════════════════

-- Keep this dummy terminator row OUT — the last real row above must NOT end
-- with a comma.
('__end__', '__seed-terminator__', NULL, NULL, NULL, NULL, NULL, NULL, NULL)

ON CONFLICT (slug) DO UPDATE SET
  name      = EXCLUDED.name,
  address   = COALESCE(EXCLUDED.address,   public.venues.address),
  suburb    = COALESCE(EXCLUDED.suburb,    public.venues.suburb),
  type      = COALESCE(EXCLUDED.type,      public.venues.type),
  website   = COALESCE(EXCLUDED.website,   public.venues.website),
  instagram = COALESCE(EXCLUDED.instagram, public.venues.instagram),
  lat       = COALESCE(EXCLUDED.lat,       public.venues.lat),
  lng       = COALESCE(EXCLUDED.lng,       public.venues.lng);
  -- is_claimed / is_fixture deliberately untouched.

-- Remove the terminator helper row.
DELETE FROM public.venues WHERE slug = '__seed-terminator__';

-- ============================================================================
-- ❌ GESLOTEN / GEEN VAST PAND (per juli 2026) — bewust NIET in de register.
-- Bewaard als naslag; verplaats een regel naar boven als de situatie wijzigt.
--
-- ('Australian Design Centre', 'australian-design-centre', '101–115 William St', 'Darlinghurst', 'gallery', ...)
--     → definitief gesloten 30 juni 2026 na 62 jaar (subsidieverlies)
-- ('Gallery 9', 'gallery-9', '9 Darley St', 'Darlinghurst', 'gallery', ...)
--     → definitief gesloten 24 mei 2025; site is nu archief
-- ('107 Projects', '107-projects', '107 Redfern St', 'Redfern', 'ari', ...)
--     → gestopt 30 sep 2024; pand terug naar City of Sydney
-- ('Blacktown Arts', 'blacktown-arts', '78 Flushcombe Rd', 'Blacktown', 'gallery', ...)
--     → vast pand gesloten jan 2026 (herontwikkeling); organisatie doet nu pop-ups
-- ('Incinerator Art Space', 'incinerator-art-space', '2 Small St', 'Willoughby', 'gallery', ...)
--     → dicht wegens waterschade aan erfgoedpand; geen heropeningsdatum
-- ('Cement Fondu', 'cement-fondu', NULL, NULL, 'gallery', 'https://cementfondu.org', 'cementfondu', NULL, NULL)
--     → pand in Paddington eind 2024 verlaten; werkt nu nomadisch zonder vast adres
-- ============================================================================
