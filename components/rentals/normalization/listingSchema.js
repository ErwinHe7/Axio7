export const listingSourceTypes = {
  LIVE: "live",
  IMPORTED: "imported",
  DEMO: "demo",
};

export const listingSourceTypeLabels = {
  [listingSourceTypes.LIVE]: "Live real",
  [listingSourceTypes.IMPORTED]: "Imported real",
  [listingSourceTypes.DEMO]: "Demo sample",
};

export function createNormalizedListing() {
  return {
    id: "",
    title: "",
    sourceType: listingSourceTypes.DEMO,
    sourceTypeLabel: listingSourceTypeLabels[listingSourceTypes.DEMO],
    sourceStatusLabel: "",
    dataDisclosure: "",
    provider: "",
    providerId: "",
    providerListingId: "",
    providerStatusLabel: "",
    providerTargetLabel: "",
    importMethod: "",
    importedAt: "",
    updatedAt: "",
    lastUpdated: "",
    price: 0,
    pricePeriod: "month",
    neighborhood: "",
    borough: "",
    areaLabel: "",
    addressLabel: "",
    latitude: null,
    longitude: null,
    coordinates: null,
    roomType: "",
    furnished: false,
    roommateFriendly: false,
    brokerFee: false,
    brokerFeeAmount: 0,
    leaseTerm: {
      minMonths: null,
      maxMonths: null,
      type: "unknown",
    },
    availableDate: "",
    commuteEstimate: {},
    description: "",
    amenities: [],
    images: [],
    sourceUrl: "",
    sourceUrlLabel: "",
    contact: null,
    listingConfidence: 0,
    listingQualityScore: 0,
    dataCompleteness: 0,
    audienceTags: [],
    competitiveness: "medium",
    matchScore: 0,
    matchReasons: [],
    riskFlags: [],
    activeCommute: null,
    isRecommended: false,
    isVisibleOnMap: false,
    tags: [],
    highlights: [],
    outreachState: null,
  };
}

export function finalizeNormalizedListing(listing) {
  const latitude = toNullableNumber(listing.latitude ?? listing.coordinates?.lat);
  const longitude = toNullableNumber(listing.longitude ?? listing.coordinates?.lng);
  const coordinates =
    latitude !== null && longitude !== null
      ? { lat: latitude, lng: longitude }
      : null;
  const updatedAt = listing.updatedAt || listing.lastUpdated || "";
  const dataCompleteness = calculateDataCompleteness({
    ...listing,
    latitude,
    longitude,
    coordinates,
    updatedAt,
  });
  const listingConfidence = toNullableNumber(listing.listingConfidence ?? listing.listingQualityScore);

  return {
    ...listing,
    sourceTypeLabel:
      listing.sourceTypeLabel || listingSourceTypeLabels[listing.sourceType] || "Unknown source",
    latitude,
    longitude,
    coordinates,
    updatedAt,
    lastUpdated: updatedAt,
    listingConfidence: listingConfidence ?? dataCompleteness,
    listingQualityScore: listingConfidence ?? dataCompleteness,
    dataCompleteness,
  };
}

function calculateDataCompleteness(listing) {
  const checks = [
    Boolean(listing.title),
    Number(listing.price) > 0,
    Boolean(listing.neighborhood || listing.areaLabel || listing.addressLabel),
    Boolean(listing.coordinates),
    Boolean(listing.availableDate),
    Boolean(listing.leaseTerm?.minMonths),
    Boolean(listing.description),
    Boolean(listing.sourceUrl),
  ];

  return checks.filter(Boolean).length / checks.length;
}

function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
