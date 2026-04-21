'use client';

import { useEffect, useMemo } from "react";
import { BellRing, Building2, Database, MapPinned, MessageSquareMore, ShieldCheck } from "lucide-react";
import { DataSourcesPanel } from "./components/DataSourcesPanel";
import { SearchToolbar } from "./components/SearchToolbar";
import { ListingCard } from "./components/ListingCard";
import { ListingDrawer } from "./components/ListingDrawer";
import { OutreachQueue } from "./components/OutreachQueue";
import { InboxPanel } from "./components/InboxPanel";
import { SendConfirmationModal } from "./components/SendConfirmationModal";
import { DecisionConfirmationModal } from "./components/DecisionConfirmationModal";
import { MapView } from "./map/MapView";
import { buildPlaceSuggestions } from "./places/placeSearch";
import { createBrowseResults, createMapMarkerListings } from "./services/browseResults";
import { AppStateProvider, useAppState } from "./state/AppState";
import "./rentals.css";

function Workspace() {
  const {
    state, updatePreferences, runSearch, setActiveTab, setViewport,
    selectListing, openListingDetails, closeListingDetails, updateSort,
    updateFilters, importCsvFile, clearImportedListings, addReviewLink,
    queueOutreach, requestSendDraft, cancelSendDraft, confirmSendDraft,
    addSampleReply, requestDecision, cancelDecision, confirmDecision, openListingFromOps,
  } = useAppState();

  useEffect(() => {
    if (state.resultsState.status === "idle") runSearch();
  }, [runSearch, state.resultsState.status]);

  const listingMap = useMemo(
    () => new Map(state.resultsState.listings.map((l) => [l.id, l])),
    [state.resultsState.listings],
  );

  const mapListings = useMemo(() => createMapMarkerListings({
    listings: state.resultsState.listings,
    filters: state.resultsState.filters,
    sortBy: state.resultsState.sortBy,
    selectedListingId: state.mapState.selectedListingId,
  }), [state.mapState.selectedListingId, state.resultsState.filters, state.resultsState.listings, state.resultsState.sortBy]);

  const visibleListings = useMemo(() => createBrowseResults({
    listings: state.resultsState.listings,
    filters: state.resultsState.filters,
    sortBy: state.resultsState.sortBy,
    bounds: state.mapState.viewport.bounds,
    selectedListingId: state.mapState.selectedListingId,
  }), [state.mapState.selectedListingId, state.mapState.viewport.bounds, state.resultsState.filters, state.resultsState.listings, state.resultsState.sortBy]);

  const placeSuggestions = useMemo(
    () => buildPlaceSuggestions([...state.dataState.importedListings, ...state.resultsState.listings]),
    [state.dataState.importedListings, state.resultsState.listings],
  );

  const detailListing = listingMap.get(state.mapState.detailListingId) || null;
  const selectedListing = listingMap.get(state.mapState.selectedListingId) || null;
  const pendingDraft = state.opsState.outreachQueue.find((i) => i.id === state.opsState.pendingSendDraftId) || null;
  const pendingDecisionListing = listingMap.get(state.opsState.pendingDecisionListingId) || null;
  const sourceBreakdown = state.resultsState.summary?.sourceBreakdown || { live: 0, imported: 0, demo: 0 };
  const tabCounts = { outreach: state.opsState.outreachQueue.length, inbox: state.opsState.inbox.length };

  return (
    <div className="app-shell clean-shell warm-shell">
      <header className="app-topbar warm-topbar">
        <div className="brandmark">
          <Building2 size={18} /><span>NYC Rentals</span>
        </div>
        <nav className="tab-nav">
          {[
            { id: 'browse', icon: <MapPinned size={15} />, label: 'Browse', count: 0 },
            { id: 'outreach', icon: <MessageSquareMore size={15} />, label: 'Outreach', count: tabCounts.outreach },
            { id: 'inbox', icon: <BellRing size={15} />, label: 'Inbox', count: tabCounts.inbox },
          ].map(({ id, icon, label, count }) => (
            <button key={id} className={`tab-button ${state.opsState.activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)} type="button">
              {icon}{label}{count > 0 && <span className="count-pill">{count}</span>}
            </button>
          ))}
        </nav>
        <div className="demo-badge"><ShieldCheck size={14} />Honest source labels</div>
      </header>

      <SearchToolbar
        loading={state.resultsState.status === "loading"}
        onChange={updatePreferences}
        onSubmit={(e) => { e.preventDefault(); runSearch(); }}
        placeSuggestions={placeSuggestions}
        preferences={state.preferences}
      />

      <section className="source-strip panel warm-panel">
        <div className="source-strip-row">
          <strong>{state.mapState.searchPlace.label}</strong>
          <span>{visibleListings.length} in view | {sourceBreakdown.live} live | {sourceBreakdown.imported} imported | {sourceBreakdown.demo} demo</span>
        </div>
        <div className="source-status-list">
          <span className="source-status-chip"><Database size={14} />Live real: permissions required</span>
          <span className="source-status-chip">Imported real: CSV or reviewed link intake</span>
          <span className="source-status-chip">Demo sample: target adapters only</span>
        </div>
      </section>

      <DataSourcesPanel
        importedCount={state.dataState.importedListings.length}
        lastImportSummary={state.dataState.lastImportSummary}
        onAddReviewLink={addReviewLink}
        onClearImported={clearImportedListings}
        onImportCsv={importCsvFile}
        reviewQueue={state.dataState.reviewQueue}
        sourceBreakdown={sourceBreakdown}
      />

      {state.opsState.activeTab === "browse" ? (
        <section className="browse-layout">
          <div className="map-panel panel warm-panel">
            <div className="panel-subhead">
              <div className="stack tight">
                <span className="eyebrow">Map</span>
                <h2>{state.mapState.searchPlace.label}</h2>
              </div>
            </div>
            <MapView markers={mapListings} onMarkerSelect={selectListing} onViewportChange={setViewport} searchPlace={state.mapState.searchPlace} selectedListingId={state.mapState.selectedListingId} viewport={state.mapState.viewport} />
          </div>

          <div className="results-panel panel warm-panel">
            <div className="results-header">
              <div className="stack tight"><span className="eyebrow">Results</span><h2>Listings</h2></div>
              <div className="results-controls">
                <label className="compact-select">
                  <span>Sort</span>
                  <select onChange={(e) => updateSort(e.target.value)} value={state.resultsState.sortBy}>
                    <option value="best-match">Best match</option>
                    <option value="price-asc">Lowest price</option>
                    <option value="commute-asc">Fastest commute</option>
                    <option value="updated-desc">Recent</option>
                    <option value="confidence-desc">Confidence</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="filter-row compact">
              {[['live','Live'],['imported','Imported'],['demo','Demo']].map(([k,l]) => (
                <button key={k} className={`toggle-pill ${state.resultsState.filters.sourceTypes[k] ? 'active' : ''}`} onClick={() => updateFilters({ sourceTypes: { [k]: !state.resultsState.filters.sourceTypes[k] } })} type="button">{l}</button>
              ))}
              <button className={`toggle-pill ${state.resultsState.filters.onlyNoFee ? 'active' : ''}`} onClick={() => updateFilters({ onlyNoFee: !state.resultsState.filters.onlyNoFee })} type="button">No fee</button>
              <button className={`toggle-pill ${state.resultsState.filters.onlyFurnished ? 'active' : ''}`} onClick={() => updateFilters({ onlyFurnished: !state.resultsState.filters.onlyFurnished })} type="button">Furnished</button>
            </div>

            <div className="results-list">
              {visibleListings.length ? (
                visibleListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} onSelect={selectListing} onShowDetails={openListingDetails} />
                ))
              ) : (
                <div className="empty-card">No listings in the current map window.</div>
              )}
            </div>

            {detailListing && (
              <ListingDrawer
                isFinalist={state.opsState.finalists.includes(detailListing.id)}
                isQueued={state.opsState.outreachQueue.some((i) => i.listingId === detailListing.id)}
                listing={detailListing}
                onAddSampleReply={addSampleReply}
                onClose={closeListingDetails}
                onQueueOutreach={queueOutreach}
                onRequestDecision={requestDecision}
              />
            )}
            {!detailListing && selectedListing && (
              <div className="selection-hint">Selected: <strong>{selectedListing.title}</strong>. Open details from the list when needed.</div>
            )}
          </div>
        </section>
      ) : state.opsState.activeTab === "outreach" ? (
        <OutreachQueue items={state.opsState.outreachQueue} onAddSampleReply={addSampleReply} onOpenListing={openListingFromOps} onRequestSend={requestSendDraft} />
      ) : (
        <InboxPanel items={state.opsState.inbox} onOpenListing={openListingFromOps} onRequestDecision={requestDecision} />
      )}

      <section className="panel finalists-panel warm-panel">
        <div className="panel-heading">
          <div className="stack tight"><span className="eyebrow">Manual handoff</span><h2>Finalists</h2></div>
        </div>
        <div className="finalist-strip">
          {state.opsState.finalists.length ? (
            state.opsState.finalists.map((listingId) => {
              const listing = listingMap.get(listingId);
              if (!listing) return null;
              return (
                <article key={listing.id} className="finalist-card">
                  <strong>{listing.title}</strong>
                  <p>Manual next step only. No booking, payment, or signing in this app.</p>
                  <div className="row wrap gap">
                    <button className="secondary-button" onClick={() => openListingFromOps(listing.id)} type="button">Review</button>
                    {listing.sourceUrl ? <a className="text-button" href={listing.sourceUrl} rel="noreferrer" target="_blank">Source</a> : <span className="data-disclosure">No source link</span>}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-card">Mark a listing as finalist when ready to continue manually.</div>
          )}
        </div>
      </section>

      <SendConfirmationModal draft={pendingDraft} onCancel={cancelSendDraft} onConfirm={() => pendingDraft && confirmSendDraft(pendingDraft.id)} />
      <DecisionConfirmationModal listing={pendingDecisionListing} onCancel={cancelDecision} onConfirm={() => pendingDecisionListing && confirmDecision(pendingDecisionListing.id)} />
    </div>
  );
}

export default function RentalsApp() {
  return (
    <AppStateProvider>
      <Workspace />
    </AppStateProvider>
  );
}
