import { appConfig } from "../../config/runtime";

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createEmailTransport() {
  return {
    key: "email",
    mode: appConfig.outreach.liveEmailEnabled ? "live" : "mock",
    async send({ to, subject, body }) {
      await wait(650);
      return {
        deliveryId: `email-${crypto.randomUUID()}`,
        channel: "email",
        to,
        subject,
        body,
        mode: this.mode,
        sentAt: new Date().toISOString(),
      };
    },
  };
}

export function createSmsTransport() {
  return {
    key: "sms",
    mode: appConfig.outreach.liveSmsEnabled ? "live" : "mock",
    async send({ to, body }) {
      await wait(500);
      return {
        deliveryId: `sms-${crypto.randomUUID()}`,
        channel: "sms",
        to,
        body,
        mode: this.mode,
        sentAt: new Date().toISOString(),
      };
    },
  };
}

export function createProviderInquiryTransport() {
  return {
    key: "provider-inquiry",
    mode: "mock",
    async send({ to, body, provider }) {
      await wait(700);
      return {
        deliveryId: `provider-${crypto.randomUUID()}`,
        channel: "provider-inquiry",
        to,
        provider,
        body,
        mode: this.mode,
        sentAt: new Date().toISOString(),
      };
    },
  };
}
