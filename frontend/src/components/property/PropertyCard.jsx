import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";

const STATUS_STYLES = {
  active: "bg-market/10 text-market-dark",
  reserved: "bg-gold/15 text-gold-dark",
  sold: "bg-ink-muted/15 text-ink-secondary",
  pending_approval: "bg-ink-muted/10 text-ink-secondary",
};

export default function PropertyCard({ property }) {
  const { t } = useLanguage();
  const statusStyle = STATUS_STYLES[property.status] || STATUS_STYLES.active;
  const statusLabel = t(`status_${property.status}`) || property.status;
  const image = Array.isArray(property.images) ? property.images[0] : null;

  return (
    <Link
      to={`/properties/${property.id}`}
      className="border border-ink-muted/15 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
    >
      <div className="h-40 bg-sand flex items-center justify-center text-ink-muted text-sm">
        {image ? (
          <img src={image} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          "—"
        )}
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-sm text-ink-primary line-clamp-1">{property.title}</h3>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-price text-ink-primary mt-1.5">
          TZS {Number(property.price).toLocaleString()}
        </p>
        <p className="text-xs text-ink-secondary mt-1">{property.location}</p>
        <p className="text-xs text-ink-muted mt-1">
          {t("seller_label")}: {property.seller?.name || "—"}
        </p>
      </div>
    </Link>
  );
}
