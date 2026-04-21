import { defaultPlace, placeCatalog } from "./placeCatalog";

export function resolvePlaceQuery(query, listings = []) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return defaultPlace;
  }

  const catalogHit = findCatalogPlace(normalized);
  if (catalogHit) {
    return catalogHit;
  }

  const listingMatch = findListingPlace(normalized, listings);
  if (listingMatch) {
    return listingMatch;
  }

  return {
    ...defaultPlace,
    label: query,
  };
}

export function buildPlaceSuggestions(listings = []) {
  const staticSuggestions = placeCatalog.map((place) => place.label);
  const listingSuggestions = listings.flatMap((listing) =>
    [listing.addressLabel, listing.areaLabel, listing.neighborhood].filter(Boolean),
  );

  return [...new Set([...staticSuggestions, ...listingSuggestions])];
}

export function createBoundsAroundPoint([lng, lat], lngRadius = 0.015, latRadius = 0.01) {
  return {
    west: lng - lngRadius,
    south: lat - latRadius,
    east: lng + lngRadius,
    north: lat + latRadius,
  };
}

function findCatalogPlace(normalizedQuery) {
  return (
    placeCatalog.find(
      (place) =>
        place.label.toLowerCase() === normalizedQuery ||
        place.aliases.some(
          (alias) => alias.includes(normalizedQuery) || normalizedQuery.includes(alias),
        ),
    ) || null
  );
}

function findListingPlace(normalizedQuery, listings) {
  const matches = listings.filter((listing) => {
    const haystack = [listing.addressLabel, listing.areaLabel, listing.neighborhood, listing.title]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const withCoordinates = matches.filter((listing) => listing.coordinates);
  if (!withCoordinates.length) {
    return null;
  }

  const center = averageCoordinates(withCoordinates);
  return {
    id: `listing-search:${normalizedQuery}`,
    label: matches[0].addressLabel || matches[0].areaLabel || matches[0].neighborhood || matches[0].title,
    aliases: [],
    center,
    zoom: 13.2,
    bounds: createBoundsAroundPoint(center, 0.02, 0.014),
    resultType: "listing-match",
  };
}

function averageCoordinates(listings) {
  const totals = listings.reduce(
    (accumulator, listing) => ({
      lng: accumulator.lng + listing.coordinates.lng,
      lat: accumulator.lat + listing.coordinates.lat,
    }),
    { lng: 0, lat: 0 },
  );

  return [totals.lng / listings.length, totals.lat / listings.length];
}

function normalizeQuery(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
