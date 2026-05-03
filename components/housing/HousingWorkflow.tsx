import { Bot, MessageSquare, Radar, ScanSearch, ShieldAlert, Sparkles, Users } from 'lucide-react';

const steps = [
  { icon: Sparkles, label: 'Intake Agent', body: 'Parses budget, school, dates, commute, room type, lifestyle, and dealbreakers.' },
  { icon: ScanSearch, label: 'Listing Collector', body: 'Normalizes verified sublets, building availability, imported CSVs, and reviewed links.' },
  { icon: Bot, label: 'Matching Agent', body: 'Ranks listings with budget, commute, verification, dates, source quality, and risk penalty.' },
  { icon: ShieldAlert, label: 'Risk Agent', body: 'Flags below-market prices, vague addresses, deposit pressure, missing proof, and unclear permission.' },
  { icon: Users, label: 'Roommate Agent', body: 'Scores roommate compatibility with school, budget, move-in, neighborhood, and lifestyle signals.' },
  { icon: MessageSquare, label: 'Communication Agent', body: 'Drafts English/Chinese outreach and the exact questions to ask before paying.' },
  { icon: Radar, label: 'Monitoring Agent', body: 'Watches saved searches and alerts users when high-match listings appear.' },
];

export function HousingWorkflow() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {steps.map((step) => (
        <div key={step.label} className="rounded-[22px] border p-4" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg,var(--r-pink),var(--r-violet))', boxShadow: '0 0 24px rgba(255,62,197,0.35)' }}>
              <step.icon className="h-5 w-5" />
            </span>
            <h3 className="font-bold text-white">{step.label}</h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>{step.body}</p>
        </div>
      ))}
    </div>
  );
}
