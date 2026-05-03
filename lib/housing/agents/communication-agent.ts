import type { HousingListing, HousingPreference, OutreachScenario } from '../types';
import { generateOutreachDraft } from '../outreach';

export function runCommunicationAgent(input: {
  listing: HousingListing;
  preference?: HousingPreference;
  scenario?: OutreachScenario;
  language?: 'en' | 'zh';
}) {
  return generateOutreachDraft(input);
}
