export function createViewportFromPlace(place) {
  return {
    center: place.center,
    zoom: place.zoom,
    bounds: place.bounds,
  };
}

export function isPointInBounds(coordinates, bounds) {
  if (!coordinates || !bounds) {
    return false;
  }

  return (
    coordinates.lng >= bounds.west &&
    coordinates.lng <= bounds.east &&
    coordinates.lat >= bounds.south &&
    coordinates.lat <= bounds.north
  );
}

export function boundsToPolygon(bounds) {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[
        [bounds.west, bounds.south],
        [bounds.east, bounds.south],
        [bounds.east, bounds.north],
        [bounds.west, bounds.north],
        [bounds.west, bounds.south],
      ]],
    },
  };
}

export function formatBoundsFromMapLibre(mapBounds) {
  return {
    west: mapBounds.getWest(),
    south: mapBounds.getSouth(),
    east: mapBounds.getEast(),
    north: mapBounds.getNorth(),
  };
}
