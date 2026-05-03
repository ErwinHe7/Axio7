import type { HousingListing, HousingPreference, OutreachDraft, OutreachScenario } from './types';

export function generateOutreachDraft({
  listing,
  preference,
  scenario = 'subletter',
  language = 'en',
}: {
  listing: HousingListing;
  preference?: HousingPreference;
  scenario?: OutreachScenario;
  language?: 'en' | 'zh';
}): OutreachDraft {
  const move = preference?.moveInDate ?? listing.moveInDate ?? 'your listed move-in date';
  const school = preference?.school ?? 'NYC student/newcomer';
  const subject = language === 'zh'
    ? `咨询房源：${listing.title}`
    : `Inquiry about ${listing.title}`;

  const checklist = [
    'Confirm exact availability and move-in date',
    'Confirm total monthly cost, deposit, broker fee, and utilities',
    'Ask whether video tour or in-person tour is possible',
    'Ask for lease/sublet permission proof before payment',
    'Avoid sending money before verification',
  ];

  if (language === 'zh') {
    return {
      scenario,
      language,
      subject,
      body: `你好，我是${school}，正在找纽约住房。我对你的房源「${listing.title}」感兴趣。请问现在还可以租吗？我的预计入住时间是 ${move}。\n\n想确认几个问题：月租和押金分别是多少？是否有 broker fee 或其他费用？是否可以视频看房？如果是转租，是否有 landlord/building approval 或 lease proof 可以在隐私打码后确认？\n\n谢谢！`,
      checklist,
    };
  }

  const target = scenario === 'roommate' ? 'roommate setup' : scenario === 'leasing_office' ? 'available unit' : 'listing';
  return {
    scenario,
    language,
    subject,
    body: `Hi, I’m a ${school} looking for housing in NYC. I’m interested in your ${target}: “${listing.title}.” Is it still available? My target move-in is ${move}.\n\nCould you confirm the monthly rent, deposit, broker fee or other fees, utilities, and whether a video tour is possible? If this is a sublet, could you also confirm landlord/building approval or provide lease proof with private details redacted before any payment?\n\nThank you!`,
    checklist,
  };
}
