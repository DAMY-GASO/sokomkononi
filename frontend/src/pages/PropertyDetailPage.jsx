import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProperty } from "../api/property.api";
import { createDealRoom } from "../api/dealroom.api";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [property, setProperty] = useState(null);

  useEffect(() => {
    fetchProperty(id).then((res) => setProperty(res.data));
  }, [id]);

  async function handleBuyNow() {
    try {
      const res = await createDealRoom(id);
      navigate(`/deal-rooms/${res.data.id}`);
    } catch (err) {
      alert(err?.response?.data?.message || "Imeshindikana kuanzisha Deal Room");
    }
  }

  if (!property) return <p className="p-8 text-center text-ink-muted text-sm">Inapakia...</p>;

  const isReserved = property.status === "reserved";

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-ink-primary">{property.title}</h1>
      <p className="text-price text-2xl text-ink-primary mt-2">
        TZS {Number(property.price).toLocaleString()}
      </p>
      <p className="text-ink-secondary text-sm mt-1">{property.location}</p>
      <p className="mt-4 text-ink-primary text-sm leading-relaxed">{property.description}</p>
      <p className="mt-2 text-xs text-ink-muted">{t("seller_label")}: {property.seller?.name}</p>

      <button
        onClick={handleBuyNow}
        className="mt-6 bg-gold hover:bg-gold-dark text-night px-6 py-3 rounded-md font-semibold text-sm"
      >
        {isReserved ? t("join_waiting_list") : t("buy_now")}
      </button>
    </div>
  );
}
