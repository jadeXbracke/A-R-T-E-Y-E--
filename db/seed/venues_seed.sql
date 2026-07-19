-- ============================================================================
-- venues_seed.sql — Sydney venue register (V2)
--
-- Idempotent: upserts on slug, so you can run this as often as you like.
-- Re-running updates the details of existing rows but NEVER touches
-- is_claimed / is_fixture (those are owned by the app / migration 003).
--
-- ⚠️  VERIFY BEFORE LAUNCH: this list was curated as a starting point
--     (July 2026). Addresses, websites and Instagram handles of commercial
--     galleries and ARIs change often — spot-check each row, fill in the
--     NULLs (especially lat/lng) and remove venues that have closed.
--     lat/lng values that ARE filled in are approximate.
--     Note: Powerhouse Ultimo is closed for renovation; Powerhouse
--     Parramatta is its new flagship.
--
-- Columns: name, slug, address, suburb, type (gallery|museum|ari),
--          website, instagram (handle without @), lat, lng
-- ============================================================================

INSERT INTO public.venues
  (name, slug, address, suburb, type, website, instagram, lat, lng)
VALUES

-- ═══════════════════════════ MUSEUMS ═══════════════════════════
('Art Gallery of New South Wales', 'art-gallery-of-nsw', 'Art Gallery Road, The Domain', 'Sydney', 'museum', 'https://www.artgallery.nsw.gov.au', 'artgalleryofnsw', -33.8688, 151.2173),
('Museum of Contemporary Art Australia', 'mca-australia', '140 George Street', 'The Rocks', 'museum', 'https://www.mca.com.au', 'mca_australia', -33.8598, 151.2090),
('White Rabbit Gallery', 'white-rabbit-gallery', '30 Balfour Street', 'Chippendale', 'museum', 'https://www.whiterabbitcollection.org', 'whiterabbitgallery', -33.8847, 151.1999),
('Powerhouse Parramatta', 'powerhouse-parramatta', 'Phillip Street', 'Parramatta', 'museum', 'https://www.powerhouse.com.au', 'powerhousemuseum', -33.8110, 151.0030),
('Australian Museum', 'australian-museum', '1 William Street', 'Darlinghurst', 'museum', 'https://australian.museum', 'australianmuseum', -33.8742, 151.2130),
('Chau Chak Wing Museum', 'chau-chak-wing-museum', 'University Place, University of Sydney', 'Camperdown', 'museum', 'https://www.sydney.edu.au/museum', NULL, -33.8880, 151.1895),
('Sydney Jewish Museum', 'sydney-jewish-museum', '148 Darlinghurst Road', 'Darlinghurst', 'museum', 'https://sydneyjewishmuseum.com.au', NULL, -33.8790, 151.2225),
('Museum of Sydney', 'museum-of-sydney', 'Cnr Phillip & Bridge Streets', 'Sydney', 'museum', 'https://mhnsw.au', NULL, -33.8636, 151.2116),

-- ══════════════ PUBLIC / INSTITUTIONAL GALLERIES ══════════════
('Artspace', 'artspace', '43–51 Cowper Wharf Roadway', 'Woolloomooloo', 'gallery', 'https://www.artspace.org.au', 'artspace_sydney', -33.8697, 151.2200),
('Carriageworks', 'carriageworks', '245 Wilson Street', 'Eveleigh', 'gallery', 'https://carriageworks.com.au', 'carriageworks', -33.8944, 151.1925),
('S.H. Ervin Gallery', 'sh-ervin-gallery', 'Watson Road, Observatory Hill', 'Millers Point', 'gallery', 'https://shervingallery.com.au', NULL, -33.8590, 151.2043),
('UNSW Galleries', 'unsw-galleries', 'Cnr Oxford Street & Greens Road', 'Paddington', 'gallery', 'https://www.unsw.edu.au/arts-design-architecture/unsw-galleries', NULL, -33.8845, 151.2262),
('UTS Gallery', 'uts-gallery', '702 Harris Street', 'Ultimo', 'gallery', 'https://art.uts.edu.au', NULL, NULL, NULL),
('Verge Gallery', 'verge-gallery', 'Jane Foss Russell Plaza, City Road', 'Darlington', 'gallery', 'https://verge-gallery.net', NULL, NULL, NULL),
('National Art School Gallery', 'nas-gallery', 'Forbes Street', 'Darlinghurst', 'gallery', 'https://nas.edu.au', NULL, NULL, NULL),
('Australian Design Centre', 'australian-design-centre', '101–115 William Street', 'Darlinghurst', 'gallery', 'https://australiandesigncentre.com', NULL, NULL, NULL),
('4A Centre for Contemporary Asian Art', '4a-centre', '181–187 Hay Street', 'Haymarket', 'gallery', 'https://www.4a.com.au', NULL, NULL, NULL),
('Cement Fondu', 'cement-fondu', '36 Gosbell Street', 'Paddington', 'gallery', 'https://cementfondu.org', 'cementfondu', NULL, NULL),
('Phoenix Central Park', 'phoenix-central-park', '37–49 O''Connor Street', 'Chippendale', 'gallery', 'https://phoenixcentralpark.com.au', NULL, NULL, NULL),
('Campbelltown Arts Centre', 'campbelltown-arts-centre', '1 Art Gallery Road', 'Campbelltown', 'gallery', 'https://c-a-c.com.au', NULL, -34.0655, 150.8140),
('Casula Powerhouse Arts Centre', 'casula-powerhouse', '1 Powerhouse Road', 'Casula', 'gallery', 'https://www.casulapowerhouse.com', NULL, -33.9494, 150.8968),
('Hazelhurst Arts Centre', 'hazelhurst-arts-centre', '782 Kingsway', 'Gymea', 'gallery', 'https://www.sutherlandshire.nsw.gov.au/hazelhurst', NULL, -34.0310, 151.0850),
('Mosman Art Gallery', 'mosman-art-gallery', '1 Art Gallery Way', 'Mosman', 'gallery', 'https://mosmanartgallery.org.au', NULL, -33.8290, 151.2400),
('Manly Art Gallery & Museum', 'manly-art-gallery-museum', 'West Esplanade Reserve', 'Manly', 'gallery', 'https://www.northernbeaches.nsw.gov.au/things-to-do/arts-and-culture/manly-art-gallery-museum', NULL, -33.7972, 151.2840),
('Penrith Regional Gallery', 'penrith-regional-gallery', '86 River Road', 'Emu Plains', 'gallery', 'https://www.penrithregionalgallery.com.au', NULL, -33.7480, 150.6680),
('Blacktown Arts', 'blacktown-arts', '78 Flushcombe Road', 'Blacktown', 'gallery', 'https://blacktownarts.com.au', NULL, NULL, NULL),
('Bankstown Arts Centre', 'bankstown-arts-centre', '5 Olympic Parade', 'Bankstown', 'gallery', 'https://www.bankstownartscentre.com.au', NULL, NULL, NULL),
('Fairfield City Museum & Gallery', 'fairfield-city-museum-gallery', '634 The Horsley Drive', 'Smithfield', 'gallery', 'https://www.fairfieldcity.nsw.gov.au/museumgallery', NULL, NULL, NULL),
('Granville Centre Art Gallery', 'granville-centre-art-gallery', '1 Memorial Drive', 'Granville', 'gallery', NULL, NULL, NULL, NULL),
('Incinerator Art Space', 'incinerator-art-space', '2 Small Street', 'Willoughby', 'gallery', NULL, NULL, NULL, NULL),
('Gallery Lane Cove', 'gallery-lane-cove', '164 Longueville Road', 'Lane Cove', 'gallery', 'https://gallerylanecove.com.au', NULL, NULL, NULL),

-- ═══════════════════ COMMERCIAL GALLERIES ═══════════════════
('Roslyn Oxley9 Gallery', 'roslyn-oxley9', '8 Soudan Lane', 'Paddington', 'gallery', 'https://www.roslynoxley9.com.au', 'roslynoxley9', -33.8846, 151.2270),
('Sullivan+Strumpf', 'sullivan-strumpf', '799 Elizabeth Street', 'Zetland', 'gallery', 'https://sullivanstrumpf.com', 'sullivanstrumpf', NULL, NULL),
('Martin Browne Contemporary', 'martin-browne-contemporary', '15 Hampden Street', 'Paddington', 'gallery', 'https://www.martinbrownecontemporary.com', NULL, NULL, NULL),
('Olsen Gallery', 'olsen-gallery', '63 Jersey Road', 'Woollahra', 'gallery', 'https://www.olsengallery.com', 'olsengallery', NULL, NULL),
('Michael Reid Sydney', 'michael-reid-sydney', '105 Kippax Street', 'Surry Hills', 'gallery', 'https://michaelreid.com.au', NULL, NULL, NULL),
('Chalk Horse', 'chalk-horse', '167 William Street', 'Darlinghurst', 'gallery', 'https://chalkhorse.com.au', NULL, NULL, NULL),
('COMA Gallery', 'coma-gallery', NULL, 'Surry Hills', 'gallery', 'https://coma.gallery', NULL, NULL, NULL),
('STATION Sydney', 'station-sydney', '91 Campbell Street', 'Surry Hills', 'gallery', 'https://stationgallery.com', NULL, NULL, NULL),
('N.Smith Gallery', 'n-smith-gallery', NULL, 'Paddington', 'gallery', 'https://nsmithgallery.com', NULL, NULL, NULL),
('Darren Knight Gallery', 'darren-knight-gallery', '840 Elizabeth Street', 'Waterloo', 'gallery', 'https://www.darrenknightgallery.com', NULL, NULL, NULL),
('Gallery 9', 'gallery-9', '9 Darley Street', 'Darlinghurst', 'gallery', 'https://gallery9.com.au', NULL, NULL, NULL),
('Dominik Mersch Gallery', 'dominik-mersch-gallery', NULL, 'Rushcutters Bay', 'gallery', 'https://dominikmerschgallery.com', NULL, NULL, NULL),
('King Street Gallery on William', 'king-street-gallery', '177 William Street', 'Darlinghurst', 'gallery', 'https://www.kingstreetgallery.com.au', NULL, NULL, NULL),
('Liverpool Street Gallery', 'liverpool-street-gallery', '243a Liverpool Street', 'Darlinghurst', 'gallery', 'https://liverpoolstgallery.com.au', NULL, NULL, NULL),
('Australian Galleries', 'australian-galleries-sydney', '15 Roylston Street', 'Paddington', 'gallery', 'https://australiangalleries.com.au', NULL, NULL, NULL),
('Saint Cloche', 'saint-cloche', '37 MacDonald Street', 'Paddington', 'gallery', 'https://www.saintcloche.com', NULL, NULL, NULL),
('Nanda\Hobbs', 'nanda-hobbs', '12–14 Meagher Street', 'Chippendale', 'gallery', 'https://nandahobbs.com', NULL, NULL, NULL),
('Utopia Art Sydney', 'utopia-art-sydney', '983 Bourke Street', 'Waterloo', 'gallery', 'https://utopiaartsydney.com.au', NULL, NULL, NULL),
('Arthouse Gallery', 'arthouse-gallery', '66 McLachlan Avenue', 'Rushcutters Bay', 'gallery', 'https://arthousegallery.com.au', NULL, NULL, NULL),
('Fine Arts, Sydney', 'fine-arts-sydney', NULL, 'Sydney', 'gallery', 'https://fineartssydney.com', NULL, NULL, NULL),

-- ═══════════ ARTIST-RUN INITIATIVES (ARIs) — verify often, these change! ═══════════
('Firstdraft', 'firstdraft', '13–17 Riley Street', 'Woolloomooloo', 'ari', 'https://firstdraft.org.au', 'firstdraft', NULL, NULL),
('107 Projects', '107-projects', '107 Redfern Street', 'Redfern', 'ari', 'https://107.org.au', NULL, NULL, NULL),
('Boomalli Aboriginal Artists Co-operative', 'boomalli', '55–59 Flood Street', 'Leichhardt', 'ari', 'https://boomalli.com.au', NULL, NULL, NULL),
('Pari', 'pari', '-- verify address --', 'Parramatta', 'ari', NULL, NULL, NULL, NULL),
('Articulate Project Space', 'articulate-project-space', '497 Parramatta Road', 'Leichhardt', 'ari', NULL, NULL, NULL, NULL),
('Tortuga Studios', 'tortuga-studios', '31 Princes Highway', 'St Peters', 'ari', NULL, NULL, NULL, NULL),

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
