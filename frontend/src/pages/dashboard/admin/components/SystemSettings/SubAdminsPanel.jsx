// ============================================================
// SubAdminsPanel.jsx
// Sub-Admins management — add/remove with permissions.
// Bilingual + mobile-responsive.
// ============================================================

import React, { useState } from "react";
import { UserCog, Plus, Trash2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  useSubAdmins,
  addSubAdmin,
  removeSubAdmin,
  PERMISSION_OPTIONS,
} from "../../../../../config/systemSettingsStore.js";

export default function SubAdminsPanel() {
  const { lang } = useLanguage();
  const [subAdmins] = useSubAdmins();
  const [form, setForm] = useState({ name: "", email: "", permissions: [] });

  const togglePerm = (p) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p)
        ? f.permissions.filter((x) => x !== p)
        : [...f.permissions, p],
    }));
  };

  const add = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    addSubAdmin({ id: Date.now(), ...form });
    setForm({ name: "", email: "", permissions: [] });
  };

  const canAdd = form.name.trim() && form.email.trim();

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
        <p className="text-sm font-semibold text-gray-800 truncate">
          Sub-Admins
        </p>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {subAdmins.map((a) => (
          <div
            key={a.id}
            style={{ borderColor: COLORS.sandLine }}
            className="flex items-start justify-between gap-2 border rounded-lg px-3 py-2 min-w-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 truncate">
                {a.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{a.email}</p>
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
              onClick={() => removeSubAdmin(a.id)}
              className="text-gray-300 hover:text-[#C1502E] shrink-0 p-1 transition-colors"
              aria-label={lang === "sw" ? "Ondoa" : "Remove"}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {subAdmins.length === 0 && (
          <p className="text-xs text-gray-400 py-1">
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
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D]"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D]"
          />
        </div>

        {/* Permissions */}
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">
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
                  style={{
                    background: isActive ? COLORS.night : "white",
                    color: isActive ? COLORS.sand : COLORS.night,
                    borderColor: COLORS.sandLine,
                  }}
                  className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors"
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add button — full width kwenye simu */}
        <button
          onClick={add}
          disabled={!canAdd}
          style={{
            background: canAdd ? COLORS.gold : COLORS.sandLine,
            color: canAdd ? COLORS.night : "rgba(16,26,46,0.4)",
          }}
          className="flex items-center justify-center gap-1 text-xs font-semibold rounded-lg px-3 py-2 w-full sm:w-auto sm:self-start transition-colors"
        >
          <Plus size={13} />
          {lang === "sw" ? "Ongeza Sub-Admin" : "Add Sub-Admin"}
        </button>
      </div>
    </div>
  );
}
