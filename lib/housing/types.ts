import { z } from 'zod';

export const HousingSourceType = z.enum(['student_sublet', 'building_website', 'manual', 'external_listing', 'seed_mock', 'csv_import', 'reviewed_link']);
export const HousingVerificationStatus = z.enum(['unverified', 'edu_verified', 'proof_uploaded', 'admin_verified', 'rejected']);
export const HousingRiskLevel = z.enum(['low', 'medium', 'high', 'blocked']);
export const HousingStatus = z.enum(['draft', 'active', 'paused', 'leased', 'expired', 'removed', 'needs_review']);
export const LeaseTerm = z.enum(['sublet', 'lease_takeover', 'long_term', 'short_term_30_plus']);
export const RoomType = z.enum(['studio', '1b1b', 'private_room', 'shared_room', 'any']);
export const EduVerificationMethod = z.enum(['edu_email', 'manual', 'none']);

export type HousingSourceType = z.infer<typeof HousingSourceType>;
export type HousingVerificationStatus = z.infer<typeof HousingVerificationStatus>;
export type HousingRiskLevel = z.infer<typeof HousingRiskLevel>;
export type HousingStatus = z.infer<typeof HousingStatus>;
export type LeaseTerm = z.infer<typeof LeaseTerm>;
export type RoomType = z.infer<typeof RoomType>;
export type EduVerificationMethod = z.infer<typeof EduVerificationMethod>;

export const HousingPreferenceSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  school: z.string().default('Columbia'),
  schoolEmail: z.string().email().optional().or(z.literal('')),
  budgetMin: z.number().int().nonnegative().default(1400),
  budgetMax: z.number().int().positive().default(2400),
  moveInDate: z.string().default('August'),
  leaseTerm: LeaseTerm.default('sublet'),
  preferredBoroughs: z.array(z.string()).default(['Manhattan']),
  preferredNeighborhoods: z.array(z.string()).default(['Morningside Heights', 'Upper West Side']),
  maxCommuteMinutes: z.number().int().positive().default(30),
  commuteTarget: z.string().default('Columbia University'),
  roomType: RoomType.default('private_room'),
  acceptRoommates: z.boolean().default(true),
  genderPreference: z.string().optional(),
  lifestyle: z.object({
    sleepSchedule: z.string().default('flexible'),
    cleanliness: z.string().default('clean'),
    noiseTolerance: z.string().default('quiet'),
    socialLevel: z.string().default('balanced'),
    cookingFrequency: z.string().default('sometimes'),
  }).default({}),
  mustHave: z.array(z.string()).default([]),
  niceToHave: z.array(z.string()).default([]),
  dealBreakers: z.array(z.string()).default([]),
  rawText: z.string().optional(),
  parsedConfidence: z.number().min(0).max(1).default(0.78),
});

export type HousingPreference = z.infer<typeof HousingPreferenceSchema>;

export type HousingCommute = {
  toColumbia?: number;
  toNYU?: number;
  toFordham?: number;
  toParsons?: number;
  toBaruch?: number;
  label?: string;
};

export type HousingListing = {
  id: string;
  sourceType: HousingSourceType;
  title: string;
  description: string;
  address?: string;
  borough: string;
  neighborhood: string;
  price: number;
  realMonthlyCost?: number;
  deposit?: number;
  brokerFee?: number;
  moveInDate?: string;
  leaseEndDate?: string;
  leaseTerm: LeaseTerm | string;
  roomType: RoomType | string;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  noFee?: boolean;
  amenities: string[];
  commute: HousingCommute;
  postedByUserId?: string;
  posterName?: string;
  isEduVerifiedPost: boolean;
  verificationStatus: HousingVerificationStatus;
  riskScore: number;
  riskLevel: HousingRiskLevel;
  riskReasons: string[];
  positiveSignals: string[];
  matchScore?: number;
  matchReasons?: string[];
  sourceUrl?: string;
  images: string[];
  status: HousingStatus;
  createdAt: string;
  updatedAt: string;
};

export type NeighborhoodIntel = {
  slug: string;
  name: string;
  borough: string;
  bestFor: string[];
  notIdealFor: string[];
  avgRentLevel: '$' | '$$' | '$$$' | '$$$$';
  commuteToColumbia?: number;
  commuteToNYU?: number;
  safetyFeeling: string;
  studentFriendliness: string;
  pros: string[];
  cons: string[];
  agentSummary: string;
};

export type RoommateProfile = {
  id: string;
  userId: string;
  name: string;
  school: string;
  budget: number;
  moveInDate: string;
  preferredNeighborhoods: string[];
  sleepSchedule: string;
  cleanliness: string;
  noiseTolerance: string;
  socialLevel: string;
  cookingFrequency: string;
  intro: string;
  verified: boolean;
};

export type RoommateMatch = {
  id: string;
  profile: RoommateProfile;
  score: number;
  reasons: string[];
  cautions: string[];
};

export type HousingRiskAssessment = {
  riskScore: number;
  riskLevel: HousingRiskLevel;
  riskReasons: string[];
  positiveSignals: string[];
};

export type HousingMatchResult = {
  listing: HousingListing;
  score: number;
  reasons: string[];
  riskPenalty: number;
};

export type OutreachScenario = 'subletter' | 'landlord' | 'leasing_office' | 'roommate' | 'risk_questions' | 'video_tour';

export type OutreachDraft = {
  scenario: OutreachScenario;
  language: 'en' | 'zh';
  subject: string;
  body: string;
  checklist: string[];
};

export type EduVerificationProfile = {
  schoolEmail: string;
  school: string;
  isEduVerified: boolean;
  verifiedAt?: string;
  verificationMethod: EduVerificationMethod;
};

export interface BuildingSourceAdapter {
  name: string;
  sourceUrl: string;
  fetchListings(): Promise<unknown[]>;
  normalize(raw: unknown): HousingListing;
}

export type AgentRunRecord = {
  id: string;
  agent: 'intake' | 'collector' | 'neighborhood' | 'matching' | 'risk' | 'roommate' | 'communication' | 'monitoring';
  status: 'queued' | 'running' | 'completed' | 'failed';
  input: unknown;
  output?: unknown;
  createdAt: string;
};
