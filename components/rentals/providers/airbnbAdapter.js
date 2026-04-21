import { airbnbDemoListings } from "../data/demoProviders/airbnb.demo";

export const airbnbAdapter = {
  providerId: "airbnb",
  label: "Airbnb",
  type: "marketplace",
  async search() {
    return Promise.resolve(airbnbDemoListings);
  },
};
