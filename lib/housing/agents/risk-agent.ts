import type { HousingListing } from '../types';
import { assessHousingRisk } from '../risk';

export function runRiskAgent(listing: HousingListing) {
  const assessment = assessHousingRisk(listing);
  return {
    ...assessment,
    nextQuestions: [
      'Can you provide lease or building portal proof with private details redacted?',
      'Is a live video tour possible before any payment?',
      'Are landlord or building sublet approvals required?',
      'What is the full monthly cost including utilities, deposit, and fees?',
    ],
  };
}
