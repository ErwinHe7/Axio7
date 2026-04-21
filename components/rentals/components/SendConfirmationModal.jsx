import { Send, ShieldCheck, X } from "lucide-react";

export function SendConfirmationModal({ draft, onCancel, onConfirm }) {
  if (!draft) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="row between start">
          <div>
            <span className="eyebrow">Confirm send</span>
            <h2>Send this simulated draft?</h2>
          </div>
          <button className="icon-button" onClick={onCancel} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="modal-card">
          <strong>{draft.subject}</strong>
          <p>Mode: simulated send only</p>
          <p>Source type: {draft.sourceTypeLabel}</p>
          <p>Channel: {draft.channel}</p>
          <p>Recipient: {draft.recipientName}</p>
          <pre>{draft.body}</pre>
        </div>

        <div className="safe-note">
          <ShieldCheck size={16} />
          <span>
            This local build does not send real outreach yet. No booking, payment, or commitment happens here.
          </span>
        </div>

        <div className="row gap end">
          <button className="secondary-button" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="primary-button" onClick={onConfirm} type="button">
            <Send size={16} />
            Send simulated inquiry
          </button>
        </div>
      </div>
    </div>
  );
}
