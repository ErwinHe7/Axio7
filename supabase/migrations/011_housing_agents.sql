-- AXIO7 Housing Agents commercial foundation

create type if not exists housing_source_type as enum ('student_sublet','building_website','manual','external_listing','seed_mock','csv_import','reviewed_link');
create type if not exists housing_verification_status as enum ('unverified','edu_verified','proof_uploaded','admin_verified','rejected');
create type if not exists housing_risk_level as enum ('low','medium','high','blocked');
create type if not exists housing_listing_status as enum ('draft','active','paused','leased','expired','removed','needs_review');
create type if not exists housing_lease_term as enum ('sublet','lease_takeover','long_term','short_term_30_plus');
create type if not exists housing_room_type as enum ('studio','1b1b','private_room','shared_room','any');
create type if not exists edu_verification_method as enum ('edu_email','manual','none');
create type if not exists edu_verification_status as enum ('unverified','pending','verified','rejected','expired');

alter table public.user_profiles
  add column if not exists school_email text,
  add column if not exists school text,
  add column if not exists edu_domain text,
  add column if not exists is_edu_verified boolean not null default false,
  add column if not exists edu_verification_status edu_verification_status not null default 'unverified',
  add column if not exists verified_at timestamptz,
  add column if not exists verification_method edu_verification_method not null default 'none',
  add column if not exists role text not null default 'user',
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.edu_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  school_email text not null,
  school text,
  edu_domain text,
  token_hash text,
  status edu_verification_status not null default 'pending',
  method edu_verification_method not null default 'edu_email',
  expires_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.housing_listings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  source_type housing_source_type not null default 'manual',
  title text not null,
  description text not null,
  address_text text,
  borough text not null,
  neighborhood text not null,
  lat double precision,
  lng double precision,
  monthly_rent_cents integer not null,
  real_monthly_cost_cents integer,
  deposit_cents integer,
  broker_fee_cents integer,
  no_fee boolean not null default false,
  furnished boolean,
  available_from date,
  available_to date,
  lease_term housing_lease_term not null default 'sublet',
  lease_term_months integer,
  room_type housing_room_type not null default 'private_room',
  bedrooms numeric,
  bathrooms numeric,
  amenities text[] not null default '{}',
  images text[] not null default '{}',
  source_url text,
  posted_by_user_id text,
  is_edu_verified_post boolean not null default false,
  verification_status housing_verification_status not null default 'unverified',
  risk_score integer not null default 50,
  risk_level housing_risk_level not null default 'medium',
  risk_reasons text[] not null default '{}',
  positive_signals text[] not null default '{}',
  match_score integer,
  commute_json jsonb not null default '{}'::jsonb,
  normalized_json jsonb not null default '{}'::jsonb,
  status housing_listing_status not null default 'active',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.housing_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  school text not null,
  school_email text,
  budget_min integer not null,
  budget_max integer not null,
  move_in_date text,
  lease_term housing_lease_term not null default 'sublet',
  preferred_boroughs text[] not null default '{}',
  preferred_neighborhoods text[] not null default '{}',
  max_commute_minutes integer not null default 30,
  commute_target text,
  room_type housing_room_type not null default 'private_room',
  accept_roommates boolean not null default true,
  gender_preference text,
  lifestyle jsonb not null default '{}'::jsonb,
  must_have text[] not null default '{}',
  nice_to_have text[] not null default '{}',
  deal_breakers text[] not null default '{}',
  raw_text text,
  parsed_confidence numeric not null default 0.75,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.housing_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text,
  housing_preference_id uuid references public.housing_preferences(id) on delete cascade,
  filters jsonb not null default '{}'::jsonb,
  alert_frequency text not null default 'daily',
  min_match_score integer not null default 80,
  enabled boolean not null default true,
  is_active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.housing_saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  housing_listing_id uuid references public.housing_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, housing_listing_id)
);

create table if not exists public.housing_saved_search_matches (
  id uuid primary key default gen_random_uuid(),
  saved_search_id uuid references public.housing_saved_searches(id) on delete cascade,
  housing_listing_id uuid references public.housing_listings(id) on delete cascade,
  match_score integer not null,
  seen boolean not null default false,
  dismissed boolean not null default false,
  contacted boolean not null default false,
  created_at timestamptz not null default now(),
  unique(saved_search_id, housing_listing_id)
);

create table if not exists public.housing_risk_assessments (
  id uuid primary key default gen_random_uuid(),
  housing_listing_id uuid references public.housing_listings(id) on delete cascade,
  risk_score integer not null,
  risk_level housing_risk_level not null,
  risk_reasons text[] not null default '{}',
  positive_signals text[] not null default '{}',
  rules_version text not null default 'v1',
  created_at timestamptz not null default now()
);

create table if not exists public.nyc_neighborhoods (
  slug text primary key,
  name text not null,
  borough text not null,
  best_for text[] not null default '{}',
  not_ideal_for text[] not null default '{}',
  avg_rent_level text not null,
  commute_to_columbia integer,
  commute_to_nyu integer,
  safety_feeling text,
  student_friendliness text,
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  agent_summary text,
  updated_at timestamptz not null default now()
);

create table if not exists public.roommate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  school text not null,
  budget integer not null,
  move_in_date text,
  preferred_neighborhoods text[] not null default '{}',
  sleep_schedule text,
  cleanliness text,
  noise_tolerance text,
  social_level text,
  cooking_frequency text,
  intro text,
  visible boolean not null default true,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roommate_matches (
  id uuid primary key default gen_random_uuid(),
  user_a text not null,
  user_b text not null,
  compatibility_score integer not null,
  reasons jsonb not null default '[]'::jsonb,
  status text not null default 'suggested',
  created_at timestamptz not null default now(),
  unique(user_a, user_b)
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  user_id text,
  housing_listing_id uuid references public.housing_listings(id) on delete set null,
  status text not null default 'completed',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  model text,
  cost_usd numeric,
  latency_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists housing_listings_status_idx on public.housing_listings(status);
create index if not exists housing_listings_neighborhood_idx on public.housing_listings(neighborhood);
create index if not exists housing_listings_borough_idx on public.housing_listings(borough);
create index if not exists housing_listings_price_idx on public.housing_listings(monthly_rent_cents);
create index if not exists housing_preferences_user_idx on public.housing_preferences(user_id);
create index if not exists housing_saved_searches_user_idx on public.housing_saved_searches(user_id);
create unique index if not exists roommate_profiles_user_unique_idx on public.roommate_profiles(user_id);
create index if not exists roommate_profiles_user_idx on public.roommate_profiles(user_id);
create index if not exists agent_runs_user_idx on public.agent_runs(user_id);
