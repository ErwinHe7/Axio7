import { HousingPreferenceSchema, type HousingPreference } from '../types';

const SCHOOL_ALIASES: Record<string, string> = {
  columbia: 'Columbia',
  nyu: 'NYU',
  fordham: 'Fordham',
  parsons: 'Parsons',
  baruch: 'Baruch',
};

export function parseHousingNeed(text: string): HousingPreference {
  const lower = text.toLowerCase();
  const schoolKey = Object.keys(SCHOOL_ALIASES).find((key) => lower.includes(key));
  const budgetMatch = lower.match(/\$?([1-4][0-9]{3})/);
  const commuteMatch = lower.match(/(\d{2})\s*(min|minutes)/);
  const neighborhoods = ['Morningside Heights', 'Upper West Side', 'Harlem', 'Long Island City', 'Astoria', 'Williamsburg', 'Jersey City', 'Hoboken']
    .filter((name) => lower.includes(name.toLowerCase()));
  const boroughs = ['Manhattan', 'Brooklyn', 'Queens']
    .filter((name) => lower.includes(name.toLowerCase()));

  return HousingPreferenceSchema.parse({
    school: schoolKey ? SCHOOL_ALIASES[schoolKey] : 'Columbia',
    budgetMax: budgetMatch ? Number(budgetMatch[1]) : lower.includes('cheap') ? 1800 : 2400,
    budgetMin: lower.includes('studio') ? 2200 : 1400,
    moveInDate: lower.includes('august') ? 'August' : lower.includes('september') ? 'September' : lower.includes('summer') ? 'Summer' : 'Flexible',
    leaseTerm: lower.includes('takeover') ? 'lease_takeover' : lower.includes('long') ? 'long_term' : 'sublet',
    preferredBoroughs: boroughs.length ? boroughs : ['Manhattan'],
    preferredNeighborhoods: neighborhoods.length ? neighborhoods : ['Morningside Heights', 'Upper West Side'],
    maxCommuteMinutes: commuteMatch ? Number(commuteMatch[1]) : 30,
    roomType: lower.includes('studio') ? 'studio' : lower.includes('1b') || lower.includes('1 bed') ? '1b1b' : lower.includes('shared') ? 'shared_room' : 'private_room',
    acceptRoommates: !lower.includes('no roommate') && !lower.includes('alone only'),
    lifestyle: {
      sleepSchedule: lower.includes('early') ? 'early' : lower.includes('late') ? 'late' : 'flexible',
      cleanliness: lower.includes('clean') ? 'very clean' : 'clean',
      noiseTolerance: lower.includes('quiet') || lower.includes('safe') ? 'quiet' : 'moderate',
      socialLevel: lower.includes('social') ? 'social' : 'balanced',
      cookingFrequency: lower.includes('cook') ? 'often' : 'sometimes',
    },
    mustHave: [lower.includes('furnished') ? 'furnished' : '', lower.includes('safe') ? 'safer-feeling area' : ''].filter(Boolean),
    niceToHave: [lower.includes('laundry') ? 'laundry' : '', lower.includes('no fee') ? 'no broker fee' : ''].filter(Boolean),
    dealBreakers: [lower.includes('no broker') ? 'broker fee' : '', lower.includes('scam') ? 'unverified poster' : ''].filter(Boolean),
    rawText: text,
    parsedConfidence: 0.82,
  });
}
