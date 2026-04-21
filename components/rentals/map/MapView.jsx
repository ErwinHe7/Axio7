import { appConfig } from "../config/runtime";
import { GoogleMapsPlaceholder } from "./google/GoogleMapsPlaceholder";
import { MapLibreRentalMap } from "./maplibre/MapLibreRentalMap";

export function MapView(props) {
  if (appConfig.mapEngine === "maplibre") {
    return <MapLibreRentalMap {...props} />;
  }

  return <GoogleMapsPlaceholder {...props} />;
}
