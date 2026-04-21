import { zillowDemoListings } from "../data/demoProviders/zillow.demo";

export const zillowAdapter = {
  providerId: "zillow",
  label: "Zillow",
  type: "marketplace",
  async search() {
    return Promise.resolve(zillowDemoListings);
  },
};
