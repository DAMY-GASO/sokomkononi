import React, { useState } from "react";
import BuyerView from "../components/dashboard/BuyerView.jsx";
import SellerView from "../components/dashboard/SellerView.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [mode, setMode] = useState("buy"); // "buy" | "sell"

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      {/* TODO: Global header yenye rotating banners (matangazo ya sekunde 5) */}
      <div className="flex gap-2 mb-6 border-b border-ink-muted/20">
        <button
          onClick={() => setMode("buy")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 ${
            mode === "buy" ? "border-gold text-ink-primary" : "border-transparent text-ink-muted"
          }`}
        >
          {t("dash_buy_tab")}
        </button>
        <button
          onClick={() => setMode("sell")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 ${
            mode === "sell" ? "border-market text-ink-primary" : "border-transparent text-ink-muted"
          }`}
        >
          {t("dash_sell_tab")}
        </button>
      </div>

      {mode === "buy" ? <BuyerView /> : <SellerView />}
    </div>
  );
}
