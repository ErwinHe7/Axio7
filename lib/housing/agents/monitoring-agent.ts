import type { HousingPreference } from '../types';
import { rankHousingListings } from '../scoring';
import { HOUSING_LISTINGS } from '../data';

export function runMonitoringAgent(preference: HousingPreference, minMatchScore = 80) {
  const matches = rankHousingListings(HOUSING_LISTINGS, preference).filter((m) => m.score >= minMatchScore);
  return {
    minMatchScore,
    matches,
    alerts: matches.map((match) => ({
      listingId: match.listing.id,
      title: match.listing.title,
      score: match.score,
      reason: match.reasons[0] ?? 'Strong match for saved search',
    })),
  };
}
