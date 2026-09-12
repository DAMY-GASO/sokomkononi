import React, { useState } from "react";
import { Webhook, Plus, Trash2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  useWebhooks,
  addWebhook,
  removeWebhook,
  toggleWebhook,
} from "../../../../../config/systemSettingsStore.js";

export default function WebhooksPanel() {
  const { lang } = useLanguage();
  const [webhooks] = useWebhooks();
  const [form, setForm] = useState({ event: "Payment Success", url: "" });

  const add = () => {
    if (!form.url.trim()) return;
    addWebhook({
      id: Date.now(),
      event: form.event,
      url: form.url.trim(),
      active: true,
    });
    setForm({ event: "Payment Success", url: "" });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 rounded-lg flex items-center justify-center"
        >
          <Webhook size={16} color={COLORS.night} />
        </div>
        <p className="text-sm font-semibold text-gray-800">Webhooks</p>
      </div>

      <div className="flex flex-col gap-2">
        {webhooks.map((w) => (
          <div
            key={w.id}
            style={{ borderColor: COLORS.sandLine }}
            className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700">{w.event}</p>
              <p className="text-xs text-gray-400 truncate">{w.url}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleWebhook(w.id)}
                style={{ color: w.active ? COLORS.green : "#9CA3AF" }}
                className="text-[11px] font-semibold px-2 py-1 rounded-full border border-gray-200"
              >
                {w.active ? (lang === "sw" ? "Hai" : "Active") : (lang === "sw" ? "Imezimwa" : "Off")}
              </button>
              <button
                onClick={() => removeWebhook(w.id)}
                className="text-gray-300 hover:text-[#C1502E]"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {webhooks.length === 0 && (
          <p className="text-xs text-gray-400">
            {lang === "sw" ? "Hakuna webhook bado" : "No webhooks yet"}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
        <select
          value={form.event}
          onChange={(e) => setForm({ ...form, event: e.target.value })}
          className="border border-gray-200 rounded-lg px-2 py-2 text-xs"
        >
          <option>Payment Success</option>
          <option>Payment Failed</option>
          <option>SMS Notification</option>
          <option>New Listing</option>
        </select>
        <input
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
        />
        <button
          onClick={add}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center justify-center gap-1 text-xs font-semibold rounded-lg px-3 py-2"
        >
          <Plus size={13} /> {lang === "sw" ? "Ongeza" : "Add"}
        </button>
      </div>
    </div>
  );
}
