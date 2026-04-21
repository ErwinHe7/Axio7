import { appConfig } from "../config/runtime";
import { airbnbAdapter } from "./airbnbAdapter";
import { futureProviderCatalog } from "./futureProviders";
import { zillowAdapter } from "./zillowAdapter";

const searchProviders = [airbnbAdapter, zillowAdapter].filter((provider) => {
  const config = appConfig.providerSettings[provider.providerId];
  return config?.enabled;
});

export function getSearchProviders() {
  return searchProviders.map((provider) => {
    const config = appConfig.providerSettings[provider.providerId];
    return {
      ...provider,
      sourceType: config.sourceType,
      providerStatusLabel: config.providerStatusLabel,
      providerTargetLabel: config.providerTargetLabel,
      ingestionMode: config.ingestionMode,
    };
  });
}

export function getSourceCatalog() {
  return [
    ...getSearchProviders(),
    ...futureProviderCatalog,
  ];
}
