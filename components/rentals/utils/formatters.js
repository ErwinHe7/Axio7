export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceShort(amount) {
  if (!Number.isFinite(amount)) {
    return "--";
  }

  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  }

  return formatCurrency(amount);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRoomType(roomType) {
  const labels = {
    "private-room": "Private room",
    "shared-room": "Shared room",
    studio: "Studio",
    "1b": "1 bed",
  };

  return labels[roomType] || roomType;
}

export function formatLease(listing) {
  return `${listing.leaseTerm.minMonths}-${listing.leaseTerm.maxMonths} mo`;
}

export function formatSourceType(sourceType) {
  const labels = {
    live: "Live real",
    imported: "Imported real",
    demo: "Demo sample",
  };

  return labels[sourceType] || sourceType;
}
