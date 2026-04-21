export const futureProviderCatalog = [
  {
    providerId: "csv-import",
    label: "CSV import",
    sourceType: "imported",
    ingestionMode: "csv-upload",
    status: "available-local",
    notes: "User or admin can load real listings locally with coordinates and source links.",
  },
  {
    providerId: "manual-link-review",
    label: "Reviewed link intake",
    sourceType: "imported",
    ingestionMode: "manual-link-review",
    status: "available-local",
    notes: "Stores source URLs for later review without scraping or claiming live ingestion.",
  },
  {
    providerId: "admin-upload",
    label: "Admin upload",
    sourceType: "imported",
    ingestionMode: "admin-curated-feed",
    status: "planned",
    notes: "Back-office reviewed feed for curated real listings.",
  },
  {
    providerId: "wechat-mini-program",
    label: "WeChat mini-program connector",
    sourceType: "imported",
    ingestionMode: "authorized-export-or-partner-feed",
    status: "planned",
    notes:
      "Future adapter for compliant ingestion via export, partner feed, or authorized connector workflows.",
  },
];
