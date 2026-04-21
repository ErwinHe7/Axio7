export const appConfig = {
  environment: "local",
  mapEngine: "maplibre",
  placeSearchEngine: "local-place-index",
  providerSettings: {
    airbnb: {
      enabled: true,
      sourceType: "demo",
      ingestionMode: "demo-fixture-adapter",
      providerStatusLabel: "Demo adapter",
      providerTargetLabel: "Airbnb target",
    },
    zillow: {
      enabled: true,
      sourceType: "demo",
      ingestionMode: "demo-fixture-adapter",
      providerStatusLabel: "Demo adapter",
      providerTargetLabel: "Zillow target",
    },
  },
  importedSources: {
    csvEnabled: true,
    linkIntakeEnabled: true,
  },
  outreach: {
    liveEmailEnabled: false,
    liveSmsEnabled: false,
    defaultFromEmail: "assist@rentalagent.local",
    defaultFromPhone: "+1 (555) 210-2040",
  },
  safety: {
    allowAutomaticBooking: false,
    allowAutomaticPayment: false,
    allowAutomaticSignature: false,
  },
};

export const destinationOptions = ["Columbia", "Midtown", "NYU"];

export const defaultPreferences = {
  placeQuery: "Columbia University",
  budgetMin: 1400,
  budgetMax: 2600,
  moveInDate: "2026-09-01",
  leaseMonths: 4,
  neighborhoods: "Morningside Heights, Upper West Side, Astoria",
  boroughs: ["Manhattan", "Queens"],
  maxCommuteMinutes: 30,
  commuteDestination: "Columbia",
  roomType: "private-room",
  furnished: "prefer-furnished",
  roommatePolicy: "roommate-ok",
  brokerFeePreference: "prefer-no-fee",
  leasePreference: "flexible-short-term",
};

export const presetProfiles = {
  columbia: {
    label: "Columbia",
    updates: {
      placeQuery: "Columbia University",
      budgetMin: 1400,
      budgetMax: 2400,
      moveInDate: "2026-09-01",
      leaseMonths: 4,
      neighborhoods: "Morningside Heights, Upper West Side, Washington Heights",
      boroughs: ["Manhattan"],
      maxCommuteMinutes: 28,
      commuteDestination: "Columbia",
      roomType: "private-room",
      furnished: "must-be-furnished",
      roommatePolicy: "roommate-ok",
      brokerFeePreference: "prefer-no-fee",
      leasePreference: "short-term-or-sublet",
    },
  },
  intern: {
    label: "Midtown",
    updates: {
      placeQuery: "Midtown Manhattan",
      budgetMin: 1800,
      budgetMax: 3200,
      moveInDate: "2026-06-10",
      leaseMonths: 3,
      neighborhoods: "Long Island City, Midtown East, Astoria",
      boroughs: ["Manhattan", "Queens", "Brooklyn"],
      maxCommuteMinutes: 35,
      commuteDestination: "Midtown",
      roomType: "studio",
      furnished: "must-be-furnished",
      roommatePolicy: "prefer-solo",
      brokerFeePreference: "must-avoid-fee",
      leasePreference: "short-term-or-sublet",
    },
  },
  nyu: {
    label: "NYU",
    updates: {
      placeQuery: "New York University",
      budgetMin: 1500,
      budgetMax: 2800,
      moveInDate: "2026-08-18",
      leaseMonths: 2,
      neighborhoods: "Lower East Side, East Village, Williamsburg",
      boroughs: ["Manhattan", "Brooklyn"],
      maxCommuteMinutes: 25,
      commuteDestination: "NYU",
      roomType: "private-room",
      furnished: "prefer-furnished",
      roommatePolicy: "roommate-ok",
      brokerFeePreference: "prefer-no-fee",
      leasePreference: "short-term-or-sublet",
    },
  },
};

export const primaryRoomTypes = [
  { value: "any", label: "Any type" },
  { value: "private-room", label: "Private room" },
  { value: "shared-room", label: "Shared room" },
  { value: "studio", label: "Studio" },
  { value: "1b", label: "1 bed" },
];
