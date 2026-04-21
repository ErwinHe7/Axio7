import { ArrowRight, MapPin, TrainFront } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatLease,
  formatRoomType,
  formatSourceType,
} from "../utils/formatters";

export function ListingCard({ listing, onSelect, onShowDetails }) {
  const imageUrl = listing.images[0];

  return (
    <article
      className={`result-card ${listing.isSelected ? "selected" : ""} ${
        listing.isRecommended ? "recommended" : ""
      }`}
    >
      <button className="result-card-main" onClick={() => onSelect(listing.id)} type="button">
        <div className={`result-card-thumb ${imageUrl ? "" : "placeholder"}`}>
          {imageUrl ? <img alt={listing.title} src={imageUrl} /> : <span>No image</span>}
        </div>

        <div className="result-card-body">
          <div className="row between start">
            <div className="stack tight">
              <div className="row wrap gap">
                <span className={`source-type-chip ${listing.sourceType}`}>
                  {formatSourceType(listing.sourceType)}
                </span>
                <span className="provider-chip">{listing.provider}</span>
                {listing.isRecommended && <span className="tag recommended">Recommended</span>}
              </div>
              <h3>{listing.title}</h3>
            </div>
            <strong className="result-price">{formatCurrency(listing.price)}</strong>
          </div>

          <div className="result-meta">
            <span>
              <MapPin size={14} />
              {listing.neighborhood}, {listing.borough}
            </span>
            <span>
              <TrainFront size={14} />
              {listing.activeCommute ?? "--"} min commute
            </span>
            <span>{formatLease(listing)}</span>
            <span>Move-in {formatDate(listing.availableDate)}</span>
          </div>

          <div className="result-flags">
            <span className="tag">{formatRoomType(listing.roomType)}</span>
            <span className="tag">{listing.furnished ? "Furnished" : "Unfurnished"}</span>
            <span className={`tag ${listing.brokerFee ? "danger" : "safe"}`}>
              {listing.brokerFee ? "Broker fee" : "No fee"}
            </span>
            {listing.tags
              .filter((tag) => tag !== listing.sourceTypeLabel)
              .map((tag) => (
                <span key={tag} className="tag accent">
                  {tag}
                </span>
              ))}
          </div>
        </div>
      </button>

      <div className="result-card-actions">
        <span className="data-disclosure">{listing.dataDisclosure}</span>
        <button className="text-button" onClick={() => onShowDetails(listing.id)} type="button">
          Details
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}
