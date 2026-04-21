export function createReviewLinkEntry({ provider, url, notes }) {
  return {
    id: `review-link:${crypto.randomUUID()}`,
    provider: provider || "Unknown source",
    url,
    notes: notes || "",
    status: "pending-review",
    createdAt: new Date().toISOString(),
  };
}
