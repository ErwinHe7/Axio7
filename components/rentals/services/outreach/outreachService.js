import {
  createEmailTransport,
  createProviderInquiryTransport,
  createSmsTransport,
} from "./transports";

const sampleReplyFixtures = {
  "airbnb:abnb-demo-101": {
    subject: "Sample reply for simulated draft",
    summary: "Sample reply: host confirms dates and asks for a tour preference.",
    body:
      "This is a sample reply used in simulated mode. It shows inbox behavior without claiming to be a real owner message.",
    suggestions: ["Ask about total cost", "Request sample lease", "Schedule tour"],
  },
  "airbnb:abnb-demo-103": {
    subject: "Sample reply for simulated draft",
    summary: "Sample reply: host asks for exact dates and sublet length.",
    body:
      "This is a simulated reply object. It exists only to test inbox behavior and should never be treated as a live provider response.",
    suggestions: ["Confirm move-in window", "Ask about sublet rules", "Request utilities breakdown"],
  },
  "zillow:zl-demo-204": {
    subject: "Sample reply for simulated draft",
    summary: "Sample reply: contact says the room still appears available.",
    body:
      "This is a sample reply generated inside simulated mode. Replace this path with a real webhook or provider inbox when live integrations exist.",
    suggestions: ["Request viewing times", "Ask who lives there", "Check application process"],
  },
};

const transports = {
  email: createEmailTransport(),
  sms: createSmsTransport(),
  "provider-inquiry": createProviderInquiryTransport(),
};

export function buildOutreachDraft(listing, preferences) {
  const preferredChannel = listing.contact?.preferredChannel;
  const channel =
    preferredChannel === "sms"
      ? "sms"
      : preferredChannel === "email"
        ? "email"
        : "provider-inquiry";

  const body = [
    `Hi ${listing.contact?.name || "there"},`,
    "",
    `This is a simulated outreach draft for "${listing.title}".`,
    `Source type: ${listing.sourceTypeLabel}`,
    `Provider: ${listing.provider}`,
    `Target move-in: ${preferences.moveInDate}`,
    `Lease target: ${preferences.leaseMonths} months`,
    `Budget: ${preferences.budgetMin}-${preferences.budgetMax} USD / month`,
    "",
    "Please confirm:",
    "- current availability",
    "- total monthly cost and all fees",
    "- lease length flexibility",
    "- move-in flexibility",
    "- tour options",
    "",
    "This local build does not send real outreach unless a live transport is configured later.",
  ].join("\n");

  return {
    id: `draft-${crypto.randomUUID()}`,
    listingId: listing.id,
    provider: listing.provider,
    sourceType: listing.sourceType,
    sourceTypeLabel: listing.sourceTypeLabel,
    recipientName: listing.contact?.name || "Unknown contact",
    recipient: {
      email: listing.contact?.email || "",
      phone: listing.contact?.phone || "",
    },
    channel,
    subject: `Simulated draft: ${listing.title}`,
    body,
    status: "draft",
    statusLabel: "Draft only",
    createdAt: new Date().toISOString(),
    isSimulation: true,
  };
}

export async function sendOutreachDraft(draft) {
  const transport = transports[draft.channel] || transports["provider-inquiry"];
  const to =
    draft.channel === "sms" ? draft.recipient.phone : draft.recipient.email || draft.recipientName;
  const delivery = await transport.send({
    to,
    subject: draft.subject,
    body: draft.body,
    provider: draft.provider,
  });

  return {
    ...draft,
    status: "sent",
    statusLabel: "Simulated send",
    sentAt: delivery.sentAt,
    delivery,
  };
}

export function buildSampleReply(listingId) {
  const fixture = sampleReplyFixtures[listingId];
  if (!fixture) {
    return null;
  }

  return {
    id: `reply-${crypto.randomUUID()}`,
    listingId,
    subject: fixture.subject,
    summary: fixture.summary,
    body: fixture.body,
    suggestions: fixture.suggestions,
    receivedAt: new Date().toISOString(),
    sourceType: "demo",
    isSimulation: true,
    statusLabel: "Sample reply",
  };
}
