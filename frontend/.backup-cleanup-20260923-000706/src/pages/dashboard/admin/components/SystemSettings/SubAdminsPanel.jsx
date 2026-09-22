// ============================================================
// SubAdminsPanel.jsx
// NOTE: Backend uses StaffAssignment schema: { user: <int>, role: <int>, active }
// This panel requires numeric userId + roleId.
// For richer role management, prefer the RBACSection (Roles & Staff).
// ============================================================
import React, { useState } from "react";
import { UserCog, Plus, Trash2, Loader2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  useSubAdmins,
  addSubAdminAsync,
  removeSubAdminAsync,
} from "../../../../../config/systemSettingsStore.js";
import { useRoles } from "../../../../../config/rolesStore.js";

export default function SubAdminsPanel() {
  const { lang } = useLanguage();
  const [subAdmins] = useSubAdmins();
  const roles = useRoles();

  const [form, setForm] = useState({
    userId: "",
    roleId: "",
    name: "",
    email: "",
  });
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleAdd = async () => {
    const userId = Number(form.userId);
    const roleId = Number(form.roleId);
    if (!userId || !roleId) {
      setError(
        t(
          "Weka User ID na uchague Role.",
          "Enter User ID and pick a Role."
        )
      );
      return;
    }
    if (busy.adding) return;

    setBusy((b) => ({ ...b, adding: true }));
    setError("");

    const res = await addSubAdminAsync({
      userId,
      roleId,
      name: form.name.trim(),
      email: form.email.trim(),
    });

    setBusy((b) => { const n = { ...b }; delete n.adding; return n; });

    if (res.ok) {
      setForm({ userId: "", roleId: "", name: "", email: "" });
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
    setBusy((b) => { const n = { ...b }; delete n[id]; return n; });
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa sub-admin.", "Failed to remove sub-admin.")
      );
    }
  };

  const canAdd =
    Number(form.userId) > 0 && Number(form.roleId) > 0 && !busy.adding;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        >
          <UserCog size={16} color={COLORS.night} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary truncate">
            Sub-Admins
          </p>
          <p className="text-[11px] text-secondary">
            {t(
              "Hitaji User ID + Role. Kwa mfumo kamili tumia RBAC section.",
              "Requires User ID + Role. For full management use the RBAC section."
            )}
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {subAdmins.map((a) => {
          const isRemoving = !!busy[a.id];
          const role = roles.find((r) => r.id === a.roleId || r.id === a.role);
          return (
            <div
              key={a.id}
              style={{ borderColor: COLORS.sandLine }}
              className="flex items-start justify-between gap-2 border rounded-lg px-3 py-2 min-w-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary truncate">
                  {a.name || `User #${a.userId || a.user}`}
                </p>
                <p className="text-xs text-muted truncate">
                  {a.email || ""}
                </p>
                {role && (
                  <span
                    style={{ background: `${COLORS.gold}15`, color: COLORS.gold }}
                    className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1"
                  >
                    {role.label?.[lang] || role.label?.sw || role.key}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleRemove(a.id)}
                disabled={isRemoving}
                className="text-muted hover:text-[#C1502E] shrink-0 p-1 transition-colors disabled:opacity-50"
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

      <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={form.userId}
            onChange={(e) =>
              setForm({ ...form, userId: e.target.value.replace(/\D/g, "") })
            }
            placeholder={t("User ID (namba)", "User ID (numeric)")}
            inputMode="numeric"
            disabled={busy.adding}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
          <select
            value={form.roleId}
            onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            disabled={busy.adding}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          >
            <option value="">
              {t("Chagua Role...", "Pick a Role...")}
            </option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label?.[lang] || r.label?.sw || r.key} (#{r.id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("Jina (hiari)", "Name (optional)")}
            disabled={busy.adding}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t("Email (hiari)", "Email (optional)")}
            disabled={busy.adding}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </div>

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
