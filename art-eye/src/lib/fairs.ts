import { Fair } from './types';
import { mapsSearchUrl } from './maps';

// Australian art-fair register — real fairs with web-verified 2026 dates
// (sources: sydneycontemporary.com.au, daaf.com.au, ciaf.com.au, checked Jul 2026).
// International fairs are out of scope for now.
const FAIRS: Fair[] = [
  {
    id: 'f-sydney-contemporary',
    name: 'Sydney Contemporary',
    city: 'Sydney',
    country: 'Australia',
    venue_name: 'Carriageworks',
    address: '245 Wilson Street, Eveleigh NSW 2015, Australia',
    latitude: -33.8946,
    longitude: 151.1935,
    start_date: '2026-09-03',
    end_date: '2026-09-06',
    dates_estimated: false,
    description:
      "Australasia's largest international art fair — its 10th edition at Carriageworks, with over 100 galleries and 500+ artists across painting, sculpture, installation and performance.",
    website: 'https://www.sydneycontemporary.com.au',
  },
  {
    id: 'f-daaf',
    name: 'Darwin Aboriginal Art Fair',
    city: 'Darwin',
    country: 'Australia',
    venue_name: 'Darwin Convention Centre',
    address: '10 Stokes Hill Road, Darwin City NT 0800, Australia',
    latitude: -12.4686,
    longitude: 130.8456,
    start_date: '2026-08-06',
    end_date: '2026-08-09',
    dates_estimated: false,
    description:
      "The country's leading ethical art fair for Aboriginal and Torres Strait Islander art — its 20th year on Larrakia Country, selling directly on behalf of Art Centres.",
    website: 'https://daaf.com.au',
  },
  {
    id: 'f-ciaf',
    name: 'Cairns Indigenous Art Fair',
    city: 'Cairns',
    country: 'Australia',
    venue_name: 'Cairns Convention Centre',
    address: 'Sheridan Street, Cairns City QLD 4870, Australia',
    latitude: -16.9236,
    longitude: 145.7736,
    start_date: '2026-07-09',
    end_date: '2026-07-12',
    dates_estimated: false,
    description:
      "Queensland's celebration of Aboriginal and Torres Strait Islander art and culture across Gimuy/Cairns — 2026 theme: Reclamation & Regeneration.",
    website: 'https://ciaf.com.au',
  },
];

// Every fair carries a Google Maps link built from its host venue + address.
export const SEED_FAIRS: Fair[] = FAIRS.map((f) => ({
  ...f,
  google_maps_url:
    f.google_maps_url ??
    mapsSearchUrl({ name: f.venue_name, address: f.address, city: f.city }),
}));

export function listFairs(): Fair[] {
  return SEED_FAIRS.slice().sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
}

export function getFair(id: string): Fair | undefined {
  return SEED_FAIRS.find((f) => f.id === id);
}
