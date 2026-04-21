import {
  createNormalizedListing,
  finalizeNormalizedListing,
  listingSourceTypeLabels,
  listingSourceTypes,
} from "./listingSchema.js";

export function normalizeAirbnbListing(raw, providerMeta) {
  return finalizeNormalizedListing({
    ...createNormalizedListing(),
    id: `airbnb:${raw.id}`,
    title: raw.headline,
    sourceType: listingSourceTypes.DEMO,
    sourceTypeLabel: listingSourceTypeLabels[listingSourceTypes.DEMO],
    sourceStatusLabel: providerMeta.providerStatusLabel,
    dataDisclosure: "Demo sample listing. This is not a live Airbnb rental feed.",
    provider: "Airbnb",
    providerId: providerMeta.providerId,
    providerListingId: raw.id,
    providerStatusLabel: providerMeta.providerStatusLabel,
    providerTargetLabel: providerMeta.providerTargetLabel,
    updatedAt: raw.updatedAt,
    price: raw.monthlyRate,
    neighborhood: raw.neighborhood,
    borough: raw.borough,
    areaLabel: raw.approximateLocation,
    addressLabel: raw.approximateLocation,
    coordinates: raw.coordinates,
    roomType: raw.accommodationType,
    furnished: raw.furnished,
    roommateFriendly: raw.roommateFriendly,
    brokerFee: raw.brokerFeeAmount > 0,
    brokerFeeAmount: raw.brokerFeeAmount,
    leaseTerm: {
      minMonths: raw.lease.minMonths,
      maxMonths: raw.lease.maxMonths,
      type: raw.lease.kind,
    },
    availableDate: raw.lease.availabilityDate,
    commuteEstimate: raw.commuteEstimates,
    description: raw.description,
    amenities: raw.amenities,
    images: raw.images,
    sourceUrl: raw.sourceUrl,
    sourceUrlLabel: raw.sourceUrlLabel,
    contact: raw.contact,
    listingConfidence: raw.confidence,
    audienceTags: raw.audienceTags,
    competitiveness: raw.competitiveness,
  });
}

export function normalizeZillowListing(raw, providerMeta) {
  return finalizeNormalizedListing({
    ...createNormalizedListing(),
    id: `zillow:${raw.zpid}`,
    title: raw.marketingTitle,
    sourceType: listingSourceTypes.DEMO,
    sourceTypeLabel: listingSourceTypeLabels[listingSourceTypes.DEMO],
    sourceStatusLabel: providerMeta.providerStatusLabel,
    dataDisclosure: "Demo sample listing. This is not a live Zillow rental feed.",
    provider: "Zillow",
    providerId: providerMeta.providerId,
    providerListingId: raw.zpid,
    providerStatusLabel: providerMeta.providerStatusLabel,
    providerTargetLabel: providerMeta.providerTargetLabel,
    updatedAt: raw.updatedAt,
    price: raw.rent.amount,
    pricePeriod: raw.rent.period,
    neighborhood: raw.neighborhood,
    borough: raw.borough,
    areaLabel: raw.approximateAddress,
    addressLabel: raw.approximateAddress,
    coordinates: raw.geocode,
    roomType: raw.homeType,
    furnished: raw.furnishedState === "furnished",
    roommateFriendly: raw.roommatesAllowed,
    brokerFee: raw.fees.brokerFee,
    brokerFeeAmount: raw.fees.brokerFee ? raw.rent.amount : 0,
    leaseTerm: {
      minMonths: raw.leaseOptions.minimumMonths,
      maxMonths: raw.leaseOptions.maximumMonths,
      type: raw.leaseOptions.termKind,
    },
    availableDate: raw.leaseOptions.availableOn,
    commuteEstimate: raw.commute,
    description: raw.publicDescription,
    amenities: raw.amenities,
    images: raw.imageUrls,
    sourceUrl: raw.sourceUrl,
    sourceUrlLabel: raw.sourceUrlLabel,
    contact: raw.contact,
    listingConfidence: raw.qualitySignal,
    audienceTags: raw.homeType === "private-room" ? ["student-friendly"] : ["independent-unit"],
    competitiveness: raw.competitiveness,
  });
}

export function normalizeImportedListing(raw, providerMeta = {}) {
  return finalizeNormalizedListing({
    ...createNormalizedListing(),
    id: raw.id || `imported:${crypto.randomUUID()}`,
    title: raw.title,
    sourceType: listingSourceTypes.IMPORTED,
    sourceTypeLabel: listingSourceTypeLabels[listingSourceTypes.IMPORTED],
    sourceStatusLabel: raw.sourceStatusLabel || providerMeta.providerStatusLabel || "Imported real",
    dataDisclosure:
      raw.dataDisclosure ||
      "Imported real listing loaded locally. Review source link and original record before taking action.",
    provider: raw.provider || providerMeta.providerLabel || "Manual import",
    providerId: raw.providerId || providerMeta.providerId || "imported-real",
    providerListingId: raw.providerListingId || raw.id || "",
    providerStatusLabel: raw.providerStatusLabel || providerMeta.providerStatusLabel || "Imported real",
    providerTargetLabel:
      raw.providerTargetLabel || providerMeta.providerTargetLabel || "Imported source",
    importMethod: raw.importMethod || providerMeta.ingestionMode || "csv-upload",
    importedAt: raw.importedAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.lastUpdated || raw.importedAt || new Date().toISOString(),
    price: raw.price,
    pricePeriod: raw.pricePeriod || "month",
    neighborhood: raw.neighborhood || raw.areaLabel || "",
    borough: raw.borough || "",
    areaLabel: raw.areaLabel || raw.addressLabel || raw.neighborhood || "",
    addressLabel: raw.addressLabel || raw.areaLabel || "",
    latitude: raw.latitude,
    longitude: raw.longitude,
    roomType: raw.roomType || "private-room",
    furnished: Boolean(raw.furnished),
    roommateFriendly: Boolean(raw.roommateFriendly),
    brokerFee: Boolean(raw.brokerFee),
    brokerFeeAmount: raw.brokerFeeAmount || 0,
    leaseTerm: raw.leaseTerm,
    availableDate: raw.availableDate,
    commuteEstimate: raw.commuteEstimate || {},
    description: raw.description || "",
    amenities: raw.amenities || [],
    images: raw.images || [],
    sourceUrl: raw.sourceUrl || "",
    sourceUrlLabel: raw.sourceUrlLabel || "Imported source link",
    contact: raw.contact || null,
    listingConfidence: raw.listingConfidence,
    audienceTags: raw.audienceTags || [],
    competitiveness: raw.competitiveness || "medium",
    riskFlags: raw.riskFlags || [],
    tags: raw.tags || [],
  });
}

export function normalizeProviderListing(providerMeta, rawListing) {
  const { providerId } = providerMeta;
  if (providerId === "airbnb") {
    return normalizeAirbnbListing(rawListing, providerMeta);
  }

  if (providerId === "zillow") {
    return normalizeZillowListing(rawListing, providerMeta);
  }

  if (providerId === "imported-real") {
    return normalizeImportedListing(rawListing, providerMeta);
  }

  throw new Error(`Unsupported provider: ${providerId}`);
}
