import React, { useEffect, useMemo, useState } from "react";
import { fetchMyListings } from "../../api/property.api";
import { useLanguage } from "../../context/LanguageContext.jsx";
import PropertyCard from "../property/PropertyCard.jsx";
import PropertyForm from "../property/PropertyForm.jsx";

export default function SellerView() {
  const { t } = useLanguage();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  function loadListings() {
    setLoading(true);
    fetchMyListings()
      .then((res) => setListings(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadListings();
  }, []);

  const stats = useMemo(() => {
    const count = (status) => listings.filter((l) => l.status === status).length;
    return {
      active: count("active"),
      reserved: count("reserved"),
      sold: count("sold"),
      pending: count("pending_approval"),
    };
  }, [listings]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-ink-primary">{t("sell_heading")}</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-gold hover:bg-gold-dark text-night px-4 py-2 rounded-md text-sm font-semibold"
        >
          {showForm ? t("sell_close_button") : t("sell_add_button")}
        </button>
      </div>

      {!loading && listings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatPill value={stats.active} label={t("sell_stat_active")} color="text-market-dark" />
          <StatPill value={stats.reserved} label={t("sell_stat_reserved")} color="text-gold-dark" />
          <StatPill value={stats.sold} label={t("sell_stat_sold")} color="text-ink-secondary" />
          <StatPill value={stats.pending} label={t("sell_stat_pending")} color="text-ink-secondary" />
        </div>
      )}

      {showForm && (
        <div className="mb-6">
          <PropertyForm onCreated={() => { setShowForm(false); loadListings(); }} />
        </div>
      )}

      {loading && <p className="text-ink-muted text-sm">{t("sell_loading")}</p>}
      {!loading && listings.length === 0 && (
        <p className="text-ink-muted text-sm">{t("sell_empty")}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </div>
  );
}

function StatPill({ value, label, color }) {
  return (
    <div className="border border-ink-muted/15 rounded-md px-3 py-2.5">
      <p className={`text-price ${color}`}>{value}</p>
      <p className="text-xs text-ink-muted mt-0.5">{label}</p>
    </div>
  );
}
