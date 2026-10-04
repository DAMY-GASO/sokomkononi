// ============================================================
// src/pages/SimilarListingsSection.jsx
// Buyer — mali nyingine zinazofanana na listing anayotazama.
// ============================================================

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Eye, ArrowRight } from "lucide-react";
import { COLORS } from "./dashboard/components/shared";
import ListingImage from "../components/ListingImage.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
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
    <div className="mt-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="text-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-primary">
            {t("Mali Nyingine Zinazofanana", "Similar Properties")}
          </h2>
          <p className="text-sm text-secondary mt-1">
            {t("Unaweza pia kupenda hizi", "You might also like these")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {listings.map((item) => {
            const imageUrl =
              item.primary_image ||
              item.image ||
              (Array.isArray(item.images) && item.images[0]) ||
              null;

            return (
              <Link
                key={item.id}
                to={`/mali/${item.id}`}
                className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col no-underline bg-white"
              >
                <div className="aspect-video bg-sand overflow-hidden">
                  {imageUrl ? (
                    <ListingImage
                      src={imageUrl}
                      alt={item.title}
                      ratio="h-full w-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                      {t("Hakuna picha", "No image")}
                    </div>
                  )}
                </div>

                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  <p className="text-primary text-sm font-semibold line-clamp-2">
                    {item.title}
                  </p>

                  <p
                    style={{ color: COLORS.gold }}
                    className="font-bold text-sm"
                  >
                    {formatTZS(item.price)}
                  </p>

                  {item.location && (
                    <p className="text-xs text-muted flex items-center gap-1">
                      <MapPin size={10} />
                      <span className="line-clamp-1">{item.location}</span>
                    </p>
                  )}

                  {item.views_count != null && (
                    <p className="text-xs text-muted flex items-center gap-1">
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
            );
          })}
        </div>
      </div>
    </div>
  );
}