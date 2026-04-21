import { BellRing, MessageSquareReply, ShieldX } from "lucide-react";

export function InboxPanel({ items, onOpenListing, onRequestDecision }) {
  return (
    <section className="panel ops-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Inbox</span>
          <h2>Sample replies</h2>
        </div>
      </div>

      <div className="queue-list">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="reply-card">
              <div className="row between start">
                <div className="stack tight">
                  <strong>{item.subject}</strong>
                  <p>{item.summary}</p>
                </div>
                <span className="status-chip replied">
                  <BellRing size={14} />
                  {item.statusLabel}
                </span>
              </div>

              <div className="reply-body">{item.body}</div>

              <div className="reason-list">
                {item.suggestions.map((suggestion) => (
                  <span key={suggestion} className="reason-pill">
                    {suggestion}
                  </span>
                ))}
              </div>

              <div className="row wrap gap">
                <button
                  className="secondary-button"
                  onClick={() => onOpenListing(item.listingId)}
                  type="button"
                >
                  <MessageSquareReply size={16} />
                  Open listing
                </button>
                <button
                  className="primary-button"
                  onClick={() => onRequestDecision(item.listingId)}
                  type="button"
                >
                  Continue manually
                </button>
              </div>

              <div className="reply-footnote">
                <ShieldX size={14} />
                Demo only. This is not a live owner reply.
              </div>
            </article>
          ))
        ) : (
          <div className="empty-card">No sample replies yet.</div>
        )}
      </div>
    </section>
  );
}
