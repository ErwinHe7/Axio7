import { getSearchProviders } from "../providers/providerRegistry";
import { normalizeProviderListing } from "../normalization/normalizeListing";
import { evaluateListingMatch, sortRankedListings } from "./ranking";

export async function runRentalSearch(preferences, { importedListings = [] } = {}) {
  const providers = getSearchProviders();
  const providerResults = await Promise.all(
    providers.map(async (provider) => {
      const rawListings = await provider.search(preferences);
      return {
        providerId: provider.providerId,
        providerLabel: provider.label,
        providerTargetLabel: provider.providerTargetLabel,
        providerStatusLabel: provider.providerStatusLabel,
        sourceType: provider.sourceType,
        rawCount: rawListings.length,
        listings: rawListings.map((raw) => normalizeProviderListing(provider, raw)),
      };
    }),
  );

  const importedProviderResult = buildImportedProviderResult(importedListings);
  const allProviderResults = importedProviderResult
    ? [...providerResults, importedProviderResult]
    : providerResults;

  const normalizedListings = allProviderResults.flatMap((result) => result.listings);
  const dedupedListings = dedupeListings(normalizedListings);
  const ranked = sortRankedListings(
    dedupedListings.map((listing) => {
      const evaluated = evaluateListingMatch(listing, preferences);
      return {
        ...evaluated,
        activeCommute: evaluated.commuteEstimate[preferences.commuteDestination] ?? null,
      };
    }),
    "best-match",
  );

  return {
    listings: ranked,
    providerResults: allProviderResults,
    summary: {
      rawCount: allProviderResults.reduce((sum, result) => sum + result.rawCount, 0),
      normalizedCount: normalizedListings.length,
      dedupedCount: dedupedListings.length,
      topMatchId: ranked[0]?.id ?? null,
      sourceBreakdown: summarizeSourceTypes(ranked),
    },
  };
}

function buildImportedProviderResult(importedListings) {
  if (!importedListings.length) {
    return null;
  }

  return {
    providerId: "imported-real",
    providerLabel: "Imported real",
    providerTargetLabel: "Imported source",
    providerStatusLabel: "Local CSV or reviewed import",
    sourceType: "imported",
    rawCount: importedListings.length,
    listings: importedListings,
  };
}

function summarizeSourceTypes(listings) {
  return listings.reduce(
    (accumulator, listing) => {
      accumulator[listing.sourceType] = (accumulator[listing.sourceType] || 0) + 1;
      return accumulator;
    },
    { live: 0, imported: 0, demo: 0 },
  );
}

function dedupeListings(listings) {
  const seen = new Map();

  listings.forEach((listing) => {
    const dedupeKey = [
      listing.addressLabel || listing.areaLabel || listing.neighborhood,
      listing.price,
      listing.roomType,
      listing.availableDate,
    ].join("-");
    const existing = seen.get(dedupeKey);

    if (!existing || existing.listingQualityScore < listing.listingQualityScore) {
      seen.set(dedupeKey, listing);
    }
  });

  return [...seen.values()];
}
