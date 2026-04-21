const suspiciousPriceThresholds = {
  Manhattan: 1400,
  Queens: 1100,
  Brooklyn: 1200,
};

export function evaluateListingMatch(listing, preferences) {
  let score = 50;
  const reasons = [];
  const riskFlags = [...(listing.riskFlags || [])];

  const withinBudget =
    listing.price >= preferences.budgetMin && listing.price <= preferences.budgetMax;
  if (withinBudget) {
    score += 18;
    reasons.push("Fits budget");
  } else if (listing.price < preferences.budgetMin) {
    score += 9;
    reasons.push("Below budget");
  } else if (listing.price <= preferences.budgetMax * 1.1) {
    score += 4;
    riskFlags.push("High total cost");
  } else {
    score -= 16;
    riskFlags.push("High total cost");
  }

  const commuteMinutes = listing.commuteEstimate[preferences.commuteDestination];
  if (typeof commuteMinutes === "number" && commuteMinutes <= preferences.maxCommuteMinutes) {
    score += 16;
    reasons.push("Good commute");
  } else if (
    typeof commuteMinutes === "number" &&
    commuteMinutes <= preferences.maxCommuteMinutes + 10
  ) {
    score += 6;
    riskFlags.push("Longer commute");
  } else if (typeof commuteMinutes === "number") {
    score -= 10;
    riskFlags.push("Long commute");
  } else {
    riskFlags.push("Commute missing");
  }

  const roomTypeMatch =
    preferences.roomType === "any" || preferences.roomType === listing.roomType;
  if (roomTypeMatch) {
    score += 10;
    reasons.push("Room type fit");
  } else if (
    preferences.roomType === "studio" &&
    (listing.roomType === "1b" || listing.roomType === "studio")
  ) {
    score += 5;
  } else {
    score -= 6;
    riskFlags.push("Room mismatch");
  }

  const leaseMonths = Number(preferences.leaseMonths);
  if (
    leaseMonths >= listing.leaseTerm.minMonths &&
    leaseMonths <= listing.leaseTerm.maxMonths
  ) {
    score += 12;
    reasons.push(
      listing.leaseTerm.type === "sublet" || listing.leaseTerm.type === "short-term"
        ? "Short lease"
        : "Lease fit",
    );
  } else if (
    listing.leaseTerm.minMonths &&
    Math.abs(leaseMonths - listing.leaseTerm.minMonths) <= 2
  ) {
    score += 3;
    riskFlags.push("Lease unclear");
  } else {
    score -= 8;
    riskFlags.push("Lease mismatch");
  }

  const moveInGap = Math.round(
    (new Date(`${listing.availableDate}T00:00:00`) -
      new Date(`${preferences.moveInDate}T00:00:00`)) /
      86400000,
  );
  if (moveInGap >= -14 && moveInGap <= 10) {
    score += 10;
    reasons.push("Move-in fit");
  } else if (moveInGap <= 21) {
    score += 3;
    riskFlags.push("Move-in unclear");
  } else {
    score -= 5;
    riskFlags.push("Move-in mismatch");
  }

  if (preferences.furnished === "must-be-furnished" && listing.furnished) {
    score += 10;
    reasons.push("Furnished");
  } else if (preferences.furnished === "must-be-furnished" && !listing.furnished) {
    score -= 12;
    riskFlags.push("Unfurnished");
  } else if (preferences.furnished === "prefer-furnished" && listing.furnished) {
    score += 6;
    reasons.push("Furnished");
  }

  if (preferences.roommatePolicy === "roommate-ok" && listing.roommateFriendly) {
    score += 4;
    reasons.push("Roommate OK");
  }

  if (preferences.roommatePolicy === "prefer-solo" && !listing.roommateFriendly) {
    score += 4;
    reasons.push("Solo fit");
  }

  if (preferences.brokerFeePreference === "must-avoid-fee" && listing.brokerFee) {
    score -= 14;
    riskFlags.push("Broker fee");
  } else if (
    preferences.brokerFeePreference !== "fee-okay" &&
    listing.brokerFee === false
  ) {
    score += 6;
    reasons.push("No fee");
  }

  if (
    preferences.leasePreference === "short-term-or-sublet" &&
    (listing.leaseTerm.type === "short-term" || listing.leaseTerm.type === "sublet")
  ) {
    score += 8;
    reasons.push("Student/intern fit");
  }

  const neighborhoodTokens = preferences.neighborhoods
    .split(/,|，/u)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (
    neighborhoodTokens.some(
      (token) =>
        listing.neighborhood.toLowerCase().includes(token) ||
        token.includes(listing.neighborhood.toLowerCase()),
    )
  ) {
    score += 8;
    reasons.push("Area match");
  }

  if (preferences.boroughs.includes(listing.borough)) {
    score += 5;
  }

  if (listing.price < (suspiciousPriceThresholds[listing.borough] || 1000)) {
    riskFlags.push("Price seems low");
  }

  if (!listing.description || listing.amenities.length < 2) {
    riskFlags.push("Missing info");
  }

  if (!listing.coordinates) {
    riskFlags.push("Missing coordinates");
  }

  if (listing.competitiveness === "high") {
    riskFlags.push("Competitive");
  }

  if (
    listing.leaseTerm.minMonths === listing.leaseTerm.maxMonths &&
    leaseMonths !== listing.leaseTerm.minMonths
  ) {
    riskFlags.push("Lease fixed");
  }

  const dedupedReasons = unique(reasons);
  const dedupedRisks = unique(riskFlags);

  return {
    ...listing,
    matchScore: clamp(score, 22, 98),
    matchReasons: dedupedReasons.slice(0, 4),
    riskFlags: dedupedRisks.slice(0, 4),
    tags: buildListingTags(dedupedReasons, dedupedRisks, commuteMinutes, listing.sourceTypeLabel),
    highlights: dedupedReasons.slice(0, 3),
  };
}

export function sortRankedListings(listings, sortKey) {
  const sorted = [...listings];

  switch (sortKey) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "commute-asc":
      return sorted.sort((a, b) => (a.activeCommute ?? 999) - (b.activeCommute ?? 999));
    case "updated-desc":
      return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    case "confidence-desc":
      return sorted.sort((a, b) => b.listingConfidence - a.listingConfidence);
    default:
      return sorted.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export function applyResultFilters(listings, filters) {
  return listings.filter((listing) => {
    if (filters.onlyNoFee && listing.brokerFee) {
      return false;
    }

    if (filters.onlyFurnished && !listing.furnished) {
      return false;
    }

    if (filters.sourceTypes && !filters.sourceTypes[listing.sourceType]) {
      return false;
    }

    return true;
  });
}

function buildListingTags(reasons, riskFlags, commuteMinutes, sourceTypeLabel) {
  const tags = [sourceTypeLabel];

  if (reasons.includes("Good commute")) {
    tags.push("Good commute");
  }

  if (reasons.includes("Short lease")) {
    tags.push("Short lease");
  }

  if (reasons.includes("No fee")) {
    tags.push("No fee");
  }

  if (reasons.includes("Furnished")) {
    tags.push("Furnished");
  }

  if (typeof commuteMinutes === "number" && !tags.length && commuteMinutes <= 25) {
    tags.push("Near target");
  }

  if (riskFlags.includes("Missing info")) {
    tags.push("Missing info");
  }

  return unique(tags).slice(0, 4);
}

function unique(items) {
  return [...new Set(items)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
