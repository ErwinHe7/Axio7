import { useRef, useState } from "react";
import { FileUp, Link2, Trash2 } from "lucide-react";
import { formatDateTime } from "../utils/formatters";

export function DataSourcesPanel({
  sourceBreakdown,
  importedCount,
  reviewQueue,
  lastImportSummary,
  onImportCsv,
  onClearImported,
  onAddReviewLink,
}) {
  const fileInputRef = useRef(null);
  const [linkForm, setLinkForm] = useState({
    provider: "Airbnb target",
    url: "",
    notes: "",
  });

  async function handleFileChange(event) {
    const [file] = Array.from(event.target.files || []);
    if (!file) {
      return;
    }

    await onImportCsv(file);
    event.target.value = "";
  }

  function handleReviewSubmit(event) {
    event.preventDefault();
    if (!linkForm.url.trim()) {
      return;
    }

    onAddReviewLink(linkForm);
    setLinkForm({
      provider: linkForm.provider,
      url: "",
      notes: "",
    });
  }

  return (
    <section className="panel data-sources-panel">
      <div className="panel-heading">
        <div className="stack tight">
          <span className="eyebrow">Data sources</span>
          <h2>Listing pipeline</h2>
        </div>
      </div>

      <div className="source-metrics">
        <article className="source-metric-card">
          <span>Live real</span>
          <strong>{sourceBreakdown.live || 0}</strong>
          <p>No live provider permission is connected yet.</p>
        </article>
        <article className="source-metric-card">
          <span>Imported real</span>
          <strong>{importedCount}</strong>
          <p>CSV-loaded listings with local normalization and map coordinates.</p>
        </article>
        <article className="source-metric-card">
          <span>Demo sample</span>
          <strong>{sourceBreakdown.demo || 0}</strong>
          <p>Demo adapters for product testing only.</p>
        </article>
      </div>

      <div className="data-tools-grid">
        <section className="data-tool-card">
          <div className="stack tight">
            <strong>CSV import</strong>
            <p>Load real listings with `title`, `price`, `latitude`, and `longitude`.</p>
          </div>

          <div className="row wrap gap">
            <input
              accept=".csv,text/csv"
              className="file-input"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
            <button className="secondary-button" onClick={() => fileInputRef.current?.click()} type="button">
              <FileUp size={16} />
              Import CSV
            </button>
            <button
              className="secondary-button"
              disabled={!importedCount}
              onClick={onClearImported}
              type="button"
            >
              <Trash2 size={16} />
              Clear imported
            </button>
          </div>

          {lastImportSummary && (
            <div className="import-summary">
              <strong>
                {lastImportSummary.importedCount} loaded, {lastImportSummary.rejectedCount} rejected
              </strong>
              {lastImportSummary.errors.length > 0 && (
                <ul className="import-error-list">
                  {lastImportSummary.errors.slice(0, 3).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section className="data-tool-card">
          <div className="stack tight">
            <strong>Link intake</strong>
            <p>Store listing links for manual review. No scraping or auto-ingestion.</p>
          </div>

          <form className="review-link-form" onSubmit={handleReviewSubmit}>
            <label className="field">
              <span>Source</span>
              <select
                onChange={(event) =>
                  setLinkForm((current) => ({ ...current, provider: event.target.value }))
                }
                value={linkForm.provider}
              >
                <option value="Airbnb target">Airbnb target</option>
                <option value="Zillow target">Zillow target</option>
                <option value="WeChat mini-program">WeChat mini-program</option>
                <option value="Other link">Other link</option>
              </select>
            </label>

            <label className="field wide-field">
              <span>URL</span>
              <input
                onChange={(event) =>
                  setLinkForm((current) => ({ ...current, url: event.target.value }))
                }
                placeholder="https://..."
                type="url"
                value={linkForm.url}
              />
            </label>

            <label className="field wide-field">
              <span>Notes</span>
              <input
                onChange={(event) =>
                  setLinkForm((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Optional review note"
                type="text"
                value={linkForm.notes}
              />
            </label>

            <button className="secondary-button" type="submit">
              <Link2 size={16} />
              Save for review
            </button>
          </form>

          <div className="review-queue">
            {reviewQueue.length ? (
              reviewQueue.slice(0, 3).map((entry) => (
                <article key={entry.id} className="review-link-card">
                  <strong>{entry.provider}</strong>
                  <a href={entry.url} rel="noreferrer" target="_blank">
                    {entry.url}
                  </a>
                  <span>{formatDateTime(entry.createdAt)}</span>
                </article>
              ))
            ) : (
              <div className="empty-card compact">No review links yet.</div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
