// ============================================================
// src/pages/SimilarListingsSection.jsx
// Buyer — mali nyingine zinazofanana na listing anayotazama.
// ============================================================

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Eye, ArrowRight } from "lucide-react";

const COLORS = {
  gold: "#E8A33D",
  night: "#101A2E",
  sand: "#F5F3EC",
  sandLine: "#E5E1D3",
  green: "#2F6D4F",
  rust: "#C1502E",
};

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function formatTZS(amount) {
  if (amount == null) return "";
  const num = Number(amount);
  if (isNaN(num)) return "";
  return `TZS ${num.toLocaleString("en-US")}`;
}

export default function SimilarListingsSection({ listingId, lang = "sw" }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (!listingId) return;

    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE}/listings/${listingId}/similar/`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setListings(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setListings([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (loading || listings.length === 0) {
    return null;
  }

  return (
    <div
      style={{ background: COLORS.sand }}
      className="w-full py-6 px-4 sm:px-6"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h2
            style={{ color: COLORS.night }}
            className="text-lg sm:text-xl font-bold"
          >
            {t("Mali Nyingine Zinazofanana", "Similar Properties")}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("Unaweza pia kupenda hizi", "You might also like these")}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {listings.map((item) => (
            <Link
              key={item.id}
              to={`/mali/${item.id}`}
              style={{
                borderColor: COLORS.sandLine,
                background: "white",
              }}
              className="rounded-xl border overflow-hidden hover:shadow-md transition-shadow flex flex-col no-underline"
            >
              {/* Image */}
              <div className="aspect-video bg-gray-100 overflow-hidden">
                {item.primary_image || item.image ? (
                  <img
                    src={item.primary_image || item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    {t("Hakuna picha", "No image")}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <p
                  style={{ color: COLORS.night }}
                  className="text-sm font-semibold line-clamp-2"
                >
                  {item.title}
                </p>

                <p
                  style={{ color: COLORS.gold }}
                  className="font-bold text-sm"
                >
                  {formatTZS(item.price)}
                </p>

                {item.location && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={10} />
                    <span className="line-clamp-1">{item.location}</span>
                  </p>
                )}

                {item.views_count != null && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Eye size={10} />
                    {item.views_count} {t("wameona", "views")}
                  </p>
                )}

                <div
                  style={{ color: COLORS.gold }}
                  className="text-xs font-semibold flex items-center gap-1 mt-auto pt-1"
                >
                  {t("Angalia", "View")}
                  <ArrowRight size={10} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}