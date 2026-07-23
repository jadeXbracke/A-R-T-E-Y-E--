import { Fair } from './types';
import { mapsSearchUrl } from './maps';

// Curated art-fair register. Host venues and addresses are fixed, verifiable
// locations. Edition DATES shift every year — every entry below is flagged
// `dates_estimated: true` and should be confirmed against the fair's official
// site before it is treated as final. Dates use the typical annual window.
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
    start_date: '2026-09-10',
    end_date: '2026-09-13',
    dates_estimated: true,
    description:
      "Australasia's largest international art fair, held at Carriageworks with over 90 galleries across painting, sculpture, installation and performance.",
    website: 'https://www.sydneycontemporary.com.au',
  },
  {
    id: 'f-melbourne-art-fair',
    name: 'Melbourne Art Fair',
    city: 'Melbourne',
    country: 'Australia',
    venue_name: 'Melbourne Convention and Exhibition Centre',
    address: '1 Convention Centre Place, South Wharf VIC 3006, Australia',
    latitude: -37.8258,
    longitude: 144.9536,
    start_date: '2027-02-19',
    end_date: '2027-02-22',
    dates_estimated: true,
    description:
      'A leading fair for contemporary art from Australia and the Asia-Pacific, presenting galleries, commissioned projects and First Nations art.',
    website: 'https://melbourneartfair.com',
  },
  {
    id: 'f-frieze-seoul',
    name: 'Frieze Seoul',
    city: 'Seoul',
    country: 'South Korea',
    venue_name: 'COEX',
    address: '513 Yeongdong-daero, Gangnam-gu, Seoul, South Korea',
    latitude: 37.5126,
    longitude: 127.0589,
    start_date: '2026-09-02',
    end_date: '2026-09-05',
    dates_estimated: true,
    description:
      "Frieze's Asian edition, running alongside Kiaf Seoul, bringing global and Korean galleries together at COEX in Gangnam.",
    website: 'https://www.frieze.com/fairs/frieze-seoul',
  },
  {
    id: 'f-armory-show',
    name: 'The Armory Show',
    city: 'New York',
    country: 'United States',
    venue_name: 'Javits Center',
    address: '429 11th Avenue, New York, NY 10001, United States',
    latitude: 40.7578,
    longitude: -74.0021,
    start_date: '2026-09-10',
    end_date: '2026-09-13',
    dates_estimated: true,
    description:
      "New York's flagship modern and contemporary art fair, held each September at the Javits Center and now part of the Frieze group.",
    website: 'https://www.thearmoryshow.com',
  },
  {
    id: 'f-frieze-london',
    name: 'Frieze London',
    city: 'London',
    country: 'United Kingdom',
    venue_name: "The Regent's Park",
    address: "The Regent's Park, London NW1 4NR, United Kingdom",
    latitude: 51.5313,
    longitude: -0.1524,
    start_date: '2026-10-14',
    end_date: '2026-10-18',
    dates_estimated: true,
    description:
      "A landmark of the contemporary art calendar, staged in a purpose-built tent in The Regent's Park alongside Frieze Masters and the Frieze Sculpture park.",
    website: 'https://www.frieze.com/fairs/frieze-london',
  },
  {
    id: 'f-art-basel-paris',
    name: 'Art Basel Paris',
    city: 'Paris',
    country: 'France',
    venue_name: 'Grand Palais',
    address: 'Avenue Winston Churchill, 75008 Paris, France',
    latitude: 48.8661,
    longitude: 2.3125,
    start_date: '2026-10-22',
    end_date: '2026-10-25',
    dates_estimated: true,
    description:
      "Art Basel's Paris edition under the glass roof of the restored Grand Palais, presenting leading international modern and contemporary galleries.",
    website: 'https://www.artbasel.com/paris',
  },
  {
    id: 'f-art-basel-miami-beach',
    name: 'Art Basel Miami Beach',
    city: 'Miami Beach',
    country: 'United States',
    venue_name: 'Miami Beach Convention Center',
    address: '1901 Convention Center Drive, Miami Beach, FL 33139, United States',
    latitude: 25.7955,
    longitude: -80.1338,
    start_date: '2026-12-03',
    end_date: '2026-12-06',
    dates_estimated: true,
    description:
      'The Americas edition of Art Basel and the anchor of Miami Art Week, with galleries from across the Americas, Europe, Asia and Africa.',
    website: 'https://www.artbasel.com/miami-beach',
  },
  {
    id: 'f-frieze-los-angeles',
    name: 'Frieze Los Angeles',
    city: 'Los Angeles',
    country: 'United States',
    venue_name: 'Santa Monica Airport',
    address: '3200 Airport Avenue, Santa Monica, CA 90405, United States',
    latitude: 34.0158,
    longitude: -118.4514,
    start_date: '2027-02-18',
    end_date: '2027-02-21',
    dates_estimated: true,
    description:
      "Frieze's West Coast fair, drawing galleries and collectors to Santa Monica each February during Los Angeles art week.",
    website: 'https://www.frieze.com/fairs/frieze-los-angeles',
  },
  {
    id: 'f-art-basel-hong-kong',
    name: 'Art Basel Hong Kong',
    city: 'Hong Kong',
    country: 'Hong Kong SAR',
    venue_name: 'Hong Kong Convention and Exhibition Centre',
    address: '1 Expo Drive, Wan Chai, Hong Kong',
    latitude: 22.2833,
    longitude: 114.1732,
    start_date: '2027-03-18',
    end_date: '2027-03-22',
    dates_estimated: true,
    description:
      "Art Basel's Asian edition, the leading platform for galleries and collectors across the Asia-Pacific region.",
    website: 'https://www.artbasel.com/hong-kong',
  },
  {
    id: 'f-tefaf-maastricht',
    name: 'TEFAF Maastricht',
    city: 'Maastricht',
    country: 'Netherlands',
    venue_name: 'MECC Maastricht',
    address: 'Forum 100, 6229 GV Maastricht, Netherlands',
    latitude: 50.8365,
    longitude: 5.7,
    start_date: '2027-03-13',
    end_date: '2027-03-22',
    dates_estimated: true,
    description:
      'The world\'s pre-eminent fair for fine art, antiques and design, spanning 7,000 years of art history with rigorous vetting.',
    website: 'https://www.tefaf.com',
  },
  {
    id: 'f-frieze-new-york',
    name: 'Frieze New York',
    city: 'New York',
    country: 'United States',
    venue_name: 'The Shed',
    address: '545 West 30th Street, New York, NY 10001, United States',
    latitude: 40.7539,
    longitude: -74.0021,
    start_date: '2027-05-05',
    end_date: '2027-05-09',
    dates_estimated: true,
    description:
      "Frieze's New York edition at The Shed in Hudson Yards, a tightly curated fair focused on contemporary galleries.",
    website: 'https://www.frieze.com/fairs/frieze-new-york',
  },
  {
    id: 'f-art-basel',
    name: 'Art Basel',
    city: 'Basel',
    country: 'Switzerland',
    venue_name: 'Messe Basel',
    address: 'Messeplatz 10, 4058 Basel, Switzerland',
    latitude: 47.5641,
    longitude: 7.6033,
    start_date: '2027-06-17',
    end_date: '2027-06-20',
    dates_estimated: true,
    description:
      'The original and flagship Art Basel fair, widely regarded as the most important event in the international art market calendar.',
    website: 'https://www.artbasel.com/basel',
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
