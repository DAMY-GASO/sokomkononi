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

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 rounded-lg flex items-center justify-center"
        >
          <UserCog size={16} color={COLORS.night} />
        </div>
        <p className="text-sm font-semibold text-gray-800">Sub-Admins</p>
      </div>

      <div className="flex flex-col gap-2">
        {subAdmins.map((a) => (
          <div
            key={a.id}
            style={{ borderColor: COLORS.sandLine }}
            className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700">{a.name}</p>
              <p className="text-xs text-gray-400 truncate">{a.email}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {a.permissions.map((p) => (
                  <span
                    key={p}
                    style={{ background: `${COLORS.gold}15`, color: COLORS.gold }}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => removeSubAdmin(a.id)}
              className="text-gray-300 hover:text-[#C1502E] shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {subAdmins.length === 0 && (
          <p className="text-xs text-gray-400">
            {lang === "sw" ? "Hakuna sub-admin bado" : "No sub-admins yet"}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={lang === "sw" ? "Jina" : "Name"}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERMISSION_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePerm(p)}
              style={{
                background: form.permissions.includes(p)
                  ? COLORS.night
                  : "white",
                color: form.permissions.includes(p) ? COLORS.sand : COLORS.night,
                borderColor: COLORS.sandLine,
              }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={add}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center justify-center gap-1 text-xs font-semibold rounded-lg px-3 py-2 self-start"
        >
          <Plus size={13} />{" "}
          {lang === "sw" ? "Ongeza Sub-Admin" : "Add Sub-Admin"}
        </button>
      </div>
    </div>
  );
}
