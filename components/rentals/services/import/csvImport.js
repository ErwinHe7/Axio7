import { normalizeImportedListing } from "../../normalization/normalizeListing.js";

const REQUIRED_COLUMNS = ["title", "price", "latitude", "longitude"];

export async function importListingsFromCsvFile(file) {
  const text = await file.text();
  return importListingsFromCsvText(text);
}

export function importListingsFromCsvText(text) {
  const rows = parseCsv(text);
  if (!rows.length) {
    return {
      listings: [],
      errors: ["CSV file is empty."],
      importedCount: 0,
      rejectedCount: 0,
      columns: [],
    };
  }

  const columns = Object.keys(rows[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missingColumns.length) {
    return {
      listings: [],
      errors: [`Missing required columns: ${missingColumns.join(", ")}`],
      importedCount: 0,
      rejectedCount: rows.length,
      columns,
    };
  }

  const importedAt = new Date().toISOString();
  const accepted = [];
  const errors = [];

  rows.forEach((row, index) => {
    const parsed = normalizeImportedCsvRow(row, importedAt, index + 2);
    if (parsed.error) {
      errors.push(parsed.error);
      return;
    }

    accepted.push(parsed.listing);
  });

  return {
    listings: accepted,
    errors,
    importedCount: accepted.length,
    rejectedCount: rows.length - accepted.length,
    columns,
  };
}

function normalizeImportedCsvRow(row, importedAt, csvLine) {
  if (!row.title || !row.price || !row.latitude || !row.longitude) {
    return {
      error: `Row ${csvLine}: title, price, latitude, and longitude are required.`,
    };
  }

  const price = Number(row.price);
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);

  if (!Number.isFinite(price) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      error: `Row ${csvLine}: price, latitude, and longitude must be valid numbers.`,
    };
  }

  const leaseMin = toNumberOrNull(row.leaseMinMonths) ?? 1;
  const leaseMax = toNumberOrNull(row.leaseMaxMonths) ?? leaseMin;
  const listing = normalizeImportedListing({
    id: `imported:${crypto.randomUUID()}`,
    title: row.title.trim(),
    provider: row.provider || "Manual import",
    providerId: "imported-real",
    providerStatusLabel: "Imported real",
    providerTargetLabel: row.provider || "Imported source",
    importMethod: "csv-upload",
    importedAt,
    updatedAt: row.updatedAt || importedAt,
    sourceStatusLabel: "CSV import",
    price,
    pricePeriod: row.pricePeriod || "month",
    neighborhood: row.neighborhood || row.area || "",
    borough: row.borough || "",
    areaLabel: row.area || row.neighborhood || row.address || "",
    addressLabel: row.address || row.area || "",
    latitude,
    longitude,
    roomType: row.roomType || "private-room",
    furnished: parseBoolean(row.furnished),
    roommateFriendly: parseBoolean(row.roommateFriendly),
    brokerFee: parseBoolean(row.brokerFee),
    brokerFeeAmount: toNumberOrZero(row.brokerFeeAmount),
    leaseTerm: {
      minMonths: leaseMin,
      maxMonths: leaseMax,
      type: row.leaseType || "unknown",
    },
    availableDate: row.availableDate || importedAt.slice(0, 10),
    description: row.description || "",
    sourceUrl: row.sourceUrl || "",
    sourceUrlLabel: row.sourceUrl ? "Imported source link" : "No source link",
    amenities: splitList(row.amenities),
    audienceTags: splitList(row.tags),
    listingConfidence: toNumberOrNull(row.listingConfidence) ?? 0.86,
    competitiveness: row.competitiveness || "medium",
    riskFlags: row.sourceUrl ? [] : ["Missing source link"],
    tags: splitList(row.highlights),
  });

  return { listing };
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let record = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      record.push(current);
      current = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }

      record.push(current);
      if (record.some((value) => value.trim() !== "")) {
        rows.push(record);
      }
      current = "";
      record = [];
      continue;
    }

    current += character;
  }

  if (current || record.length) {
    record.push(current);
    if (record.some((value) => value.trim() !== "")) {
      rows.push(record);
    }
  }

  if (!rows.length) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((value) => value.trim());
  return dataRows.map((row) =>
    headers.reduce((accumulator, header, columnIndex) => {
      accumulator[header] = (row[columnIndex] || "").trim();
      return accumulator;
    }, {}),
  );
}

function splitList(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value) {
  return ["true", "yes", "1"].includes(String(value || "").trim().toLowerCase());
}

function toNumberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumberOrZero(value) {
  return toNumberOrNull(value) ?? 0;
}
