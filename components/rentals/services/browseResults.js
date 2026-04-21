import { isPointInBounds } from "../map/mapContract";
import { applyResultFilters, sortRankedListings } from "./ranking";

export function createMapMarkerListings({ listings, filters, sortBy, selectedListingId }) {
  const filtered = applyResultFilters(listings, filters).filter((listing) => listing.coordinates);
  const sorted = sortRankedListings(filtered, sortBy);

  return sorted.map((listing) => ({
    ...listing,
    isSelected: listing.id === selectedListingId,
  }));
}

export function createBrowseResults({
  listings,
  filters,
  sortBy,
  bounds,
  selectedListingId,
}) {
  const filtered = applyResultFilters(listings, filters);
  const visibleInBounds = bounds
    ? filtered
        .map((listing) => ({
          ...listing,
          isVisibleOnMap: isPointInBounds(listing.coordinates, bounds),
        }))
        .filter((listing) => listing.isVisibleOnMap)
    : filtered;

  const sorted = sortRankedListings(visibleInBounds, sortBy);

  return sorted.map((listing, index) => ({
    ...listing,
    isRecommended: index === 0,
    isSelected: listing.id === selectedListingId,
  }));
}
