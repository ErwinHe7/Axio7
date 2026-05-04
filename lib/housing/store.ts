import { randomUUID } from 'crypto';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import type { AgentRunRecord, HousingListing, HousingPreference, HousingRiskAssessment, RoommateProfile } from './types';
import { HOUSING_LISTINGS } from './data';

function usingDB() {
  return isSupabaseConfigured();
}

function centsToDollars(value?: number | null) {
  return Math.round((value ?? 0) / 100);
}

function dollarsToCents(value?: number | null) {
  return typeof value === 'number' ? value * 100 : null;
}

function rowToHousingListing(row: any): HousingListing {
  const commute = row.commute_json ?? {};
  return {
    id: row.id,
    sourceType: row.source_type,
    title: row.title,
    description: row.description,
    address: row.address_text ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    borough: row.borough,
    neighborhood: row.neighborhood,
    price: centsToDollars(row.monthly_rent_cents),
    realMonthlyCost: row.real_monthly_cost_cents ? centsToDollars(row.real_monthly_cost_cents) : undefined,
    deposit: row.deposit_cents ? centsToDollars(row.deposit_cents) : undefined,
    brokerFee: row.broker_fee_cents ? centsToDollars(row.broker_fee_cents) : undefined,
    moveInDate: row.available_from ?? undefined,
    leaseEndDate: row.available_to ?? undefined,
    leaseTerm: row.lease_term,
    roomType: row.room_type,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    furnished: row.furnished ?? undefined,
    noFee: row.no_fee ?? false,
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    commute,
    postedByUserId: row.posted_by_user_id ?? undefined,
    isEduVerifiedPost: row.is_edu_verified_post ?? false,
    verificationStatus: row.verification_status,
    riskScore: row.risk_score ?? 50,
    riskLevel: row.risk_level ?? 'medium',
    riskReasons: Array.isArray(row.risk_reasons) ? row.risk_reasons : [],
    positiveSignals: Array.isArray(row.positive_signals) ? row.positive_signals : [],
    matchScore: row.match_score ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    images: Array.isArray(row.images) ? row.images : [],
    status: row.status ?? 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listingToRow(listing: HousingListing) {
  return {
    id: listing.id.startsWith('hx-user-') ? undefined : listing.id,
    source_type: listing.sourceType,
    title: listing.title,
    description: listing.description,
    address_text: listing.address ?? null,
    lat: listing.lat ?? null,
    lng: listing.lng ?? null,
    borough: listing.borough,
    neighborhood: listing.neighborhood,
    monthly_rent_cents: dollarsToCents(listing.price) ?? 0,
    real_monthly_cost_cents: dollarsToCents(listing.realMonthlyCost ?? listing.price),
    deposit_cents: dollarsToCents(listing.deposit),
    broker_fee_cents: dollarsToCents(listing.brokerFee),
    no_fee: listing.noFee ?? false,
    furnished: listing.furnished ?? null,
    available_from: listing.moveInDate || null,
    available_to: listing.leaseEndDate || null,
    lease_term: listing.leaseTerm,
    room_type: listing.roomType,
    bedrooms: listing.bedrooms ?? null,
    bathrooms: listing.bathrooms ?? null,
    amenities: listing.amenities,
    images: listing.images,
    source_url: listing.sourceUrl ?? null,
    posted_by_user_id: listing.postedByUserId ?? null,
    is_edu_verified_post: listing.isEduVerifiedPost,
    verification_status: listing.verificationStatus,
    risk_score: listing.riskScore,
    risk_level: listing.riskLevel,
    risk_reasons: listing.riskReasons,
    positive_signals: listing.positiveSignals,
    match_score: listing.matchScore ?? null,
    commute_json: listing.commute,
    normalized_json: {},
    status: listing.status,
  };
}

export async function listHousingListings(filters: { borough?: string; neighborhood?: string; maxPrice?: number; verifiedOnly?: boolean; noFeeOnly?: boolean; maxRisk?: number } = {}): Promise<HousingListing[]> {
  if (!usingDB()) return filterListings(HOUSING_LISTINGS, filters);
  let query = supabaseAdmin().from('housing_listings').select('*').neq('status', 'removed').order('created_at', { ascending: false });
  if (filters.borough) query = query.eq('borough', filters.borough);
  if (filters.neighborhood) query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
  if (filters.maxPrice) query = query.lte('monthly_rent_cents', filters.maxPrice * 100);
  if (filters.noFeeOnly) query = query.eq('no_fee', true);
  if (filters.maxRisk) query = query.lte('risk_score', filters.maxRisk);
  if (filters.verifiedOnly) query = query.or('is_edu_verified_post.eq.true,verification_status.in.(edu_verified,proof_uploaded,admin_verified)');
  const { data, error } = await query;
  if (error) {
    console.error('[housing] listHousingListings fallback:', error.message);
    return filterListings(HOUSING_LISTINGS, filters);
  }
  const rows = (data ?? []).map(rowToHousingListing);
  return rows.length ? rows : filterListings(HOUSING_LISTINGS, filters);
}

export async function getHousingListing(id: string): Promise<HousingListing | null> {
  if (!usingDB()) return HOUSING_LISTINGS.find((listing) => listing.id === id) ?? null;
  const { data, error } = await supabaseAdmin().from('housing_listings').select('*').eq('id', id).maybeSingle();
  if (error) return HOUSING_LISTINGS.find((listing) => listing.id === id) ?? null;
  return data ? rowToHousingListing(data) : HOUSING_LISTINGS.find((listing) => listing.id === id) ?? null;
}

export async function createHousingListing(listing: HousingListing, risk?: HousingRiskAssessment): Promise<HousingListing> {
  if (!usingDB()) return listing;
  const { data, error } = await supabaseAdmin().from('housing_listings').insert(listingToRow(listing)).select('*').single();
  if (error) throw error;
  const saved = rowToHousingListing(data);
  if (risk) {
    await supabaseAdmin().from('housing_risk_assessments').insert({
      housing_listing_id: saved.id,
      risk_score: risk.riskScore,
      risk_level: risk.riskLevel,
      risk_reasons: risk.riskReasons,
      positive_signals: risk.positiveSignals,
    });
  }
  return saved;
}

export async function saveHousingListing(userId: string, listingId: string) {
  if (!usingDB()) return { id: `saved-${listingId}`, user_id: userId, housing_listing_id: listingId };
  const { data, error } = await supabaseAdmin()
    .from('housing_saved_listings')
    .upsert({ user_id: userId, housing_listing_id: listingId }, { onConflict: 'user_id,housing_listing_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listSavedHousingListings(userId: string): Promise<HousingListing[]> {
  if (!usingDB()) return [];
  const { data, error } = await supabaseAdmin()
    .from('housing_saved_listings')
    .select('housing_listing_id,housing_listings(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((row: any) => rowToHousingListing(row.housing_listings)).filter(Boolean);
}

export async function createSavedSearch(userId: string, filters: unknown, minMatchScore = 80) {
  if (!usingDB()) return { id: `saved-search-${Date.now()}`, user_id: userId, filters, min_match_score: minMatchScore };
  const { data, error } = await supabaseAdmin()
    .from('housing_saved_searches')
    .insert({ user_id: userId, name: 'AXIO7 housing search', filters, min_match_score: minMatchScore, enabled: true, is_active: true })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listSavedSearches(userId: string) {
  if (!usingDB()) return [];
  const { data, error } = await supabaseAdmin().from('housing_saved_searches').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function recordAgentRun(run: Omit<AgentRunRecord, 'id' | 'createdAt'> & { userId?: string; listingId?: string }) {
  if (!usingDB()) return;
  await supabaseAdmin().from('agent_runs').insert({
    agent: run.agent,
    user_id: run.userId ?? null,
    housing_listing_id: run.listingId ?? null,
    status: run.status,
    input: run.input ?? {},
    output: run.output ?? {},
  });
}

function filterListings(listings: HousingListing[], filters: { borough?: string; neighborhood?: string; maxPrice?: number; verifiedOnly?: boolean; noFeeOnly?: boolean; maxRisk?: number }) {
  return listings.filter((listing) => {
    if (filters.borough && listing.borough !== filters.borough) return false;
    if (filters.neighborhood && !listing.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())) return false;
    if (filters.maxPrice && listing.price > filters.maxPrice) return false;
    if (filters.noFeeOnly && !listing.noFee) return false;
    if (filters.maxRisk && listing.riskScore > filters.maxRisk) return false;
    if (filters.verifiedOnly && !listing.isEduVerifiedPost && !['edu_verified', 'proof_uploaded', 'admin_verified'].includes(listing.verificationStatus)) return false;
    return listing.status !== 'removed';
  });
}

function rowToPreference(row: any): HousingPreference {
  return {
    id: row.id,
    userId: row.user_id,
    school: row.school,
    schoolEmail: row.school_email ?? '',
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    moveInDate: row.move_in_date ?? 'Flexible',
    leaseTerm: row.lease_term,
    preferredBoroughs: row.preferred_boroughs ?? [],
    preferredNeighborhoods: row.preferred_neighborhoods ?? [],
    maxCommuteMinutes: row.max_commute_minutes,
    commuteTarget: row.commute_target ?? 'Columbia University',
    roomType: row.room_type,
    acceptRoommates: row.accept_roommates,
    genderPreference: row.gender_preference ?? undefined,
    lifestyle: row.lifestyle ?? {},
    mustHave: row.must_have ?? [],
    niceToHave: row.nice_to_have ?? [],
    dealBreakers: row.deal_breakers ?? [],
    rawText: row.raw_text ?? undefined,
    parsedConfidence: Number(row.parsed_confidence ?? 0.75),
  };
}

function preferenceToRow(userId: string, preference: HousingPreference) {
  return {
    user_id: userId,
    school: preference.school,
    school_email: preference.schoolEmail || null,
    budget_min: preference.budgetMin,
    budget_max: preference.budgetMax,
    move_in_date: preference.moveInDate,
    lease_term: preference.leaseTerm,
    preferred_boroughs: preference.preferredBoroughs,
    preferred_neighborhoods: preference.preferredNeighborhoods,
    max_commute_minutes: preference.maxCommuteMinutes,
    commute_target: preference.commuteTarget,
    room_type: preference.roomType,
    accept_roommates: preference.acceptRoommates,
    gender_preference: preference.genderPreference ?? null,
    lifestyle: preference.lifestyle,
    must_have: preference.mustHave,
    nice_to_have: preference.niceToHave,
    deal_breakers: preference.dealBreakers,
    raw_text: preference.rawText ?? null,
    parsed_confidence: preference.parsedConfidence,
    updated_at: new Date().toISOString(),
  };
}

export async function getHousingPreference(userId: string): Promise<HousingPreference | null> {
  if (!usingDB()) return null;
  const { data, error } = await supabaseAdmin()
    .from('housing_preferences')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToPreference(data);
}

export async function upsertHousingPreference(userId: string, preference: HousingPreference): Promise<HousingPreference> {
  if (!usingDB()) return { ...preference, userId };
  const existing = await getHousingPreference(userId);
  const row = preferenceToRow(userId, preference);
  const query = existing
    ? supabaseAdmin().from('housing_preferences').update(row).eq('id', existing.id).select('*').single()
    : supabaseAdmin().from('housing_preferences').insert(row).select('*').single();
  const { data, error } = await query;
  if (error) throw error;
  return rowToPreference(data);
}

function rowToRoommateProfile(row: any): RoommateProfile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name ?? 'Roommate seeker',
    school: row.school,
    budget: row.budget_max ?? row.budget ?? 0,
    moveInDate: row.move_in_date ?? 'Flexible',
    preferredNeighborhoods: row.preferred_neighborhoods ?? [],
    sleepSchedule: row.sleep_schedule ?? 'flexible',
    cleanliness: row.cleanliness ?? 'clean',
    noiseTolerance: row.noise_tolerance ?? 'moderate',
    socialLevel: row.social_level ?? 'balanced',
    cookingFrequency: row.cooking_frequency ?? 'sometimes',
    intro: row.intro ?? '',
    verified: row.verified ?? false,
  };
}

export async function getRoommateProfile(userId: string): Promise<RoommateProfile | null> {
  if (!usingDB()) return null;
  const { data, error } = await supabaseAdmin().from('roommate_profiles').select('*').eq('user_id', userId).eq('visible', true).maybeSingle();
  if (error || !data) return null;
  return rowToRoommateProfile(data);
}

export async function upsertRoommateProfile(userId: string, profile: Partial<RoommateProfile> & { name?: string }): Promise<RoommateProfile> {
  if (!usingDB()) {
    return {
      id: `rm-${userId}`,
      userId,
      name: profile.name ?? 'Roommate seeker',
      school: profile.school ?? 'Columbia',
      budget: profile.budget ?? 1800,
      moveInDate: profile.moveInDate ?? 'Flexible',
      preferredNeighborhoods: profile.preferredNeighborhoods ?? [],
      sleepSchedule: profile.sleepSchedule ?? 'flexible',
      cleanliness: profile.cleanliness ?? 'clean',
      noiseTolerance: profile.noiseTolerance ?? 'moderate',
      socialLevel: profile.socialLevel ?? 'balanced',
      cookingFrequency: profile.cookingFrequency ?? 'sometimes',
      intro: profile.intro ?? '',
      verified: profile.verified ?? false,
    };
  }
  const row = {
    user_id: userId,
    name: profile.name ?? 'Roommate seeker',
    school: profile.school ?? 'Columbia',
    budget: profile.budget ?? 1800,
    move_in_date: profile.moveInDate ?? null,
    preferred_neighborhoods: profile.preferredNeighborhoods ?? [],
    sleep_schedule: profile.sleepSchedule ?? null,
    cleanliness: profile.cleanliness ?? null,
    noise_tolerance: profile.noiseTolerance ?? null,
    social_level: profile.socialLevel ?? null,
    cooking_frequency: profile.cookingFrequency ?? null,
    intro: profile.intro ?? null,
    verified: profile.verified ?? false,
    visible: true,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin()
    .from('roommate_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) throw error;
  return rowToRoommateProfile(data);
}

export async function getSavedSearch(userId: string, savedSearchId: string) {
  if (!usingDB()) return null;
  const { data, error } = await supabaseAdmin()
    .from('housing_saved_searches')
    .select('*')
    .eq('id', savedSearchId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function recordSavedSearchRun(savedSearchId: string, matches: { listingId: string; score: number }[]) {
  if (!usingDB()) return;
  await supabaseAdmin().from('housing_saved_searches').update({ last_run_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', savedSearchId);
  if (matches.length) {
    await supabaseAdmin().from('housing_saved_search_matches').upsert(
      matches.map((match) => ({ saved_search_id: savedSearchId, housing_listing_id: match.listingId, match_score: match.score })),
      { onConflict: 'saved_search_id,housing_listing_id' }
    );
  }
}

export function buildDraftHousingListing(input: any, user: { id: string; name: string; email?: string | null }): HousingListing {
  const edu = Boolean(user.email?.toLowerCase().endsWith('.edu'));
  const now = new Date().toISOString();
  return {
    id: `hx-user-${randomUUID()}`,
    sourceType: input.sourceType ?? 'student_sublet',
    title: input.title,
    description: input.description,
    address: input.address || undefined,
    borough: input.borough,
    neighborhood: input.neighborhood,
    price: input.price,
    realMonthlyCost: input.price + Math.round((input.brokerFee ?? 0) / 12),
    deposit: input.deposit,
    brokerFee: input.brokerFee,
    moveInDate: input.moveInDate || undefined,
    leaseEndDate: input.leaseEndDate || undefined,
    leaseTerm: input.leaseTerm ?? 'sublet',
    roomType: input.roomType ?? 'private_room',
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    furnished: input.furnished,
    noFee: input.noFee,
    amenities: input.amenities ?? [],
    commute: {},
    postedByUserId: user.id,
    posterName: user.name,
    isEduVerifiedPost: edu,
    verificationStatus: edu ? 'edu_verified' : 'unverified',
    riskScore: 50,
    riskLevel: 'medium',
    riskReasons: [],
    positiveSignals: edu ? ['.edu verified poster'] : [],
    sourceUrl: input.sourceUrl,
    images: input.images ?? [],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}
