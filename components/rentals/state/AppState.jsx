import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { defaultPreferences } from "../config/runtime";
import { createViewportFromPlace } from "../map/mapContract";
import { defaultPlace } from "../places/placeCatalog";
import { resolvePlaceQuery } from "../places/placeSearch";
import { runRentalSearch } from "../services/aggregateSearch";
import { importListingsFromCsvFile } from "../services/import/csvImport";
import { createReviewLinkEntry } from "../services/import/linkIntake";
import {
  buildOutreachDraft,
  buildSampleReply,
  sendOutreachDraft,
} from "../services/outreach/outreachService";

const STORAGE_KEY = "rental-agent-web-state-v4";

const AppStateContext = createContext(null);

const initialState = {
  preferences: defaultPreferences,
  mapState: {
    searchPlace: defaultPlace,
    viewport: createViewportFromPlace(defaultPlace),
    selectedListingId: null,
    detailListingId: null,
  },
  resultsState: {
    status: "idle",
    lastRunAt: null,
    providerResults: [],
    summary: {
      sourceBreakdown: {
        live: 0,
        imported: 0,
        demo: 0,
      },
    },
    listings: [],
    sortBy: "best-match",
    filters: {
      onlyNoFee: false,
      onlyFurnished: false,
      sourceTypes: {
        live: true,
        imported: true,
        demo: true,
      },
    },
  },
  dataState: {
    importedListings: [],
    reviewQueue: [],
    lastImportSummary: null,
  },
  opsState: {
    activeTab: "browse",
    outreachQueue: [],
    inbox: [],
    finalists: [],
    pendingSendDraftId: null,
    pendingDecisionListingId: null,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        ...action.payload,
      };
    case "preferences/update":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };
    case "map/viewport":
      return {
        ...state,
        mapState: {
          ...state.mapState,
          viewport: action.payload,
        },
      };
    case "map/select-listing":
      return {
        ...state,
        mapState: {
          ...state.mapState,
          viewport: centerViewportOnListing(
            state.mapState.viewport,
            state.resultsState.listings,
            action.payload,
          ),
          selectedListingId: action.payload,
        },
      };
    case "map/open-details":
      return {
        ...state,
        mapState: {
          ...state.mapState,
          viewport: centerViewportOnListing(
            state.mapState.viewport,
            state.resultsState.listings,
            action.payload,
          ),
          selectedListingId: action.payload,
          detailListingId: action.payload,
        },
      };
    case "map/close-details":
      return {
        ...state,
        mapState: {
          ...state.mapState,
          detailListingId: null,
        },
      };
    case "results/start":
      return {
        ...state,
        resultsState: {
          ...state.resultsState,
          status: "loading",
        },
      };
    case "results/complete":
      return {
        ...state,
        mapState: {
          ...state.mapState,
          searchPlace: action.payload.searchPlace,
          viewport: action.payload.viewport,
          selectedListingId: action.payload.listings[0]?.id ?? null,
          detailListingId: null,
        },
        resultsState: {
          ...state.resultsState,
          status: "ready",
          providerResults: action.payload.providerResults,
          summary: action.payload.summary,
          listings: action.payload.listings,
          lastRunAt: new Date().toISOString(),
        },
      };
    case "results/sort":
      return {
        ...state,
        resultsState: {
          ...state.resultsState,
          sortBy: action.payload,
        },
      };
    case "results/filters":
      return {
        ...state,
        resultsState: {
          ...state.resultsState,
          filters: {
            ...state.resultsState.filters,
            ...action.payload,
            sourceTypes: action.payload.sourceTypes
              ? {
                  ...state.resultsState.filters.sourceTypes,
                  ...action.payload.sourceTypes,
                }
              : state.resultsState.filters.sourceTypes,
          },
        },
      };
    case "data/set-imported":
      return {
        ...state,
        dataState: {
          ...state.dataState,
          importedListings: action.payload.listings,
          lastImportSummary: action.payload.summary,
        },
      };
    case "data/clear-imported":
      return {
        ...state,
        dataState: {
          ...state.dataState,
          importedListings: [],
          lastImportSummary: null,
        },
      };
    case "data/add-review-link":
      return {
        ...state,
        dataState: {
          ...state.dataState,
          reviewQueue: [action.payload, ...state.dataState.reviewQueue],
        },
      };
    case "ops/tab":
      return {
        ...state,
        opsState: {
          ...state.opsState,
          activeTab: action.payload,
        },
      };
    case "ops/add-draft":
      return {
        ...state,
        opsState: {
          ...state.opsState,
          outreachQueue: upsertById(state.opsState.outreachQueue, action.payload),
        },
        resultsState: {
          ...state.resultsState,
          listings: state.resultsState.listings.map((listing) =>
            listing.id === action.payload.listingId
              ? { ...listing, outreachState: "draft" }
              : listing,
          ),
        },
      };
    case "ops/request-send":
      return {
        ...state,
        opsState: {
          ...state.opsState,
          pendingSendDraftId: action.payload,
        },
      };
    case "ops/cancel-send":
      return {
        ...state,
        opsState: {
          ...state.opsState,
          pendingSendDraftId: null,
        },
      };
    case "ops/mark-sent":
      return {
        ...state,
        opsState: {
          ...state.opsState,
          pendingSendDraftId: null,
          outreachQueue: state.opsState.outreachQueue.map((draft) =>
            draft.id === action.payload.id ? action.payload : draft,
          ),
        },
        resultsState: {
          ...state.resultsState,
          listings: state.resultsState.listings.map((listing) =>
            listing.id === action.payload.listingId
              ? { ...listing, outreachState: "sent" }
              : listing,
          ),
        },
      };
    case "ops/add-sample-reply":
      return {
        ...state,
        opsState: {
          ...state.opsState,
          inbox: [action.payload, ...state.opsState.inbox],
          outreachQueue: state.opsState.outreachQueue.map((draft) =>
            draft.listingId === action.payload.listingId
              ? { ...draft, status: "sample-reply", statusLabel: "Sample reply ready" }
              : draft,
          ),
        },
        resultsState: {
          ...state.resultsState,
          listings: state.resultsState.listings.map((listing) =>
            listing.id === action.payload.listingId
              ? { ...listing, outreachState: "sample-reply" }
              : listing,
          ),
        },
      };
    case "ops/request-decision":
      return {
        ...state,
        opsState: {
          ...state.opsState,
          pendingDecisionListingId: action.payload,
        },
      };
    case "ops/cancel-decision":
      return {
        ...state,
        opsState: {
          ...state.opsState,
          pendingDecisionListingId: null,
        },
      };
    case "ops/confirm-decision":
      return {
        ...state,
        opsState: {
          ...state.opsState,
          pendingDecisionListingId: null,
          finalists: unique([...state.opsState.finalists, action.payload]),
        },
      };
    case "ops/jump-to-listing":
      return {
        ...state,
        mapState: {
          ...state.mapState,
          viewport: centerViewportOnListing(
            state.mapState.viewport,
            state.resultsState.listings,
            action.payload,
          ),
          selectedListingId: action.payload,
          detailListingId: action.payload,
        },
        opsState: {
          ...state.opsState,
          activeTab: "browse",
        },
      };
    default:
      return state;
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (!parsed.mapState || !parsed.resultsState || !parsed.opsState || !parsed.dataState) {
        return;
      }

      dispatch({
        type: "hydrate",
        payload: parsed,
      });
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const api = useMemo(() => {
    async function performSearch(nextPreferences, importedListings = state.dataState.importedListings) {
      dispatch({ type: "results/start" });
      const searchPlace = resolvePlaceQuery(nextPreferences.placeQuery, [
        ...importedListings,
        ...state.resultsState.listings,
      ]);
      const result = await runRentalSearch(nextPreferences, { importedListings });

      dispatch({
        type: "results/complete",
        payload: {
          ...result,
          searchPlace,
          viewport: createViewportFromPlace(searchPlace),
        },
      });
    }

    return {
      state,
      updatePreferences(updates) {
        dispatch({ type: "preferences/update", payload: updates });
      },
      setActiveTab(tab) {
        dispatch({ type: "ops/tab", payload: tab });
      },
      setViewport(viewport) {
        dispatch({ type: "map/viewport", payload: viewport });
      },
      selectListing(listingId) {
        dispatch({ type: "map/select-listing", payload: listingId });
      },
      openListingDetails(listingId) {
        dispatch({ type: "map/open-details", payload: listingId });
      },
      closeListingDetails() {
        dispatch({ type: "map/close-details" });
      },
      updateSort(sortBy) {
        dispatch({ type: "results/sort", payload: sortBy });
      },
      updateFilters(filters) {
        dispatch({ type: "results/filters", payload: filters });
      },
      async runSearch(nextPreferences = state.preferences) {
        await performSearch(nextPreferences);
      },
      async importCsvFile(file) {
        const summary = await importListingsFromCsvFile(file);
        const nextImported = dedupeImportedListings([
          ...state.dataState.importedListings,
          ...summary.listings,
        ]);

        dispatch({
          type: "data/set-imported",
          payload: {
            listings: nextImported,
            summary,
          },
        });

        await performSearch(state.preferences, nextImported);
      },
      async clearImportedListings() {
        dispatch({ type: "data/clear-imported" });
        await performSearch(state.preferences, []);
      },
      addReviewLink(payload) {
        const reviewLink = createReviewLinkEntry(payload);
        dispatch({ type: "data/add-review-link", payload: reviewLink });
      },
      queueOutreach(listing) {
        const draft = buildOutreachDraft(listing, state.preferences);
        dispatch({ type: "ops/add-draft", payload: draft });
      },
      requestSendDraft(draftId) {
        dispatch({ type: "ops/request-send", payload: draftId });
      },
      cancelSendDraft() {
        dispatch({ type: "ops/cancel-send" });
      },
      async confirmSendDraft(draftId) {
        const draft = state.opsState.outreachQueue.find((item) => item.id === draftId);
        if (!draft) {
          return;
        }

        const sent = await sendOutreachDraft(draft);
        dispatch({ type: "ops/mark-sent", payload: sent });
      },
      addSampleReply(listingId) {
        const reply = buildSampleReply(listingId);
        if (!reply) {
          return;
        }
        dispatch({ type: "ops/add-sample-reply", payload: reply });
      },
      requestDecision(listingId) {
        dispatch({ type: "ops/request-decision", payload: listingId });
      },
      cancelDecision() {
        dispatch({ type: "ops/cancel-decision" });
      },
      confirmDecision(listingId) {
        dispatch({ type: "ops/confirm-decision", payload: listingId });
      },
      openListingFromOps(listingId) {
        dispatch({ type: "ops/jump-to-listing", payload: listingId });
      },
    };
  }, [state]);

  return <AppStateContext.Provider value={api}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return value;
}

function upsertById(list, item) {
  const found = list.some((entry) => entry.id === item.id);
  if (!found) {
    return [item, ...list];
  }

  return list.map((entry) => (entry.id === item.id ? item : entry));
}

function unique(items) {
  return [...new Set(items)];
}

function dedupeImportedListings(listings) {
  const seen = new Map();
  listings.forEach((listing) => {
    seen.set(listing.id, listing);
  });
  return [...seen.values()];
}

function centerViewportOnListing(viewport, listings, listingId) {
  const listing = listings.find((item) => item.id === listingId);
  if (!listing?.coordinates) {
    return viewport;
  }

  return {
    ...viewport,
    center: [listing.coordinates.lng, listing.coordinates.lat],
  };
}
