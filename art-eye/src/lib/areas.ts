// Sydney districts for the venue directory — editorial groupings, not
// official boundaries. Unknown suburbs land in Greater Sydney.

export const AREAS = [
  'City & The Rocks',
  'East',
  'Inner West',
  'North',
  'Greater Sydney',
] as const;

export type Area = (typeof AREAS)[number];

const SUBURB_AREA: Record<string, Area> = {
  // city
  sydney: 'City & The Rocks',
  'the rocks': 'City & The Rocks',
  'the domain': 'City & The Rocks',
  haymarket: 'City & The Rocks',
  'millers point': 'City & The Rocks',
  'dawes point': 'City & The Rocks',
  ultimo: 'City & The Rocks',
  // east
  paddington: 'East',
  woollahra: 'East',
  darlinghurst: 'East',
  'surry hills': 'East',
  'potts point': 'East',
  'rushcutters bay': 'East',
  'double bay': 'East',
  woolloomooloo: 'East',
  // inner west & south inner
  chippendale: 'Inner West',
  newtown: 'Inner West',
  marrickville: 'Inner West',
  leichhardt: 'Inner West',
  alexandria: 'Inner West',
  waterloo: 'Inner West',
  zetland: 'Inner West',
  eveleigh: 'Inner West',
  redfern: 'Inner West',
  'st peters': 'Inner West',
  rozelle: 'Inner West',
  ashfield: 'Inner West',
  camperdown: 'Inner West',
  darlington: 'Inner West',
  // north
  mosman: 'North',
  manly: 'North',
  'lane cove': 'North',
  willoughby: 'North',
  wahroonga: 'North',
  hornsby: 'North',
  // greater
  parramatta: 'Greater Sydney',
  granville: 'Greater Sydney',
  bankstown: 'Greater Sydney',
  casula: 'Greater Sydney',
  campbelltown: 'Greater Sydney',
  penrith: 'Greater Sydney',
  'emu plains': 'Greater Sydney',
  gymea: 'Greater Sydney',
  smithfield: 'Greater Sydney',
};

export function areaForSuburb(suburb?: string | null): Area {
  if (!suburb) return 'Greater Sydney';
  return SUBURB_AREA[suburb.trim().toLowerCase()] ?? 'Greater Sydney';
}
