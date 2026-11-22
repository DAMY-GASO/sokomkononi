// ============================================================
// RBACSection.jsx — COMPLETE
// Roles + Staff management (API-backed, bilingual, responsive)
//
// Marekebisho ya mwisho:
//  - RoleForm: key field (slug) + auto-generation kutoka label.en
//  - handleAddRole: inatumia form.key kama ipo
//  - StaffCard: fallback kwa roleKey null
//  - useEffect: hydrateRolesFromApi() kwenye mount
//  - profile permission imo (16 total)
//  - busy-state handling iliyorekebishwa
// ============================================================
import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Pencil,
  Save,
  Lock,
  UserCog,
  Loader2,
  LayoutGrid,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useUsers, hydrateUsersFromApi } from "../../../../config/usersStore.js";
import {
  useAuditLogs,
  AUDIT_ACTIONS,
} from "../../../../config/auditLogsStore.js";
import {
  useRoles,
  useSubAdminsWithRoles,
  addRoleAsync,
  updateRoleAsync,
  removeRoleAsync,
  addStaffAsync,
  updateStaffAsync,
  removeStaffAsync,
  hydrateRolesFromApi,
  PERMISSIONS,
} from "../../../../config/rolesStore.js";

// ============================================================
// TABS
// ============================================================
const TABS = [
  { key: "roles", label: { sw: "Wadhifa", en: "Roles" }, icon: ShieldCheck },
  { key: "staff", label: { sw: "Wafanyakazi", en: "Staff" }, icon: UserCog },
  {
    key: "matrix",
    label: { sw: "Matrix ya Ruhusa", en: "Permission Matrix" },
    icon: LayoutGrid,
  },
];

// ============================================================
// ROLE CARD
// ============================================================
function RoleCard({ role, lang, onEdit, onDelete, isBusy }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const count = role.permissions.length;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
      className="rounded-xl border p-3 sm:p-4 w-full min-w-0"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-primary truncate">
              {role.label?.[lang] || role.label?.sw || role.key}
            </p>
            {role.isSystem && (
              <span
                style={{ background: `${COLORS.night}0D`, color: COLORS.night }}
                className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
              >
                <Lock size={10} /> {t("Mfumo", "System")}
              </span>
            )}
            <span
              style={{ background: `${COLORS.night}0D`, color: COLORS.night }}
              className="text-xs font-mono px-2 py-0.5 rounded-full shrink-0"
            >
              {role.key}
            </span>
          </div>
          <p className="text-xs text-secondary leading-relaxed line-clamp-2">
            {role.description?.[lang] || role.description?.sw || "—"}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(role)}
            disabled={isBusy}
            className="p-1.5 text-muted hover:text-gold-ink transition-colors disabled:opacity-50"
            aria-label={t("Hariri", "Edit")}
          >
            <Pencil size={14} />
          </button>
          {!role.isSystem && (
            <button
              onClick={() => onDelete(role)}
              disabled={isBusy}
              className="p-1.5 text-muted hover:text-rust transition-colors disabled:opacity-50"
              aria-label={t("Futa", "Delete")}
            >
              {isBusy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted uppercase mb-1.5">
          {t(`Ruhusa (${count})`, `Permissions (${count})`)}
        </p>
        {count === 0 ? (
          <p className="text-xs text-muted italic">
            {t("Hakuna ruhusa.", "No permissions.")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {role.permissions.map((perm) => {
              const permission = PERMISSIONS.find((p) => p.key === perm);
              return (
                <span
                  key={perm}
                  style={{
                    background: `${COLORS.green}15`,
                    color: COLORS.green,
                  }}
                  className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                >
                  {permission?.label?.[lang] || permission?.label?.sw || perm}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ROLE FORM
// ============================================================
function RoleForm({ initial, lang, onSave, onCancel, saving }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const isEditing = !!initial?.key;

  const [form, setForm] = useState({
    key: initial?.key || "",
    label: initial?.label || { sw: "", en: "" },
    description: initial?.description || { sw: "", en: "" },
    permissions: initial?.permissions || [],
  });

  const togglePermission = (perm) =>
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));

  // Auto-generate key kutoka label.en wakati wa kuunda role mpya
  const handleLabelEnChange = (value) => {
    setForm((prev) => ({
      ...prev,
      label: { ...prev.label, en: value },
      key: isEditing
        ? prev.key
        : value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, ""),
    }));
  };

  const canSave =
    form.label.sw.trim().length > 0 &&
    form.label.en.trim().length > 0 &&
    form.key.trim().length > 0 &&
    form.permissions.length > 0;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
      className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3 w-full min-w-0"
    >
      {/* Key (slug) */}
      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-semibold text-secondary">
          {t("Key (slug)", "Key (slug)")} *
        </span>
        <input
          value={form.key}
          onChange={(e) =>
            setForm({ ...form, key: e.target.value })
          }
          placeholder="moderator"
          disabled={saving || isEditing}
          className="w-full border border-hairline rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-gold disabled:opacity-50 disabled:bg-page"
        />
        <span className="text-xs text-muted">
          {isEditing
            ? t(
                "Funguo haiwezi kubadilishwa baada ya kuunda.",
                "Key cannot be changed after creation.",
              )
            : t(
                "Herufi ndogo, namba, na underscore pekee. Inatengenezwa moja kwa moja kutoka jina la Kiingereza.",
                "Lowercase, numbers, and underscore only. Auto-generated from English name.",
              )}
        </span>
      </label>

      {/* Labels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold text-secondary">
            {t("Jina (SW)", "Name (SW)")} *
          </span>
          <input
            value={form.label.sw}
            onChange={(e) =>
              setForm({
                ...form,
                label: { ...form.label, sw: e.target.value },
              })
            }
            placeholder="Msimamizi wa Mali"
            disabled={saving}
            className="w-full border border-hairline rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold text-secondary">
            {t("Jina (EN)", "Name (EN)")} *
          </span>
          <input
            value={form.label.en}
            onChange={(e) => handleLabelEnChange(e.target.value)}
            placeholder="Moderator"
            disabled={saving}
            className="w-full border border-hairline rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold disabled:opacity-50"
          />
        </label>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold text-secondary">
            {t("Maelezo (SW)", "Description (SW)")}
          </span>
          <textarea
            value={form.description.sw}
            onChange={(e) =>
              setForm({
                ...form,
                description: { ...form.description, sw: e.target.value },
              })
            }
            rows={2}
            disabled={saving}
            className="w-full border border-hairline rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold resize-none disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold text-secondary">
            {t("Maelezo (EN)", "Description (EN)")}
          </span>
          <textarea
            value={form.description.en}
            onChange={(e) =>
              setForm({
                ...form,
                description: { ...form.description, en: e.target.value },
              })
            }
            rows={2}
            disabled={saving}
            className="w-full border border-hairline rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold resize-none disabled:opacity-50"
          />
        </label>
      </div>

      {/* Permissions */}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-secondary mb-2">
          {t("Ruhusa", "Permissions")} *{" "}
          <span className="text-muted font-normal">
            ({form.permissions.length}/{PERMISSIONS.length})
          </span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PERMISSIONS.map((perm) => {
            const isChecked = form.permissions.includes(perm.key);
            return (
              <label
                key={perm.key}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors min-w-0"
                style={{
                  borderColor: isChecked ? COLORS.green : COLORS.sandLine,
                  background: isChecked ? "rgba(47,109,79,0.05)" : "rgb(var(--c-card))",
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePermission(perm.key)}
                  disabled={saving}
                  className="w-4 h-4 rounded text-green focus:ring-green shrink-0"
                />
                <span className="text-xs text-primary truncate">
                  {perm.label?.[lang] || perm.label?.sw}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-hairline text-secondary disabled:opacity-50"
        >
          {t("Ghairi", "Cancel")}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!canSave || saving}
          style={{
            background: canSave && !saving ? COLORS.gold : COLORS.sandLine,
            color: canSave && !saving ? COLORS.night : "var(--text-muted)",
          }}
          className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {t("Hifadhi", "Save")}
        </button>
      </div>
    </div>
  );
}


// ============================================================
// AUDIT HELPERS (kwa staff activity)
// ============================================================
function logDetails(log, lang) {
  const sw = log.detailsSw ?? log.details_sw;
  const en = log.detailsEn ?? log.details_en;
  const raw = typeof log.details === "string" ? log.details : "";
  return lang === "en" ? en || raw || sw || "" : sw || raw || en || "";
}

// ============================================================
// PERMISSION MATRIX — grid ya role × permission
// ============================================================
function PermissionMatrix({ roles, lang, busy, onToggle }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (roles.length === 0) {
    return (
      <p className="text-xs text-muted text-center py-6">
        {t("Hakuna roles.", "No roles.")}
      </p>
    );
  }

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
      className="rounded-xl border w-full min-w-0 overflow-hidden"
    >
      <p className="text-xs text-secondary px-3 sm:px-4 pt-3">
        {t(
          "Bofya kisanduku kuwasha/kuzima ruhusa kwa role. Mabadiliko yanahifadhiwa mara moja.",
          "Click a cell to grant/revoke a permission for a role. Changes save immediately."
        )}
      </p>
      <div className="overflow-x-auto p-3 sm:p-4">
        <table className="text-xs border-collapse min-w-full">
          <thead>
            <tr>
              <th
                className="text-left font-semibold text-secondary pr-4 pb-2 sticky left-0 z-10"
                style={{ background: "rgb(var(--c-card))", minWidth: 160 }}
              >
                {t("Ruhusa", "Permission")}
              </th>
              {roles.map((role) => (
                <th
                  key={role.key}
                  className="font-semibold text-primary px-2 pb-2 text-center whitespace-nowrap"
                  style={{ minWidth: 90 }}
                >
                  <span className="block truncate max-w-[110px] mx-auto">
                    {role.label?.[lang] || role.label?.sw || role.key}
                  </span>
                  {role.isSystem && (
                    <Lock size={10} className="inline text-muted" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((perm) => (
              <tr key={perm.key} style={{ borderTop: `1px solid ${COLORS.sandLine}` }}>
                <td
                  className="py-2 pr-4 text-primary sticky left-0 z-10"
                  style={{ background: "rgb(var(--c-card))" }}
                >
                  {perm.label?.[lang] || perm.label?.sw || perm.key}
                </td>
                {roles.map((role) => {
                  const checked = role.permissions.includes(perm.key);
                  const key = `cell-${role.key}-${perm.key}`;
                  const isBusy = !!busy[key];
                  return (
                    <td key={role.key} className="text-center py-2">
                      {isBusy ? (
                        <Loader2 size={14} className="animate-spin inline text-muted" />
                      ) : (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(role, perm.key, !checked)}
                          disabled={Object.keys(busy).some((k) => k.startsWith(`cell-${role.key}-`))}
                          aria-label={`${role.key} · ${perm.key}`}
                          className="w-4 h-4 rounded text-green focus:ring-green cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr style={{ borderTop: `2px solid ${COLORS.sandLine}` }}>
              <td className="py-2 pr-4 font-semibold text-secondary sticky left-0 z-10" style={{ background: "rgb(var(--c-card))" }}>
                {t("Jumla", "Total")}
              </td>
              {roles.map((role) => (
                <td key={role.key} className="text-center py-2 font-semibold text-secondary">
                  {role.permissions.length}/{PERMISSIONS.length}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// STAFF CARD
// ============================================================
function StaffCard({
  staff,
  roles,
  lang,
  onEdit,
  onRemove,
  isBusy,
  activity = [],
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [showActivity, setShowActivity] = useState(false);
  const role = roles.find((r) => r.key === staff.roleKey);
  const roleLabel =
    role?.label?.[lang] || role?.label?.sw || staff.roleKey || "—";

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
      className="rounded-xl border p-3 sm:p-4 w-full min-w-0"
    >
      <div className="flex items-start gap-3">
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
        >
          <span className="text-sm font-bold text-primary">
            {staff.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary truncate">
            {staff.name || "—"}
          </p>
          <p className="text-xs text-secondary truncate">{staff.email || "—"}</p>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              style={{ background: `${COLORS.gold}20`, color: COLORS.goldText }}
              className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
            >
              {roleLabel}
            </span>
            <span
              style={{
                background: staff.active
                  ? "rgba(47,109,79,0.12)"
                  : "rgba(1,25,87,0.08)",
                color: staff.active ? COLORS.green : COLORS.night,
              }}
              className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
            >
              {staff.active ? t("Hai", "Active") : t("Imezimwa", "Inactive")}
            </span>
          </div>

          {staff.addedAt && (
            <p className="text-xs text-muted mt-1.5">
              {t("Aliongezwa", "Added")} {timeAgo(staff.addedAt, lang)}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowActivity((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary"
          >
            <History size={12} />
            {t("Shughuli", "Activity")} ({activity.length})
            {showActivity ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(staff)}
            disabled={isBusy}
            className="p-1.5 text-muted hover:text-gold-ink transition-colors disabled:opacity-50"
            aria-label={t("Hariri", "Edit")}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onRemove(staff)}
            disabled={isBusy}
            className="p-1.5 text-muted hover:text-rust transition-colors disabled:opacity-50"
            aria-label={t("Ondoa", "Remove")}
          >
            {isBusy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>

      {showActivity && (
        <div
          className="mt-3 pt-3 border-t"
          style={{ borderColor: COLORS.sandLine }}
        >
          {activity.length === 0 ? (
            <p className="text-xs text-muted italic">
              {t(
                "Hakuna shughuli zilizorekodiwa kwa mfanyakazi huyu.",
                "No recorded activity for this staff member."
              )}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {activity.slice(0, 8).map((log) => {
                const action = AUDIT_ACTIONS.find((a) => a.key === log.action);
                const details = logDetails(log, lang);
                return (
                  <li key={log.id} className="text-xs min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{ background: `${COLORS.night}0D`, color: COLORS.night }}
                        className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      >
                        {action?.label?.[lang] || action?.label?.sw || log.action}
                      </span>
                      <span className="text-xs text-muted whitespace-nowrap">
                        {timeAgo(log.at, lang)}
                      </span>
                    </div>
                    {details && (
                      <p className="text-xs text-secondary mt-0.5 line-clamp-2 break-words">
                        {details}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {activity.length > 8 && (
            <p className="text-xs text-muted mt-2">
              {t(
                `Inaonyesha 8 za hivi karibuni kati ya ${activity.length}. Tazama Audit Logs kwa zote.`,
                `Showing latest 8 of ${activity.length}. See Audit Logs for all.`
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// STAFF FORM
// ============================================================
function StaffForm({ initial, roles, lang, onSave, onCancel, saving }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const allUsers = useUsers();

  const [form, setForm] = useState({
    userId: initial?.userId || null,
    name: initial?.name || "",
    email: initial?.email || "",
    roleKey: initial?.roleKey || roles[0]?.key || "",
    active: initial?.active ?? true,
  });

  useEffect(() => {
    hydrateUsersFromApi();
  }, []);

  const handleUserChange = (uid) => {
    const numeric = Number(uid) || null;
    const picked = allUsers.find((u) => u.id === numeric);
    setForm((prev) => ({
      ...prev,
      userId: numeric,
      name: picked?.name || prev.name,
      email: picked?.email || prev.email,
    }));
  };

  const canSave = form.userId != null && !!form.roleKey;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
      className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3 w-full min-w-0"
    >
      {/* User picker */}
      <label className="flex flex-col gap-1 min-w-0 w-full">
        <span className="text-xs font-semibold text-secondary">
          {t("Chagua Mtumiaji", "Pick User")} *
        </span>
        <select
          value={form.userId ?? ""}
          onChange={(e) => handleUserChange(e.target.value)}
          disabled={saving}
          className="w-full border border-hairline rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold disabled:opacity-50"
        >
          <option value="">
            {t("-- Chagua mtumiaji --", "-- Pick a user --")}
          </option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email} (#{u.id})
            </option>
          ))}
        </select>
        {!form.userId && allUsers.length > 0 && (
          <span className="text-xs text-rust mt-1">
            {t("User ID inahitajika.", "User ID is required.")}
          </span>
        )}
        {allUsers.length === 0 && (
          <span className="text-xs text-muted mt-1">
            {t("Inapakia watumiaji...", "Loading users...")}
          </span>
        )}
      </label>

      {/* Name + Email (read-only if user picked) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold text-secondary">
            {t("Jina", "Name")}
          </span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Amina Rashid"
            disabled={saving}
            className="w-full border border-hairline rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold text-secondary">
            {t("Barua Pepe", "Email")}
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="amina@sokomkononi.co.tz"
            disabled={saving}
            className="w-full border border-hairline rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold disabled:opacity-50"
          />
        </label>
      </div>

      {/* Role */}
      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-semibold text-secondary">
          {t("Role", "Role")} *
        </span>
        <select
          value={form.roleKey}
          onChange={(e) => setForm({ ...form, roleKey: e.target.value })}
          disabled={saving}
          className="w-full border border-hairline rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold disabled:opacity-50"
        >
          {roles.length === 0 && (
            <option value="">
              {t("Hakuna wadhifa. Unda wadhifa kwanza.", "No roles. Create one first.")}
            </option>
          )}
          {roles.map((role) => (
            <option key={role.key} value={role.key}>
              {role.label?.[lang] || role.label?.sw || role.key}
            </option>
          ))}
        </select>
      </label>

      {/* Active */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
          disabled={saving}
          className="w-4 h-4 rounded text-gold shrink-0"
        />
        <span className="text-xs text-secondary">
          {t("Hai (anaweza kuingia)", "Active (can log in)")}
        </span>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-hairline text-secondary disabled:opacity-50"
        >
          {t("Ghairi", "Cancel")}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!canSave || saving}
          style={{
            background: canSave && !saving ? COLORS.gold : COLORS.sandLine,
            color: canSave && !saving ? COLORS.night : "var(--text-muted)",
          }}
          className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {t("Hifadhi", "Save")}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN SECTION
// ============================================================
export default function RBACSection() {
  const { lang } = useLanguage();
  const roles = useRoles();
  const staff = useSubAdminsWithRoles();
  const auditLogs = useAuditLogs();

  const [activeTab, setActiveTab] = useState("roles");
  const [addingRole, setAddingRole] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [addingStaff, setAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const clearBusy = (key) =>
    setBusy((b) => {
      const n = { ...b };
      delete n[key];
      return n;
    });

  // Shughuli za kila staff kutoka audit logs (logs 200 za hivi karibuni).
  // Inalinganisha kwa admin id kama ipo, vinginevyo kwa jina la msimamizi.
  const activityByStaff = React.useMemo(() => {
    const map = new Map();
    staff.forEach((s) => {
      const mine = (auditLogs || [])
        .filter((l) => {
          const lid = l.adminId ?? l.adminUserId ?? l.admin_id ?? null;
          if (lid != null && s.userId != null) return String(lid) === String(s.userId);
          return !!s.name && l.adminName === s.name;
        })
        .sort((a, b) => new Date(b.at) - new Date(a.at));
      map.set(s.id, mine);
    });
    return map;
  }, [staff, auditLogs]);

  // Hydrate roles + staff kwenye mount
  useEffect(() => {
    hydrateRolesFromApi();
  }, []);

  // ============================================================
  // ROLE HANDLERS
  // ============================================================
  const handleAddRole = async (form) => {
    if (busy.roleSave) return;

    // Validate BEFORE setting busy
    if (!form.key || !form.key.trim()) {
      setError(t("Funguo inahitajika.", "Key is required."));
      return;
    }
    if (!form.permissions || form.permissions.length === 0) {
      setError(t("Chagua ruhusa angalau moja.", "Select at least one permission."));
      return;
    }

    setBusy((b) => ({ ...b, roleSave: true }));
    setError("");

    const res = await addRoleAsync({
      key: form.key.trim(),
      label: form.label,
      description: form.description,
      permissions: form.permissions,
    });

    clearBusy("roleSave");
    if (res.ok) {
      setAddingRole(false);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuongeza role.", "Failed to add role."),
      );
    }
  };

  const handleUpdateRole = async (key, form) => {
    if (busy.roleSave) return;
    setBusy((b) => ({ ...b, roleSave: true }));
    setError("");
    const res = await updateRoleAsync(key, {
      label: form.label,
      description: form.description,
      permissions: form.permissions,
    });
    clearBusy("roleSave");
    if (res.ok) setEditingRole(null);
    else
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi role.", "Failed to save role."),
      );
  };

  const handleRemoveRole = async (role) => {
    if (
      !window.confirm(
        t(`Futa role "${role.key}"?`, `Delete role "${role.key}"?`),
      )
    )
      return;
    if (busy[`role-${role.key}`]) return;
    setBusy((b) => ({ ...b, [`role-${role.key}`]: true }));
    setError("");
    const res = await removeRoleAsync(role.key);
    clearBusy(`role-${role.key}`);
    if (!res.ok)
      setError(
        res.error?.message ||
          t("Imeshindwa kufuta role.", "Failed to delete role."),
      );
  };

  // Matrix: washa/zima ruhusa moja kwa role moja
  const handleToggleCell = async (role, permKey, grant) => {
    const next = grant
      ? [...role.permissions, permKey]
      : role.permissions.filter((p) => p !== permKey);

    // Role lazima iwe na ruhusa angalau moja (sawa na RoleForm)
    if (next.length === 0) {
      setError(
        t(
          "Role lazima iwe na ruhusa angalau moja.",
          "A role must keep at least one permission."
        )
      );
      return;
    }
    if (
      role.isSystem &&
      !window.confirm(
        t(
          `"${role.key}" ni role ya mfumo. Badilisha ruhusa zake?`,
          `"${role.key}" is a system role. Change its permissions?`
        )
      )
    )
      return;

    const busyKey = `cell-${role.key}-${permKey}`;
    if (busy[busyKey]) return;
    setBusy((b) => ({ ...b, [busyKey]: true }));
    setError("");
    const res = await updateRoleAsync(role.key, {
      label: role.label,
      description: role.description,
      permissions: next,
    });
    clearBusy(busyKey);
    if (!res.ok)
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi ruhusa.", "Failed to save permission.")
      );
  };

  // ============================================================
  // STAFF HANDLERS
  // ============================================================
  const handleAddStaff = async (form) => {
    if (busy.staffSave) return;

    // Validate BEFORE setting busy
    if (!form.userId) {
      setError(
        t("Chagua mtumiaji.", "Select a user."),
      );
      return;
    }

    const role = roles.find((r) => r.key === form.roleKey);
    const roleId = role?.id;
    if (typeof roleId !== "number") {
      setError(
        t(
          "Role haina backend id. Subiri hydration ikamilike.",
          "Role has no backend id. Wait for hydration to complete.",
        ),
      );
      return;
    }

    setBusy((b) => ({ ...b, staffSave: true }));
    setError("");

    const res = await addStaffAsync({
      userId: form.userId,
      roleId,
      active: form.active !== false,
    });

    clearBusy("staffSave");
    if (res.ok) setAddingStaff(false);
    else
      setError(
        res.error?.message ||
          t("Imeshindwa kuongeza mfanyakazi.", "Failed to add staff."),
      );
  };

  const handleUpdateStaff = async (id, form) => {
    if (busy.staffSave) return;

    const role = roles.find((r) => r.key === form.roleKey);
    const roleId = role?.id;
    if (typeof roleId !== "number") {
      setError(
        t("Role haina backend id.", "Role has no backend id."),
      );
      return;
    }

    setBusy((b) => ({ ...b, staffSave: true }));
    setError("");

    const res = await updateStaffAsync(id, {
      roleId,
      active: form.active,
    });

    clearBusy("staffSave");
    if (res.ok) setEditingStaff(null);
    else
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi mfanyakazi.", "Failed to save staff."),
      );
  };

  const handleRemoveStaff = async (s) => {
    if (
      !window.confirm(
        t(`Ondoa ${s.name}?`, `Remove ${s.name}?`),
      )
    )
      return;
    if (busy[`staff-${s.id}`]) return;
    setBusy((b) => ({ ...b, [`staff-${s.id}`]: true }));
    setError("");
    const res = await removeStaffAsync(s.id);
    clearBusy(`staff-${s.id}`);
    if (!res.ok)
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa mfanyakazi.", "Failed to remove staff."),
      );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Wadhifa & Ruhusa", "Roles & Permissions")}
        subtitle={t(
          "Simamia nyadhifa za wafanyakazi na ruhusa zao kwenye mfumo.",
          "Manage staff roles and their permissions in the system.",
        )}
      />

      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-5 overflow-x-auto pb-2 w-full min-w-0">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setError("");
              }}
              style={{
                background: isActive ? COLORS.night : "rgb(var(--c-card))",
                color: isActive ? COLORS.sand : "var(--text-primary)",
                borderColor: COLORS.sandLine,
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border whitespace-nowrap shrink-0"
            >
              <Icon size={14} /> {label?.[lang] || label?.sw}
            </button>
          );
        })}
      </div>

      {/* ==================== ROLES TAB ==================== */}
      {activeTab === "roles" && (
        <div className="flex flex-col gap-3 w-full min-w-0">
          <button
            onClick={() => {
              setAddingRole(true);
              setEditingRole(null);
              setError("");
            }}
            disabled={addingRole || !!editingRole}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> {t("Role Mpya", "New Role")}
          </button>

          {addingRole && (
            <RoleForm
              initial={{}}
              lang={lang}
              saving={!!busy.roleSave}
              onSave={handleAddRole}
              onCancel={() => {
                setAddingRole(false);
                setError("");
              }}
            />
          )}
          {editingRole && (
            <RoleForm
              initial={editingRole}
              lang={lang}
              saving={!!busy.roleSave}
              onSave={(form) => handleUpdateRole(editingRole.key, form)}
              onCancel={() => {
                setEditingRole(null);
                setError("");
              }}
            />
          )}

          {roles.length === 0 && !addingRole ? (
            <div
              style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
              className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
            >
              <ShieldCheck size={40} className="mx-auto text-muted mb-3" />
              <h3 className="font-semibold text-primary mb-1">
                {t("Hakuna roles", "No roles")}
              </h3>
              <p className="text-sm text-secondary">
                {t(
                  "Roles zilizoongezwa zitaonekana hapa.",
                  "Added roles will appear here.",
                )}
              </p>
            </div>
          ) : (
            roles.map((role) => (
              <RoleCard
                key={role.key}
                role={role}
                lang={lang}
                isBusy={!!busy[`role-${role.key}`]}
                onEdit={(r) => {
                  setEditingRole(r);
                  setAddingRole(false);
                  setError("");
                }}
                onDelete={handleRemoveRole}
              />
            ))
          )}
        </div>
      )}

      {/* ==================== STAFF TAB ==================== */}
      {activeTab === "staff" && (
        <div className="flex flex-col gap-3 w-full min-w-0">
          <button
            onClick={() => {
              setAddingStaff(true);
              setEditingStaff(null);
              setError("");
            }}
            disabled={addingStaff || !!editingStaff}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> {t("Mfanyakazi Mpya", "New Staff")}
          </button>

          {addingStaff && (
            <StaffForm
              initial={{}}
              roles={roles}
              lang={lang}
              saving={!!busy.staffSave}
              onSave={handleAddStaff}
              onCancel={() => {
                setAddingStaff(false);
                setError("");
              }}
            />
          )}
          {editingStaff && (
            <StaffForm
              initial={editingStaff}
              roles={roles}
              lang={lang}
              saving={!!busy.staffSave}
              onSave={(form) => handleUpdateStaff(editingStaff.id, form)}
              onCancel={() => {
                setEditingStaff(null);
                setError("");
              }}
            />
          )}

          {staff.length === 0 && !addingStaff ? (
            <div
              style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
              className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
            >
              <UserCog size={40} className="mx-auto text-muted mb-3" />
              <h3 className="font-semibold text-primary mb-1">
                {t("Hakuna wafanyakazi", "No staff members")}
              </h3>
              <p className="text-sm text-secondary">
                {t(
                  "Wafanyakazi walioongezwa wataonekana hapa.",
                  "Added staff members will appear here.",
                )}
              </p>
            </div>
          ) : (
            staff.map((member) => (
              <StaffCard
                key={member.id}
                staff={member}
                roles={roles}
                lang={lang}
                isBusy={!!busy[`staff-${member.id}`]}
                activity={activityByStaff.get(member.id) || []}
                onEdit={(s) => {
                  setEditingStaff(s);
                  setAddingStaff(false);
                  setError("");
                }}
                onRemove={handleRemoveStaff}
              />
            ))
          )}
        </div>
      )}

      {/* ==================== MATRIX TAB ==================== */}
      {activeTab === "matrix" && (
        <PermissionMatrix
          roles={roles}
          lang={lang}
          busy={busy}
          onToggle={handleToggleCell}
        />
      )}
    </div>
  );
}