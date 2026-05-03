import type { HousingListing, HousingRiskAssessment } from './types';

export function assessHousingRisk(listing: HousingListing): HousingRiskAssessment {
  let score = 8;
  const riskReasons: string[] = [];
  const positiveSignals: string[] = [...listing.positiveSignals];

  if (listing.price < 1100 && ['Manhattan', 'Brooklyn'].includes(listing.borough)) {
    score += 28;
    riskReasons.push('Price is far below typical market for this area');
  }
  if (!listing.address && listing.sourceType !== 'student_sublet') {
    score += 14;
    riskReasons.push('Address or cross-street is missing');
  }
  if (!listing.sourceUrl && listing.sourceType !== 'student_sublet') {
    score += 10;
    riskReasons.push('No source URL or verified source reference');
  }
  if (!listing.isEduVerifiedPost && listing.sourceType === 'student_sublet') {
    score += 18;
    riskReasons.push('Student sublet poster is not .edu verified');
  }
  if (listing.verificationStatus === 'proof_uploaded') {
    score -= 12;
    positiveSignals.push('Lease/building proof uploaded');
  }
  if (listing.isEduVerifiedPost) {
    score -= 10;
    positiveSignals.push('.edu verified poster');
  }
  if (listing.noFee) positiveSignals.push('No broker fee signal');
  if (listing.commute.label) positiveSignals.push('Commute estimate available');

  const text = `${listing.title} ${listing.description}`.toLowerCase();
  if (/(zelle|venmo|wire|crypto|western union|deposit before|send deposit|urgent)/i.test(text)) {
    score += 24;
    riskReasons.push('Payment pressure or off-platform deposit language detected');
  }
  if (/(no video|cannot tour|no tour|too busy to show)/i.test(text)) {
    score += 14;
    riskReasons.push('Tour/video confirmation appears unavailable');
  }
  if (String(listing.leaseTerm).includes('short') && listing.price > 0) {
    score += 4;
    riskReasons.push('Short-term housing requires extra lease/sublet permission checks');
  }

  const riskScore = Math.max(0, Math.min(100, Math.round(score)));
  const riskLevel = riskScore >= 75 ? 'high' : riskScore >= 42 ? 'medium' : 'low';

  return {
    riskScore,
    riskLevel,
    riskReasons: riskReasons.length ? riskReasons : ['No major rule-based red flags detected. Still verify lease proof and payment terms.'],
    positiveSignals: Array.from(new Set(positiveSignals)).slice(0, 6),
  };
}
