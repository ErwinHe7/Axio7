import { ShieldCheck, X } from "lucide-react";

export function DecisionConfirmationModal({ listing, onCancel, onConfirm }) {
  if (!listing) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="row between start">
          <div>
            <span className="eyebrow">Manual handoff</span>
            <h2>Proceed with this listing manually.</h2>
          </div>
          <button className="icon-button" onClick={onCancel} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="modal-card">
          <strong>{listing.title}</strong>
          <p>
            This marks the listing as a finalist and hands control back to the renter for tours,
            applications, payment, and lease review.
          </p>
        </div>

        <div className="safe-note">
          <ShieldCheck size={16} />
          <span>
            Rental Agent Web never auto-rents, auto-pays, auto-books, or auto-signs anything.
          </span>
        </div>

        <div className="row gap end">
          <button className="secondary-button" onClick={onCancel} type="button">
            Back
          </button>
          <button className="primary-button" onClick={onConfirm} type="button">
            Mark as finalist
          </button>
        </div>
      </div>
    </div>
  );
}
