import { ExternalLink, MessageSquareShare, ShieldAlert, ShieldCheck, X } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatLease,
  formatRoomType,
  formatSourceType,
} from "../utils/formatters";

export function ListingDrawer({
  listing,
  onQueueOutreach,
  onRequestDecision,
  onAddSampleReply,
  onClose,
  isQueued,
  isFinalist,
}) {
  if (!listing) {
    return null;
  }

  return (
    <section className="detail-panel">
      <div className="detail-head">
        <div className="stack tight">
          <div className="row wrap gap">
            <span className={`source-type-chip ${listing.sourceType}`}>
              {formatSourceType(listing.sourceType)}
            </span>
            <span className="provider-chip">{listing.provider}</span>
          </div>
          <h2>Listing details</h2>
          <strong>{listing.title}</strong>
        </div>

        <div className="row wrap gap end">
          {listing.sourceUrl ? (
            <a className="text-button" href={listing.sourceUrl} rel="noreferrer" target="_blank">
              {listing.sourceUrlLabel || "Source link"}
              <ExternalLink size={14} />
            </a>
          ) : (
            <span className="data-disclosure">No source link</span>
          )}
          <button className="icon-button" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-stat">
          <span>Price</span>
          <strong>{formatCurrency(listing.price)}</strong>
        </div>
        <div className="detail-stat">
          <span>Location</span>
          <strong>{listing.addressLabel || `${listing.neighborhood}, ${listing.borough}`}</strong>
        </div>
        <div className="detail-stat">
          <span>Lease</span>
          <strong>{formatLease(listing)}</strong>
        </div>
        <div className="detail-stat">
          <span>Move-in</span>
          <strong>{formatDate(listing.availableDate)}</strong>
        </div>
        <div className="detail-stat">
          <span>Room</span>
          <strong>{formatRoomType(listing.roomType)}</strong>
        </div>
        <div className="detail-stat">
          <span>Source</span>
          <strong>
            {formatSourceType(listing.sourceType)} | {listing.provider}
          </strong>
        </div>
      </div>

      <div className="detail-body-grid">
        <article className="detail-block">
          <h3>Why it may fit</h3>
          <div className="reason-list">
            {listing.matchReasons.map((reason) => (
              <span key={reason} className="reason-pill">
                {reason}
              </span>
            ))}
          </div>
        </article>

        <article className="detail-block">
          <h3>Risk / missing info</h3>
          <div className="stack-list">
            {listing.riskFlags.length ? (
              listing.riskFlags.map((flag) => (
                <div key={flag} className="risk-item">
                  <ShieldAlert size={14} />
                  <span>{flag}</span>
                </div>
              ))
            ) : (
              <div className="safe-note">
                <ShieldCheck size={16} />
                <span>No major risk flags in the current record.</span>
              </div>
            )}
          </div>
        </article>
      </div>

      <article className="detail-block">
        <h3>Summary</h3>
        <p>{listing.description}</p>
        <p className="data-disclosure">{listing.dataDisclosure}</p>
      </article>

      <article className="detail-block">
        <h3>Contact owner</h3>
        <div className="row wrap gap">
          <button
            className="primary-button"
            disabled={isQueued}
            onClick={() => onQueueOutreach(listing)}
            type="button"
          >
            <MessageSquareShare size={16} />
            {isQueued ? "In queue" : "Draft only"}
          </button>
          <button
            className="secondary-button"
            disabled={listing.outreachState !== "sent" && listing.outreachState !== "sample-reply"}
            onClick={() => onAddSampleReply(listing.id)}
            type="button"
          >
            Add sample reply
          </button>
          <button
            className="secondary-button"
            disabled={listing.outreachState !== "sample-reply" && listing.outreachState !== "sent"}
            onClick={() => onRequestDecision(listing.id)}
            type="button"
          >
            {isFinalist ? "Finalist" : "Continue manually"}
          </button>
        </div>
        <p className="data-disclosure">
          Contact flow is not live-connected in this local build. Drafts and sends are simulated.
        </p>
      </article>
    </section>
  );
}
