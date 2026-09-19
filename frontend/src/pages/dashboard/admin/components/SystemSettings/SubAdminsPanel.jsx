// ============================================================
// SubAdminsPanel.jsx
// Sub-Admins management — add/remove with permissions.
// Bilingual + mobile-responsive + Async actions na rollback.
// ============================================================

import React, { useState } from "react";
import { UserCog, Plus, Trash2, Loader2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: tumia async variants
import {
  useSubAdmins,
  addSubAdminAsync,
  removeSubAdminAsync,
  PERMISSION_OPTIONS,
} from "../../../../../config/systemSettingsStore.js";

export default function SubAdminsPanel() {
  const { lang } = useLanguage();
  const [subAdmins] = useSubAdmins();
  const [form, setForm] = useState({ name: "", email: "", permissions: [] });
  // ⬇️ MPYA: busy + error
  const [busy, setBusy] = useState({}); // { [id]: true, adding: true }
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const togglePerm = (p) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p)
        ? f.permissions.filter((x) => x !== p)
        : [...f.permissions, p],
    }));
  };

  // ============================================================
  // HANDLERS — async + rollback
  // ============================================================
  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim() || busy.adding) return;

    setBusy((b) => ({ ...b, adding: true }));
    setError("");

    const res = await addSubAdminAsync({
      name: form.name.trim(),
      email: form.email.trim(),
      roleKey: null, // systemSettings haina roleKey — ni kwa RBAC pekee
      permissions: form.permissions,
    });

    setBusy((b) => {
      const next = { ...b };
      delete next.adding;
      return next;
    });

    if (res.ok) {
      setForm({ name: "", email: "", permissions: [] });
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuongeza sub-admin.", "Failed to add sub-admin.")
      );
    }
  };

  const handleRemove = async (id) => {
    if (busy[id]) return;

    setBusy((b) => ({ ...b, [id]: true }));
    setError("");

    const res = await removeSubAdminAsync(id);

    setBusy((b) => {
      const next = { ...b };
      delete next[id];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa sub-admin.", "Failed to remove sub-admin.")
      );
    }
  };

  const canAdd = form.name.trim() && form.email.trim() && !busy.adding;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        >
          <UserCog size={16} color={COLORS.night} />
        </div>
        <p className="text-sm font-semibold text-primary truncate">
          Sub-Admins
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
        {subAdmins.map((a) => {
          const isRemoving = !!busy[a.id];
          return (
            <div
              key={a.id}
              style={{ borderColor: COLORS.sandLine }}
              className="flex items-start justify-between gap-2 border rounded-lg px-3 py-2 min-w-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary truncate">
                  {a.name}
                </p>
                <p className="text-xs text-muted truncate">{a.email}</p>
                {a.permissions?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {a.permissions.map((p) => (
                      <span
                        key={p}
                        style={{
                          background: `${COLORS.gold}15`,
                          color: COLORS.gold,
                        }}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemove(a.id)}
                disabled={isRemoving}
                className="text-muted hover:text-[#C1502E] shrink-0 p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={lang === "sw" ? "Ondoa" : "Remove"}
              >
                {isRemoving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          );
        })}
        {subAdmins.length === 0 && (
          <p className="text-xs text-muted py-1">
            {lang === "sw" ? "Hakuna sub-admin bado" : "No sub-admins yet"}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
        {/* Name + Email */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={lang === "sw" ? "Jina" : "Name"}
            disabled={busy.adding}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            disabled={busy.adding}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </div>

        {/* Permissions */}
        <div>
          <p className="text-[10px] font-semibold text-secondary uppercase mb-1.5">
            {lang === "sw" ? "Ruhusa" : "Permissions"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PERMISSION_OPTIONS.map((p) => {
              const isActive = form.permissions.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePerm(p)}
                  disabled={busy.adding}
                  style={{
                    background: isActive ? COLORS.night : "white",
                    color: isActive ? COLORS.sand : "var(--text-primary)",
                    borderColor: COLORS.sandLine,
                  }}
                  className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors disabled:opacity-50"
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          style={{
            background: canAdd ? COLORS.gold : COLORS.sandLine,
            color: canAdd ? COLORS.night : "var(--text-muted)",
          }}
          className="flex items-center justify-center gap-1 text-xs font-semibold rounded-lg px-3 py-2 w-full sm:w-auto sm:self-start transition-colors disabled:cursor-not-allowed"
        >
          {busy.adding ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Plus size={13} />
          )}
          {lang === "sw" ? "Ongeza Sub-Admin" : "Add Sub-Admin"}
        </button>
      </div>
    </div>
  );
}
