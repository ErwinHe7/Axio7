import type { HousingListing, HousingMatchResult, HousingPreference, RoommateMatch, RoommateProfile } from './types';

function includesAny(values: string[], target: string) {
  const lower = target.toLowerCase();
  return values.some((v) => lower.includes(v.toLowerCase()) || v.toLowerCase().includes(lower));
}

function commuteForSchool(listing: HousingListing, school: string) {
  const s = school.toLowerCase();
  if (s.includes('nyu')) return listing.commute.toNYU;
  if (s.includes('fordham')) return listing.commute.toFordham;
  if (s.includes('parsons') || s.includes('new school')) return listing.commute.toParsons ?? listing.commute.toNYU;
  if (s.includes('baruch')) return listing.commute.toNYU;
  return listing.commute.toColumbia;
}

export function scoreHousingListing(listing: HousingListing, pref: HousingPreference): HousingMatchResult {
  let score = 42;
  const reasons: string[] = [];

  if (listing.price >= pref.budgetMin && listing.price <= pref.budgetMax) {
    score += 18;
    reasons.push('Within your stated budget');
  } else if (listing.price <= pref.budgetMax + 250) {
    score += 8;
    reasons.push('Slightly above budget but still close');
  } else {
    score -= 14;
    reasons.push('Above your budget range');
  }

  const commute = commuteForSchool(listing, pref.school);
  if (typeof commute === 'number') {
    if (commute <= pref.maxCommuteMinutes) {
      score += 16;
      reasons.push(`${commute} min commute target fit`);
    } else if (commute <= pref.maxCommuteMinutes + 15) {
      score += 6;
      reasons.push(`${commute} min commute is workable but not ideal`);
    } else {
      score -= 12;
      reasons.push(`${commute} min commute is longer than your target`);
    }
  }

  if (pref.preferredNeighborhoods.length && includesAny(pref.preferredNeighborhoods, listing.neighborhood)) {
    score += 14;
    reasons.push(`Matches preferred neighborhood: ${listing.neighborhood}`);
  } else if (pref.preferredBoroughs.length && includesAny(pref.preferredBoroughs, listing.borough)) {
    score += 7;
    reasons.push(`Matches preferred borough: ${listing.borough}`);
  }

  if (pref.roomType === 'any' || listing.roomType === pref.roomType) {
    score += 8;
    reasons.push('Room type fits your preference');
  }

  if (pref.acceptRoommates && String(listing.roomType).includes('room')) {
    score += 6;
    reasons.push('Roommate-friendly option lowers monthly cost');
  }

  if (listing.isEduVerifiedPost || listing.verificationStatus === 'proof_uploaded' || listing.verificationStatus === 'admin_verified') {
    score += 10;
    reasons.push('Verified student/source signal');
  }

  if (listing.noFee) {
    score += 4;
    reasons.push('No broker fee signal');
  }

  const riskPenalty = Math.round(listing.riskScore * 0.28);
  score -= riskPenalty;
  if (listing.riskScore >= 60) reasons.push('High risk score reduces ranking');

  const finalScore = Math.max(1, Math.min(99, Math.round(score)));
  return { listing: { ...listing, matchScore: finalScore, matchReasons: reasons }, score: finalScore, reasons, riskPenalty };
}

export function rankHousingListings(listings: HousingListing[], pref: HousingPreference) {
  return listings
    .map((listing) => scoreHousingListing(listing, pref))
    .sort((a, b) => b.score - a.score);
}

export function scoreRoommate(profile: RoommateProfile, pref: HousingPreference): RoommateMatch {
  let score = 45;
  const reasons: string[] = [];
  const cautions: string[] = [];

  if (profile.school.toLowerCase().includes(pref.school.toLowerCase()) || pref.school.toLowerCase().includes(profile.school.toLowerCase())) {
    score += 18;
    reasons.push(`Both connected to ${profile.school}`);
  }
  if (profile.budget <= pref.budgetMax && profile.budget >= pref.budgetMin - 250) {
    score += 16;
    reasons.push('Similar monthly budget');
  }
  if (profile.preferredNeighborhoods.some((n) => pref.preferredNeighborhoods.includes(n))) {
    score += 16;
    reasons.push('Overlapping preferred neighborhoods');
  }
  if (profile.cleanliness.toLowerCase().includes(pref.lifestyle.cleanliness.toLowerCase().slice(0, 5))) {
    score += 8;
    reasons.push('Similar cleanliness expectations');
  }
  if (profile.noiseTolerance.toLowerCase().includes(pref.lifestyle.noiseTolerance.toLowerCase().slice(0, 5))) {
    score += 8;
    reasons.push('Similar noise tolerance');
  }
  if (!profile.verified) {
    score -= 8;
    cautions.push('Not .edu verified yet');
  }

  return {
    id: `match-${profile.id}`,
    profile,
    score: Math.max(1, Math.min(99, Math.round(score))),
    reasons,
    cautions,
  };
}
