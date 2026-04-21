import { Mail, MessageSquare, Send } from "lucide-react";

export function OutreachQueue({ items, onRequestSend, onOpenListing, onAddSampleReply }) {
  return (
    <section className="panel ops-panel">
      <div className="panel-heading">
        <div className="stack tight">
          <span className="eyebrow">Outreach</span>
          <h2>Draft queue</h2>
        </div>
      </div>

      <div className="queue-list">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="queue-card">
              <div className="row between start">
                <div className="stack tight">
                  <strong>{item.subject}</strong>
                  <p>
                    {item.recipientName} | {item.sourceTypeLabel}
                  </p>
                </div>
                <span className={`status-chip ${item.status}`}>{item.statusLabel}</span>
              </div>

              <div className="queue-meta">
                {item.channel === "sms" ? <MessageSquare size={14} /> : <Mail size={14} />}
                <span>{item.channel}</span>
                <span>Simulated only</span>
              </div>

              <p className="draft-body">{item.body}</p>

              <div className="row wrap gap">
                <button
                  className="secondary-button"
                  onClick={() => onOpenListing(item.listingId)}
                  type="button"
                >
                  View listing
                </button>
                <button
                  className="primary-button"
                  disabled={item.status !== "draft"}
                  onClick={() => onRequestSend(item.id)}
                  type="button"
                >
                  <Send size={16} />
                  Confirm simulated send
                </button>
                <button
                  className="secondary-button"
                  disabled={item.status !== "sent"}
                  onClick={() => onAddSampleReply(item.listingId)}
                  type="button"
                >
                  Add sample reply
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-card">No drafts yet.</div>
        )}
      </div>
    </section>
  );
}
