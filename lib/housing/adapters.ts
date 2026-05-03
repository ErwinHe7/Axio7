import type { BuildingSourceAdapter, HousingListing } from './types';
import { HOUSING_LISTINGS } from './data';

export const seedHousingAdapter: BuildingSourceAdapter = {
  name: 'AXIO7 Seed Housing Source',
  sourceUrl: 'axio7://seed/housing',
  async fetchListings() {
    return HOUSING_LISTINGS;
  },
  normalize(raw: unknown): HousingListing {
    return raw as HousingListing;
  },
};

export const reviewedLinkAdapter: BuildingSourceAdapter = {
  name: 'Reviewed Link Intake',
  sourceUrl: 'axio7://reviewed-links',
  async fetchListings() {
    return [];
  },
  normalize(raw: unknown): HousingListing {
    return raw as HousingListing;
  },
};

export const buildingSourceAdapters: BuildingSourceAdapter[] = [seedHousingAdapter, reviewedLinkAdapter];
