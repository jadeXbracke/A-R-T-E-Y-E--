-- ============================================================================
--  ART EYE — SYDNEY VENUE REGISTER  (seed / upsert)
-- ============================================================================
--  54 real Sydney venues (galleries, museums, ARIs), verified July 2026.
--  Safe to run repeatedly: rows are matched on `slug`, so re-running updates
--  existing venues instead of creating duplicates.
--
--  Run AFTER the migrations in ./migrations (needs the new columns + slug).
--
--  To add another venue, copy a line, keep the comma between rows (no comma
--  after the very last row), and set type to 'gallery' | 'museum' | 'ari'.
-- ============================================================================

insert into venues (slug, name, type, address, suburb, website, instagram, latitude, longitude, city) values
  ('articulate-project-space', 'Articulate Project Space', 'ari', '497 Parramatta Road, Leichhardt NSW', 'Leichhardt', 'https://www.articulateprojectspace.org', '@articulateprojectspace', -33.8776, 151.1552, 'Sydney'),
  ('boomalli', 'Boomalli Aboriginal Artists Co-operative', 'ari', '55–59 Flood Street, Leichhardt NSW', 'Leichhardt', 'https://boomalli.com.au', '@boomalli_aboriginal_art', -33.8858, 151.1504, 'Sydney'),
  ('firstdraft', 'Firstdraft', 'ari', '13–17 Riley Street, Woolloomooloo NSW', 'Woolloomooloo', 'https://firstdraft.org.au', '@firstdraft_', -33.8725, 151.2155, 'Sydney'),
  ('frontyard-projects', 'Frontyard Projects', 'ari', '228 Illawarra Road, Marrickville NSW', 'Marrickville', 'https://www.frontyardprojects.org', '@frontyardorg', -33.9107, 151.1549, 'Sydney'),
  ('pari', 'Pari', 'ari', 'Shop 7, 14 Hunter Street, Parramatta NSW', 'Parramatta', 'https://pariari.org', '@pari_ari_', -33.813, 150.9987, 'Sydney'),
  ('scratch-art-space', 'Scratch Art Space', 'ari', '67 Sydenham Road, Marrickville NSW', 'Marrickville', 'https://www.scratchartspace.com', '@scratchartspace', -33.9065, 151.1614, 'Sydney'),
  ('tortuga-studios', 'Tortuga Studios', 'ari', '31 Princes Highway, St Peters NSW', 'St Peters', 'https://tortugastudios.org.au', '@tortuga.studios', -33.91, 151.1808, 'Sydney'),
  ('4a-centre', '4A Centre for Contemporary Asian Art', 'gallery', '181–187 Hay Street, Haymarket NSW', 'Haymarket', 'https://4a.com.au', '@4a_aus', -33.879, 151.2037, 'Sydney'),
  ('arthouse-gallery', 'Arthouse Gallery', 'gallery', '66 McLachlan Avenue, Rushcutters Bay NSW', 'Rushcutters Bay', 'https://arthousegallery.com.au', '@arthousegallery', -33.8781, 151.2236, 'Sydney'),
  ('artspace', 'Artspace', 'gallery', '43–51 Cowper Wharf Roadway (The Gunnery), Woolloomooloo NSW', 'Woolloomooloo', 'https://www.artspace.org.au', '@artspacesydney', -33.8696, 151.2205, 'Sydney'),
  ('australian-galleries-sydney', 'Australian Galleries', 'gallery', '15 Roylston Street, Paddington NSW', 'Paddington', 'https://australiangalleries.com.au', '@australiangalleries', -33.881, 151.2246, 'Sydney'),
  ('bankstown-arts-centre', 'Bankstown Arts Centre', 'gallery', '5 Olympic Parade, Bankstown NSW', 'Bankstown', 'https://www.bankstownartscentre.com.au', '@bankstownartscentre', -33.9185, 151.0342, 'Sydney'),
  ('coma-gallery', 'COMA Gallery', 'gallery', '37 Chapel Street, Marrickville NSW', 'Marrickville', 'https://www.comagallery.com', '@comagallery', -33.9078, 151.164, 'Sydney'),
  ('campbelltown-arts-centre', 'Campbelltown Arts Centre', 'gallery', '1 Art Gallery Road, Campbelltown NSW', 'Campbelltown', 'https://c-a-c.com.au', '@campbelltownartscentre', -34.0728, 150.809, 'Sydney'),
  ('carriageworks', 'Carriageworks', 'gallery', '245 Wilson Street, Eveleigh NSW', 'Eveleigh', 'https://carriageworks.com.au', '@carriageworks', -33.8946, 151.1935, 'Sydney'),
  ('chalk-horse', 'Chalk Horse', 'gallery', '167 William Street (lower ground), Darlinghurst NSW', 'Darlinghurst', 'https://www.chalkhorse.com.au', '@chalkhorsegallery', -33.875, 151.2189, 'Sydney'),
  ('china-heights', 'China Heights Gallery', 'gallery', 'Level 3, 16–28 Foster Street, Surry Hills NSW', 'Surry Hills', 'https://chinaheights.com', '@chinaheights', -33.8797, 151.2103, 'Sydney'),
  ('darren-knight-gallery', 'Darren Knight Gallery', 'gallery', '840 Elizabeth Street, Waterloo NSW', 'Waterloo', 'https://darrenknightgallery.com', '@darrenknightgallery', -33.907, 151.2072, 'Sydney'),
  ('dominik-mersch-gallery', 'Dominik Mersch Gallery', 'gallery', '1/75 McLachlan Avenue, Rushcutters Bay NSW', 'Rushcutters Bay', 'https://dominikmerschgallery.com', '@dominikmerschgallery', -33.8783, 151.2238, 'Sydney'),
  ('fine-arts-sydney', 'Fine Arts, Sydney', 'gallery', '23 Hampden Street, Paddington NSW', 'Paddington', 'https://www.finearts.sydney', '@fineartssydney', -33.8828, 151.2211, 'Sydney'),
  ('gallery-lane-cove', 'Gallery Lane Cove', 'gallery', 'Level 3, 164 Longueville Road, Lane Cove NSW', 'Lane Cove', 'https://www.gallerylanecove.com.au', '@gallerylanecove', -33.816, 151.1697, 'Sydney'),
  ('granville-centre-art-gallery', 'Granville Centre Art Gallery', 'gallery', '1 Memorial Drive, Granville NSW', 'Granville', 'https://www.cumberland.nsw.gov.au/granville-centre-art-gallery', '@granvillecentreartgallery', -33.831, 151.014, 'Sydney'),
  ('hazelhurst-arts-centre', 'Hazelhurst Arts Centre', 'gallery', '782 Kingsway, Gymea NSW', 'Gymea', 'https://hazelhurst.sutherlandshire.nsw.gov.au', '@hazelhurstartscentre', -34.0329, 151.0874, 'Sydney'),
  ('king-street-gallery', 'King Street Gallery on William', 'gallery', '177 William Street, Darlinghurst NSW', 'Darlinghurst', 'https://kingstreetgallery.com.au', '@kingstreetgallery', -33.8747, 151.2184, 'Sydney'),
  ('liverpool-powerhouse', 'Casula Powerhouse Arts Centre', 'gallery', '1 Powerhouse Road, Casula NSW', 'Casula', 'https://www.liverpoolpowerhouse.com.au', '@liverpoolpowerhouse', -33.9493, 150.9129, 'Sydney'),
  ('manly-art-gallery-museum', 'Manly Art Gallery & Museum', 'gallery', '1a West Esplanade, Manly NSW', 'Manly', 'https://www.northernbeaches.nsw.gov.au/things-to-do/arts-and-culture/manly-art-gallery-museum', '@magamnsw', -33.7986, 151.2814, 'Sydney'),
  ('martin-browne-contemporary', 'Martin Browne Contemporary', 'gallery', '15 Hampden Street, Paddington NSW', 'Paddington', 'https://martinbrownecontemporary.com', '@martinbrownecontemporary', -33.8825, 151.2338, 'Sydney'),
  ('michael-reid-sydney', 'Michael Reid Sydney', 'gallery', '109 Shepherd Street, Chippendale NSW', 'Chippendale', 'https://michaelreid.com.au', '@michaelreidsydney', -33.8877, 151.1951, 'Sydney'),
  ('mosman-art-gallery', 'Mosman Art Gallery', 'gallery', '1 Art Gallery Way, Mosman NSW', 'Mosman', 'https://mosmanartgallery.org.au', '@mosmanart', -33.8279, 151.2406, 'Sydney'),
  ('n-smith-gallery', 'N.Smith Gallery', 'gallery', '15 Foster Street, Surry Hills NSW', 'Surry Hills', 'https://www.nsmithgallery.com', '@n.smithgallery', -33.88, 151.2097, 'Sydney'),
  ('nanda-hobbs', 'Nanda\Hobbs', 'gallery', '12–14 Meagher Street, Chippendale NSW', 'Chippendale', 'https://nandahobbs.com', '@nandahobbs', -33.8867, 151.1986, 'Sydney'),
  ('nas-gallery', 'National Art School Gallery', 'gallery', '156 Forbes Street, Darlinghurst NSW', 'Darlinghurst', 'https://nas.edu.au', '@nas_au', -33.8788, 151.2172, 'Sydney'),
  ('olsen-gallery', 'Olsen Gallery', 'gallery', '63 Jersey Road, Woollahra NSW', 'Woollahra', 'https://www.olsengallery.com', '@olsen_gallery', -33.8875, 151.2337, 'Sydney'),
  ('penrith-regional-gallery', 'Penrith Regional Gallery', 'gallery', '86 River Road, Emu Plains NSW', 'Emu Plains', 'https://www.penrithregionalgallery.com.au', '@penrithregionalgallery', -33.7458, 150.6669, 'Sydney'),
  ('phoenix-central-park', 'Phoenix Central Park', 'gallery', '37–49 O''Connor Street, Chippendale NSW', 'Chippendale', 'https://phoenixcentralpark.com.au', '@phoenixcentralpark', -33.8865, 151.199, 'Sydney'),
  ('roslyn-oxley9-gallery', 'Roslyn Oxley9 Gallery', 'gallery', '8 Soudan Lane, Paddington NSW', 'Paddington', 'https://www.roslynoxley9.com.au', '@roslynoxley9', -33.8826, 151.2341, 'Sydney'),
  ('sh-ervin-gallery', 'S.H. Ervin Gallery', 'gallery', 'Watson Road, Observatory Hill, Millers Point NSW', 'Millers Point', 'https://www.shervingallery.com.au', '@shervingallery', -33.8599, 151.2049, 'Sydney'),
  ('station-sydney', 'STATION Sydney', 'gallery', '91 Campbell Street, Surry Hills NSW', 'Surry Hills', 'https://stationgallery.com', '@stationgalleryaustralia', -33.8796, 151.2102, 'Sydney'),
  ('saint-cloche', 'Saint Cloche', 'gallery', '37 MacDonald Street, Paddington NSW', 'Paddington', 'https://saintcloche.com', '@saint_cloche', -33.8824, 151.2231, 'Sydney'),
  ('sullivan-strumpf', 'Sullivan+Strumpf', 'gallery', '799 Elizabeth Street, Zetland NSW', 'Zetland', 'https://www.sullivanstrumpf.com', '@sullivanstrumpf', -33.9065, 151.2067, 'Sydney'),
  ('unsw-galleries', 'UNSW Galleries', 'gallery', 'Cnr Oxford Street & Greens Road, Paddington NSW', 'Paddington', 'https://www.galleries.unsw.edu.au', '@unswgalleries', -33.8845, 151.2223, 'Sydney'),
  ('uts-gallery', 'UTS Gallery', 'gallery', 'Level 4, Building 6, 702 Harris Street, Ultimo NSW', 'Ultimo', 'https://art.uts.edu.au', '@uts_art', -33.8805, 151.2, 'Sydney'),
  ('utopia-art-sydney', 'Utopia Art Sydney', 'gallery', '983 Bourke Street, Waterloo NSW', 'Waterloo', 'https://utopiaartsydney.com.au', '@utopiaartsydney', -33.9, 151.2106, 'Sydney'),
  ('verge-gallery', 'Verge Gallery', 'gallery', 'Jane Foss Russell Plaza, 154 City Road, Darlington NSW', 'Darlington', 'https://www.verge-gallery.net', '@vergegallery', -33.8888, 151.1866, 'Sydney'),
  ('art-gallery-of-new-south-wales', 'Art Gallery of New South Wales', 'museum', 'Art Gallery Road, The Domain, Sydney NSW', 'Sydney', 'https://www.artgallery.nsw.gov.au', '@artgalleryofnsw', -33.8688, 151.2173, 'Sydney'),
  ('australian-museum', 'Australian Museum', 'museum', '1 William Street, Sydney NSW', 'Sydney', 'https://australian.museum', '@australianmuseum', -33.8712, 151.2133, 'Sydney'),
  ('chau-chak-wing-museum', 'Chau Chak Wing Museum', 'museum', 'University Place, University of Sydney, Camperdown NSW', 'Camperdown', 'https://www.sydney.edu.au/museum/', '@ccwm_sydney', -33.8853, 151.1905, 'Sydney'),
  ('fairfield-city-museum-gallery', 'Fairfield City Museum & Gallery', 'museum', '634 The Horsley Drive, Smithfield NSW', 'Smithfield', 'https://www.fcmg.nsw.gov.au', '@fairfieldcitymuseumgallery', -33.8481, 150.9427, 'Sydney'),
  ('mca-australia', 'Museum of Contemporary Art Australia', 'museum', '140 George Street, The Rocks NSW', 'The Rocks', 'https://www.mca.com.au', '@mca_australia', -33.8601, 151.209, 'Sydney'),
  ('museum-of-sydney', 'Museum of Sydney', 'museum', 'Cnr Phillip & Bridge Streets, Sydney NSW', 'Sydney', 'https://mhnsw.au/visit-us/museum-of-sydney/', '@museumsofhistorynsw', -33.8636, 151.2114, 'Sydney'),
  ('powerhouse-parramatta', 'Powerhouse Parramatta', 'museum', '34 Phillip Street, Parramatta NSW', 'Parramatta', 'https://powerhouse.com.au/visit/parramatta', '@powerhousemuseum', -33.81, 151.0044, 'Sydney'),
  ('sydney-jewish-museum', 'Sydney Jewish Museum', 'museum', '148 Darlinghurst Road, Darlinghurst NSW', 'Darlinghurst', 'https://sydneyjewishmuseum.com.au', '@sydneyjewishmuseum', -33.879, 151.2203, 'Sydney'),
  ('white-rabbit-gallery', 'White Rabbit Gallery', 'museum', '30 Balfour Street, Chippendale NSW', 'Chippendale', 'https://whiterabbitcollection.org', '@whiterabbitgallery', -33.8865, 151.2003, 'Sydney'),
  ('cement-fondu', 'Cement Fondu', 'gallery', '36 Gosbell Street, Paddington NSW', 'Paddington', 'https://cementfondu.org', '@cementfondu', -33.8776, 151.2222, 'Sydney'),
  ('vermilion-art', 'Vermilion Art', 'gallery', '16 Hickson Road, Dawes Point NSW', 'Dawes Point', 'https://www.vermilionart.com.au', null, -33.8563, 151.2044, 'Sydney'),
  ('107-projects', '107 Projects', 'ari', '107 Redfern Street, Redfern NSW', 'Redfern', 'https://107.org.au', '@107projects', -33.8925, 151.2044, 'Sydney'),
  ('australian-design-centre', 'Australian Design Centre', 'gallery', '101–115 William Street, Darlinghurst NSW', 'Darlinghurst', 'https://australiandesigncentre.com', '@austdesigncentre', -33.8755, 151.2166, 'Sydney'),
  ('galerie-pompom', 'Galerie pompom', 'gallery', '2/39 Abercrombie Street, Chippendale NSW', 'Chippendale', 'https://galeriepompom.com', '@galeriepompom', -33.8877, 151.1984, 'Sydney'),
  ('artereal-gallery', 'Artereal Gallery', 'gallery', '747 Darling Street, Rozelle NSW', 'Rozelle', 'https://artereal.com.au', '@arterealgallery', -33.8614, 151.171, 'Sydney'),
  ('defiance-gallery', 'Defiance Gallery', 'gallery', '47 Enmore Road, Newtown NSW', 'Newtown', 'https://www.defiancegallery.com', null, -33.899, 151.177, 'Sydney'),
  ('gallery-9', 'Gallery 9', 'gallery', '9 Darley Street, Darlinghurst NSW', 'Darlinghurst', 'https://www.gallery9.com.au', null, -33.883, 151.217, 'Sydney'),
  ('incinerator-art-space', 'Incinerator Art Space', 'gallery', '2 Small Street, Willoughby NSW', 'Willoughby', 'https://www.willoughby.nsw.gov.au/community/community-spaces/incinerator-art-space', null, -33.803, 151.19, 'Sydney'),
  ('delmar-gallery', 'Delmar Gallery', 'gallery', '144 Victoria Street, Ashfield NSW', 'Ashfield', null, null, -33.883, 151.125, 'Sydney'),
  ('woollahra-gallery-at-redleaf', 'Woollahra Gallery at Redleaf', 'gallery', '548 New South Head Road, Double Bay NSW', 'Double Bay', 'https://www.woollahra.nsw.gov.au/woollahragallery', null, -33.877, 151.245, 'Sydney'),
  ('16albermarle', '16albermarle Project Space', 'gallery', '16 Albermarle Street, Newtown NSW', 'Newtown', 'https://www.16albermarle.com', null, -33.898, 151.181, 'Sydney')
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


-- ---------------------------------------------------------------------------
-- v2 dataset (owner-supplied, July 2026): institutions, house museums, public
-- galleries, commercial tiers, ARIs, First Nations, day trips and auction
-- houses. verified_date stays null so the validation pipeline checks each one
-- (the ~35 verify-flagged entries surface in the first cycles).
insert into venues (slug, name, type, category, tier, editorial_note, address, suburb, website, instagram, latitude, longitude, city) values
  ('hyde-park-barracks', 'Hyde Park Barracks', 'museum', 'institution', '1', 'UNESCO-listed convict barracks on Macquarie Street.', null, 'Sydney', 'https://mhnsw.au', null, -33.8712, 151.2124, 'Sydney'),
  ('justice-police-museum', 'Justice & Police Museum', 'museum', 'institution', '1', 'Forensic photography and crime history in the old water police court - weekends only.', null, 'Sydney', 'https://mhnsw.au', null, -33.8623, 151.2119, 'Sydney'),
  ('state-library-of-nsw-galleries', 'State Library of NSW Galleries', 'museum', 'institution', '1', 'Underrated free exhibitions from the state collection.', null, 'Sydney', 'https://www.sl.nsw.gov.au', null, -33.8668, 151.213, 'Sydney'),
  ('brett-whiteley-studio', 'Brett Whiteley Studio', 'museum', 'institution', '1', 'Whiteley''s studio kept as he left it, run by the Art Gallery of NSW.', null, 'Surry Hills', null, null, -33.8845, 151.2153, 'Sydney'),
  ('australian-national-maritime-museum', 'Australian National Maritime Museum', 'museum', 'institution', '1', 'Wildlife Photographer of the Year among the masts.', null, 'Darling Harbour', 'https://www.sea.museum', null, -33.869, 151.1985, 'Sydney'),
  ('customs-house', 'Customs House', 'gallery', 'institution', '1', 'Free City of Sydney exhibitions opposite Circular Quay.', null, 'Sydney', null, null, -33.8623, 151.2107, 'Sydney'),
  ('rose-seidler-house', 'Rose Seidler House', 'museum', 'institution', '1b', 'Harry Seidler''s mid-century masterpiece; home of the Fifties Fair.', null, 'Wahroonga', 'https://mhnsw.au', null, -33.7275, 151.1092, 'Sydney'),
  ('vaucluse-house', 'Vaucluse House', 'museum', 'institution', '1b', 'Colonial estate with intact interiors and gardens.', null, 'Vaucluse', 'https://mhnsw.au', null, -33.8554, 151.278, 'Sydney'),
  ('elizabeth-bay-house', 'Elizabeth Bay House', 'museum', 'institution', '1b', '''The finest house in the colony'' - an architecture icon.', null, 'Elizabeth Bay', 'https://mhnsw.au', null, -33.8702, 151.2262, 'Sydney'),
  ('old-government-house', 'Old Government House', 'museum', 'institution', '1b', 'Australia''s oldest public building, in Parramatta Park.', null, 'Parramatta', null, null, -33.811, 150.999, 'Sydney'),
  ('nutcote-may-gibbs-house', 'Nutcote (May Gibbs'' House)', 'museum', 'institution', '1b', 'The illustrator of the gumnut babies, at home.', null, 'Neutral Bay', null, null, -33.839, 151.222, 'Sydney'),
  ('macquarie-university-art-gallery', 'Macquarie University Art Gallery', 'gallery', 'public', '2', 'University collection and program on the north side.', null, 'Macquarie Park', null, null, -33.777, 151.113, 'Sydney'),
  ('margaret-whitlam-galleries', 'Margaret Whitlam Galleries', 'gallery', 'public', '2', 'Western Sydney University galleries in the Female Orphan School.', null, 'Parramatta', null, null, -33.818, 151.023, 'Sydney'),
  ('the-cross-art-projects', 'The Cross Art Projects', 'gallery', 'public', '2', 'Small curatorial non-profit with a political edge.', null, 'Kings Cross', null, null, -33.874, 151.2225, 'Sydney'),
  ('bondi-pavilion-gallery', 'Bondi Pavilion Gallery', 'gallery', 'public', '2', 'Waverley Council''s gallery in the restored beachfront pavilion.', null, 'Bondi Beach', null, null, -33.891, 151.276, 'Sydney'),
  ('art-space-on-the-concourse', 'Art Space on The Concourse', 'gallery', 'public', '2', 'Willoughby Council''s exhibition space on the North Shore.', null, 'Chatswood', null, null, -33.796, 151.183, 'Sydney'),
  ('juniper-hall', 'Juniper Hall', 'gallery', 'public', '2', 'Georgian landmark, home of the Moran Prizes.', null, 'Paddington', null, null, -33.884, 151.227, 'Sydney'),
  ('artbank', 'Artbank', 'gallery', 'public', '2', 'The government''s lending collection - occasional public program.', null, 'Waterloo', null, null, -33.9, 151.207, 'Sydney'),
  ('blacktown-arts', 'Blacktown Arts', 'gallery', 'public', '2b', 'First Nations and Western Sydney focus in the Leo Kelly Centre.', null, 'Blacktown', null, null, -33.771, 150.906, 'Sydney'),
  ('parramatta-artists-studios', 'Parramatta Artists'' Studios', 'ari', 'public', '2b', 'Council studios with open-studio nights.', null, 'Parramatta', null, null, -33.815, 151.005, 'Sydney'),
  ('hawkesbury-regional-gallery', 'Hawkesbury Regional Gallery', 'gallery', 'public', '2b', 'Regional gallery on Sydney''s north-west edge.', null, 'Windsor', null, null, -33.613, 150.814, 'Sydney'),
  ('hurstville-museum-gallery', 'Hurstville Museum & Gallery', 'museum', 'public', '2b', 'Georges River Council museum and gallery.', null, 'Hurstville', null, null, -33.967, 151.103, 'Sydney'),
  ('peacock-gallery', 'Peacock Gallery', 'gallery', 'public', '2b', 'Small gallery in the Auburn Botanic Gardens.', null, 'Auburn', null, null, -33.853, 151.028, 'Sydney'),
  ('museums-discovery-centre', 'Museums Discovery Centre', 'museum', 'public', '2b', 'The Powerhouse''s open store - tours through the collection.', null, 'Castle Hill', null, null, -33.732, 150.98, 'Sydney'),
  ('sarah-cottier-gallery', 'Sarah Cottier Gallery', 'gallery', 'commercial', '3', 'Minimal and conceptual since the nineties.', null, 'Paddington', null, null, -33.884, 151.226, 'Sydney'),
  ('the-commercial', 'The Commercial', 'gallery', 'commercial', '3', 'Sharp conceptual program with a devoted following.', null, 'Marrickville', null, null, -33.911, 151.155, 'Sydney'),
  ('wagner-contemporary', 'Wagner Contemporary', 'gallery', 'commercial', '3', 'Approachable contemporary painting on Oxford Street.', null, 'Paddington', null, null, -33.885, 151.227, 'Sydney'),
  ('piermarq', 'Piermarq', 'gallery', 'commercial', '3', 'International program pitched at a younger crowd.', null, 'Paddington', null, null, -33.884, 151.225, 'Sydney'),
  ('gallery-sally-dan-cuthbert', 'Gallery Sally Dan-Cuthbert', 'gallery', 'commercial', '3', 'Art crossed with collectible design.', null, 'Rushcutters Bay', null, null, -33.875, 151.225, 'Sydney'),
  ('annette-larkin-fine-art', 'Annette Larkin Fine Art', 'gallery', 'commercial', '3', 'Secondary-market specialist.', null, 'Darlinghurst', null, null, -33.879, 151.217, 'Sydney'),
  ('maunsell-wickes', 'Maunsell Wickes', 'gallery', 'commercial', '3', 'Long-established rooms on Glenmore Road.', null, 'Paddington', null, null, -33.885, 151.224, 'Sydney'),
  ('richard-martin-art', 'Richard Martin Art', 'gallery', 'commercial', '3', 'Modern and contemporary secondary market.', null, 'Woollahra', null, null, -33.888, 151.24, 'Sydney'),
  ('harvey-galleries', 'Harvey Galleries', 'gallery', 'commercial', '3', 'Commercial stalwart with harbourside clientele.', null, 'Mosman', null, null, -33.828, 151.244, 'Sydney'),
  ('wentworth-galleries', 'Wentworth Galleries', 'gallery', 'commercial', '3', 'CBD commercial gallery.', null, 'Sydney', null, null, -33.868, 151.211, 'Sydney'),
  ('jerico-contemporary', 'Jerico Contemporary', 'gallery', 'commercial', '3b', 'Young and elegant, by the finger wharf.', null, 'Woolloomooloo', null, null, -33.87, 151.22, 'Sydney'),
  ('m-contemporary', 'M Contemporary', 'gallery', 'commercial', '3b', 'Strong curation on Ocean Street.', null, 'Woollahra', null, null, -33.885, 151.24, 'Sydney'),
  ('stanley-street-gallery', 'Stanley Street Gallery', 'gallery', 'commercial', '3b', 'Contemporary art and studio jewellery.', null, 'Darlinghurst', null, null, -33.878, 151.218, 'Sydney'),
  ('curatorial-co', 'Curatorial+Co', 'gallery', 'commercial', '3b', 'Online-first gallery with a physical space.', null, 'Redfern', null, null, -33.892, 151.204, 'Sydney'),
  ('flinders-street-gallery', 'Flinders Street Gallery', 'gallery', 'commercial', '3b', 'Painting-focused program.', null, 'Surry Hills', null, null, -33.886, 151.214, 'Sydney'),
  ('black-eye-gallery', 'Black Eye Gallery', 'gallery', 'commercial', '3b', 'Photography specialist.', null, 'Darlinghurst', null, null, -33.879, 151.218, 'Sydney'),
  ('gaffa-gallery', 'Gaffa Gallery', 'gallery', 'commercial', '3b', 'Craft and photography across two floors.', null, 'Sydney', null, null, -33.876, 151.207, 'Sydney'),
  ('sabbia-gallery', 'Sabbia Gallery', 'gallery', 'commercial', '3b', 'Glass and ceramics at the highest level.', null, 'Redfern', null, null, -33.893, 151.205, 'Sydney'),
  ('ambush-gallery', 'Ambush Gallery', 'gallery', 'commercial', '3b', 'Street-leaning contemporary at Central Park.', null, 'Chippendale', null, null, -33.887, 151.2, 'Sydney'),
  ('traffic-jam-galleries', 'Traffic Jam Galleries', 'gallery', 'commercial', '3b', 'Lower North Shore contemporary.', null, 'Neutral Bay', null, null, -33.832, 151.218, 'Sydney'),
  ('art2muse', 'Art2Muse', 'gallery', 'commercial', '3b', 'Eastern-suburbs contemporary.', null, 'Double Bay', null, null, -33.877, 151.243, 'Sydney'),
  ('studio-gallery', 'Studio Gallery', 'gallery', 'commercial', '3b', 'Melbourne group with a Sydney room.', null, 'Waterloo', null, null, -33.9, 151.206, 'Sydney'),
  ('badger-fox-gallery', 'Badger & Fox Gallery', 'gallery', 'commercial', '3b', 'Contemporary rooms off Crown Street.', null, 'Surry Hills', null, null, -33.886, 151.212, 'Sydney'),
  ('goodspace', 'Goodspace', 'gallery', 'commercial', '3b', 'Young, fast-moving program.', null, 'Chippendale', null, null, -33.887, 151.199, 'Sydney'),
  ('sno-contemporary-art-projects', 'SNO Contemporary Art Projects', 'ari', 'ari', '4', 'Non-objective art, uncompromising.', null, 'Marrickville', null, null, -33.907, 151.156, 'Sydney'),
  ('knulp', 'Knulp', 'ari', 'ari', '4', 'Tiny, deeply insider artist-run space.', null, 'Sydney', null, null, -33.89, 151.19, 'Sydney'),
  ('harrington-street-gallery', 'Harrington Street Gallery', 'ari', 'ari', '4', 'Sydney''s oldest artists'' co-operative.', null, 'Chippendale', null, null, -33.887, 151.198, 'Sydney'),
  ('art-leven', 'Art Leven', 'gallery', 'first_nations', '3', 'The oldest specialist First Nations gallery, formerly Cooee Art.', null, 'Redfern', null, null, -33.893, 151.204, 'Sydney'),
  ('kate-owen-gallery', 'Kate Owen Gallery', 'gallery', 'first_nations', '3', 'Three floors of Aboriginal art.', null, 'Rozelle', 'https://www.kateowengallery.com', null, -33.861, 151.171, 'Sydney'),
  ('aboriginal-contemporary', 'Aboriginal Contemporary', 'gallery', 'first_nations', '3', 'Community-sourced work from the deserts and the Top End.', null, 'Bronte', null, null, -33.905, 151.264, 'Sydney'),
  ('gannon-house-gallery', 'Gannon House Gallery', 'gallery', 'first_nations', '3', 'Aboriginal and Australian art in The Rocks.', null, 'The Rocks', null, null, -33.859, 151.209, 'Sydney'),
  ('spirit-gallery', 'Spirit Gallery', 'gallery', 'first_nations', '3', 'Accessible First Nations art and objects.', null, 'The Rocks', null, null, -33.859, 151.209, 'Sydney'),
  ('apy-gallery', 'APY Gallery', 'gallery', 'first_nations', '3', 'Artist-owned gallery of the APY Lands studios.', null, 'Darlinghurst', null, null, -33.879, 151.217, 'Sydney'),
  ('d-lan-contemporary', 'D''Lan Contemporary', 'gallery', 'first_nations', '3', 'Blue-chip secondary market for First Nations masters.', null, 'Sydney', null, null, -33.87, 151.21, 'Sydney'),
  ('wollongong-art-gallery', 'Wollongong Art Gallery', 'gallery', 'day_trip', '2', 'The largest regional gallery south of Sydney.', null, 'Wollongong', null, null, -34.424, 150.893, 'Sydney'),
  ('ngununggula', 'Ngununggula', 'gallery', 'day_trip', '2', 'Southern Highlands regional with a sharp program.', null, 'Bowral', 'https://ngununggula.com', null, -34.478, 150.42, 'Sydney'),
  ('bundanon', 'Bundanon', 'museum', 'day_trip', '1', 'Arthur Boyd''s gift - art museum and the Kerstin Thompson bridge in the bush.', null, 'Illaroo', 'https://www.bundanon.com.au', null, -34.85, 150.51, 'Sydney'),
  ('blue-mountains-cultural-centre', 'Blue Mountains Cultural Centre', 'gallery', 'day_trip', '2', 'Regional gallery with an escarpment view.', null, 'Katoomba', null, null, -33.712, 150.312, 'Sydney'),
  ('newcastle-art-gallery', 'Newcastle Art Gallery', 'gallery', 'day_trip', '2', 'Reopened after a major expansion.', null, 'Newcastle', null, null, -32.928, 151.771, 'Sydney'),
  ('the-lock-up', 'The Lock-Up', 'gallery', 'day_trip', '2', 'Contemporary art in the old police lock-up.', null, 'Newcastle', null, null, -32.927, 151.779, 'Sydney'),
  ('maitland-regional-art-gallery', 'Maitland Regional Art Gallery', 'gallery', 'day_trip', '2', 'Hunter Valley regional with generous programming.', null, 'Maitland', null, null, -32.733, 151.557, 'Sydney'),
  ('gosford-regional-gallery', 'Gosford Regional Gallery', 'gallery', 'day_trip', '2', 'Central Coast gallery with the Edogawa garden.', null, 'Gosford', null, null, -33.426, 151.342, 'Sydney'),
  ('smith-singer', 'Smith & Singer', 'gallery', 'auction', '3', 'Sotheby''s-licensed auction house.', null, 'Sydney', null, null, -33.869, 151.21, 'Sydney'),
  ('deutscher-and-hackett', 'Deutscher and Hackett', 'gallery', 'auction', '3', 'Major Australian art auctions.', null, 'Paddington', null, null, -33.884, 151.226, 'Sydney'),
  ('menzies', 'Menzies', 'gallery', 'auction', '3', 'Australian and international art auctions.', null, 'Kensington', null, null, -33.92, 151.222, 'Sydney'),
  ('shapiro-auctioneers', 'Shapiro Auctioneers', 'gallery', 'auction', '3', 'Art, design and decorative arts.', null, 'Woollahra', null, null, -33.888, 151.24, 'Sydney'),
  ('bonhams-australia', 'Bonhams Australia', 'gallery', 'auction', '3', 'International house, Australian salerooms.', null, 'Double Bay', null, null, -33.877, 151.243, 'Sydney'),
  ('leonard-joel-sydney', 'Leonard Joel Sydney', 'gallery', 'auction', '3', 'Auctions across art and objects.', null, 'Woollahra', null, null, -33.888, 151.24, 'Sydney')
on conflict (slug) do update set
  name = excluded.name, type = excluded.type, category = excluded.category,
  tier = excluded.tier, editorial_note = excluded.editorial_note,
  suburb = excluded.suburb, website = coalesce(excluded.website, venues.website),
  latitude = excluded.latitude, longitude = excluded.longitude, city = excluded.city;

-- closed per the v2 register: archive, never delete
update venues set status = 'archived', verification_source = 'owner register v2'
  where slug in ('may-space', 'liverpool-street-gallery');

-- ---------------------------------------------------------------------------
-- Opening hours — verified against the venues' own sites on 2026-07-21.
-- (Requires migration 0009_opening_hours.sql.)
-- ---------------------------------------------------------------------------
update venues set opening_hours = x.hours, hours_checked = date '2026-07-21'
from (values
  ('art-gallery-of-new-south-wales', 'Daily 10:00–17:00, Wed until 22:00'),
  ('mca-australia',                  'Wed–Mon 10:00–17:00, closed Tue'),
  ('white-rabbit-gallery',           'Wed–Sun 10:00–17:00'),
  ('artspace',                       'Tue–Sun 11:00–17:00'),
  ('chau-chak-wing-museum',          'Mon–Fri 10:00–17:00, Sat–Sun 12:00–16:00'),
  ('sh-ervin-gallery',               'Tue–Sun 11:00–17:00'),
  ('mosman-art-gallery',             'Daily 10:00–17:00'),
  ('manly-art-gallery-museum',       'Tue–Sun 10:00–17:00'),
  ('campbelltown-arts-centre',       'Daily 10:00–16:00'),
  ('firstdraft',                     'Wed 11:00–20:00, Thu–Sat 11:00–17:00'),
  ('king-street-gallery',            'Tue–Sat 10:00–18:00'),
  ('olsen-gallery',                  'Tue–Fri 10:00–18:00, Sat 10:00–17:00'),
  ('roslyn-oxley9-gallery',          'Tue–Fri 10:00–18:00, Sat 11:00–18:00')
) as x(slug, hours)
where venues.slug = x.slug;

-- These three predate the slug backfill in some databases — match by name.
update venues set opening_hours = x.hours, hours_checked = date '2026-07-21'
from (values
  ('Cassandra Bird',                 'Tue–Fri 10:00–17:00, Sat 11:00–17:00'),
  ('Ames Yavuz',                     'Tue–Sat 10:00–18:00'),
  ('Grace Cossington Smith Gallery', 'Tue–Sat 10:00–17:00 (during exhibitions)')
) as x(name, hours)
where venues.name = x.name;
