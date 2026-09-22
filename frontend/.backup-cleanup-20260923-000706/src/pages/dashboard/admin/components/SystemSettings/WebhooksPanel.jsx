// ============================================================
// WebhooksPanel.jsx
// Webhooks management — add/remove/toggle.
// Bilingual + mobile-responsive + Async actions na rollback.
// ============================================================

import React, { useState } from "react";
import { Webhook, Plus, Trash2, Loader2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: tumia async variants
import {
  useWebhooks,
  addWebhookAsync,
  removeWebhookAsync,
  toggleWebhookAsync,
  WEBHOOK_EVENTS,
} from "../../../../../config/systemSettingsStore.js";

export default function WebhooksPanel() {
  const { lang } = useLanguage();
  const [webhooks] = useWebhooks();
  const [form, setForm] = useState({ event: "Payment Success", url: "" });
  // ⬇️ MPYA: busy + error
  const [busy, setBusy] = useState({}); // { [id]: true, adding: true }
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // HANDLERS — async + rollback
  // ============================================================
  const handleAdd = async () => {
    if (!form.url.trim() || busy.adding) return;

    setBusy((b) => ({ ...b, adding: true }));
    setError("");

    const res = await addWebhookAsync({
      event: form.event,
      url: form.url.trim(),
      active: true,
    });

    setBusy((b) => {
      const next = { ...b };
      delete next.adding;
      return next;
    });

    if (res.ok) {
      setForm({ event: "Payment Success", url: "" });
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuongeza webhook.", "Failed to add webhook.")
      );
    }
  };

  const handleRemove = async (id) => {
    if (busy[id]) return;

    setBusy((b) => ({ ...b, [id]: true }));
    setError("");

    const res = await removeWebhookAsync(id);

    setBusy((b) => {
      const next = { ...b };
      delete next[id];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa webhook.", "Failed to remove webhook.")
      );
    }
  };

  const handleToggle = async (id) => {
    if (busy[`toggle-${id}`]) return;

    setBusy((b) => ({ ...b, [`toggle-${id}`]: true }));
    setError("");

    const res = await toggleWebhookAsync(id);

    setBusy((b) => {
      const next = { ...b };
      delete next[`toggle-${id}`];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kubadilisha hali.", "Failed to toggle webhook.")
      );
    }
  };

  const canAdd = form.url.trim() && !busy.adding;

  // ============================================================
  // EVENT LABEL
  // ============================================================
  const getEventLabel = (eventId) => {
    const e = WEBHOOK_EVENTS.find((x) => x.id === eventId);
    if (!e) return eventId;
    return e.label?.[lang] || e.label?.sw || eventId;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        >
          <Webhook size={16} color={COLORS.night} />
        </div>
        <p className="text-sm font-semibold text-primary truncate">
          Webhooks
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {webhooks.map((w) => {
          const isRemoving = !!busy[w.id];
          const isToggling = !!busy[`toggle-${w.id}`];
          return (
            <div
              key={w.id}
              style={{ borderColor: COLORS.sandLine }}
              className="flex items-start justify-between gap-2 border rounded-lg px-3 py-2 min-w-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary truncate">
                  {getEventLabel(w.event)}
                </p>
                <p className="text-xs text-muted truncate">{w.url}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggle(w.id)}
                  disabled={isToggling || isRemoving}
                  style={{ color: w.active ? COLORS.green : "#9CA3AF" }}
                  className="text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded-full border border-gray-200 whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isToggling && <Loader2 size={10} className="animate-spin" />}
                  {w.active
                    ? lang === "sw"
                      ? "Hai"
                      : "Active"
                    : lang === "sw"
                      ? "Imezimwa"
                      : "Off"}
                </button>
                <button
                  onClick={() => handleRemove(w.id)}
                  disabled={isRemoving || isToggling}
                  className="text-muted hover:text-[#C1502E] p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={lang === "sw" ? "Ondoa" : "Remove"}
                >
                  {isRemoving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          );
        })}
        {webhooks.length === 0 && (
          <p className="text-xs text-muted py-1">
            {lang === "sw" ? "Hakuna webhook bado" : "No webhooks yet"}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
        <select
          value={form.event}
          onChange={(e) => setForm({ ...form, event: e.target.value })}
          disabled={busy.adding}
          className="border border-gray-200 rounded-lg px-2 py-2 text-xs w-full focus:border-[#E8A33D] outline-none disabled:opacity-50"
        >
          {WEBHOOK_EVENTS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label?.[lang] || e.label?.sw}
            </option>
          ))}
        </select>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && canAdd && handleAdd()}
            placeholder="https://..."
            disabled={busy.adding}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{
              background: canAdd ? COLORS.gold : COLORS.sandLine,
              color: canAdd ? COLORS.night : "var(--text-muted)",
            }}
            className="flex items-center justify-center gap-1 text-xs font-semibold rounded-lg px-3 py-2 w-full sm:w-auto shrink-0 transition-colors disabled:cursor-not-allowed"
          >
            {busy.adding ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            {lang === "sw" ? "Ongeza" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
