import type { HousingPreference } from '../types';
import { HOUSING_LISTINGS } from '../data';
import { rankHousingListings, scoreRoommate } from '../scoring';
import { ROOMMATE_PROFILES } from '../data';

export function runMatchingAgent(preference: HousingPreference) {
  const listingMatches = rankHousingListings(HOUSING_LISTINGS, preference);
  const roommateMatches = ROOMMATE_PROFILES
    .map((profile) => scoreRoommate(profile, preference))
    .sort((a, b) => b.score - a.score);

  return {
    listingMatches,
    roommateMatches,
    summary: `${listingMatches.length} housing candidates and ${roommateMatches.length} roommate candidates ranked with budget, commute, verification, lifestyle, and risk signals.`,
  };
}
