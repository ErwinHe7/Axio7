import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import { formatPriceShort } from "../../utils/formatters";
import { boundsToPolygon, formatBoundsFromMapLibre } from "../mapContract";

const AREA_SOURCE_ID = "search-place";

function createMarkerElement(listing, selected) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = `map-marker ${listing.sourceType} ${selected ? "selected" : ""}`;
  marker.innerHTML = `<span>${formatPriceShort(listing.price)}</span>`;
  marker.setAttribute("title", `${listing.title} | ${listing.provider} | ${listing.sourceTypeLabel}`);
  return marker;
}

export function MapLibreRentalMap({
  viewport,
  markers,
  selectedListingId,
  searchPlace,
  onViewportChange,
  onMarkerSelect,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const initializedRef = useRef(false);

  const areaFeature = useMemo(
    () => (searchPlace?.bounds ? boundsToPolygon(searchPlace.bounds) : null),
    [searchPlace],
  );

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: viewport.center,
      zoom: viewport.zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      map.addSource(AREA_SOURCE_ID, {
        type: "geojson",
        data: areaFeature || { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "search-place-fill",
        type: "fill",
        source: AREA_SOURCE_ID,
        paint: {
          "fill-color": "#c48b28",
          "fill-opacity": 0.09,
        },
      });
      map.addLayer({
        id: "search-place-outline",
        type: "line",
        source: AREA_SOURCE_ID,
        paint: {
          "line-color": "#8d621a",
          "line-width": 2,
        },
      });
    });

    map.on("moveend", () => {
      onViewportChange({
        center: [map.getCenter().lng, map.getCenter().lat],
        zoom: map.getZoom(),
        bounds: formatBoundsFromMapLibre(map.getBounds()),
      });
    });

    mapRef.current = map;
    initializedRef.current = true;

    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
      initializedRef.current = false;
    };
  }, [areaFeature, onViewportChange, viewport.center, viewport.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const currentCenter = map.getCenter();
    const [targetLng, targetLat] = viewport.center;
    const shouldRecenter =
      Math.abs(currentCenter.lng - targetLng) > 0.001 ||
      Math.abs(currentCenter.lat - targetLat) > 0.001 ||
      Math.abs(map.getZoom() - viewport.zoom) > 0.05;

    if (shouldRecenter) {
      map.easeTo({
        center: viewport.center,
        zoom: viewport.zoom,
        duration: 500,
      });
    }
  }, [viewport.center, viewport.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(AREA_SOURCE_ID)) {
      return;
    }

    map.getSource(AREA_SOURCE_ID).setData(
      areaFeature || { type: "FeatureCollection", features: [] },
    );
  }, [areaFeature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = markers.map((listing) => {
      const markerEl = createMarkerElement(listing, listing.id === selectedListingId);
      markerEl.addEventListener("click", () => onMarkerSelect(listing.id));

      return new maplibregl.Marker({ element: markerEl, anchor: "bottom" })
        .setLngLat([listing.coordinates.lng, listing.coordinates.lat])
        .addTo(map);
    });
  }, [markers, onMarkerSelect, selectedListingId]);

  return <div className="map-canvas" ref={containerRef} />;
}
