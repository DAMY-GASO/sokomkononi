// ============================================================
// RBACSection.jsx
// Admin — Roles & Permissions (RBAC).
// Bilingual + mobile-responsive + Async actions na rollback.
// ============================================================

import React, { useState } from "react";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Pencil,
  Save,
  Lock,
  UserCog,
  Loader2,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: tumia async variants
import {
  useRoles,
  useSubAdminsWithRoles,
  addRoleAsync,
  updateRoleAsync,
  removeRoleAsync,
  addStaffAsync,
  updateStaffAsync,
  removeStaffAsync,
  PERMISSIONS,
} from "../../../../config/rolesStore.js";

// ============================================================
// TABS
// ============================================================
const TABS = [
  { key: "roles", label: { sw: "Roles", en: "Roles" }, icon: ShieldCheck },
  { key: "staff", label: { sw: "Wafanyakazi", en: "Staff" }, icon: UserCog },
];

// ============================================================
// ROLE CARD
// ============================================================
function RoleCard({ role, lang, onEdit, onDelete, isBusy }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const count = role.permissions.length;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
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
                style={{
                  background: `${COLORS.night}0D`,
                  color: COLORS.night,
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
              >
                <Lock size={9} />
                {t("Mfumo", "System")}
              </span>
            )}
          </div>
          <p className="text-xs text-secondary leading-relaxed line-clamp-2">
            {role.description?.[lang] || role.description?.sw}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(role)}
            disabled={isBusy}
            className="p-1.5 text-muted hover:text-[#E8A33D] transition-colors disabled:opacity-50"
            aria-label={t("Hariri", "Edit")}
          >
            <Pencil size={14} />
          </button>
          {!role.isSystem && (
            <button
              onClick={() => onDelete(role)}
              disabled={isBusy}
              className="p-1.5 text-muted hover:text-[#C1502E] transition-colors disabled:opacity-50"
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
        <p className="text-[10px] font-semibold text-muted uppercase mb-1.5">
          {t(`Ruhusa (${count})`, `Permissions (${count})`)}
        </p>
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
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
              >
                {permission?.label?.[lang] || permission?.label?.sw || perm}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROLE FORM
// ============================================================
function RoleForm({ initial, lang, onSave, onCancel, saving }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [form, setForm] = useState({
    key: initial?.key || "",
    label: initial?.label || { sw: "", en: "" },
    description: initial?.description || { sw: "", en: "" },
    permissions: initial?.permissions || [],
  });

  const togglePermission = (perm) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const canSave =
    form.label.sw.trim() && form.label.en.trim() && form.permissions.length > 0;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3 w-full min-w-0"
    >
      {/* Label bilingual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Jina (SW)", "Name (SW)")}
          </span>
          <input
            value={form.label.sw}
            onChange={(e) =>
              setForm({ ...form, label: { ...form.label, sw: e.target.value } })
            }
            placeholder="Msimamizi wa Mali"
            disabled={saving}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Jina (EN)", "Name (EN)")}
          </span>
          <input
            value={form.label.en}
            onChange={(e) =>
              setForm({ ...form, label: { ...form.label, en: e.target.value } })
            }
            placeholder="Moderator"
            disabled={saving}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </label>
      </div>

      {/* Description bilingual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-secondary">
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
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] resize-none disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-secondary">
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
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] resize-none disabled:opacity-50"
          />
        </label>
      </div>

      {/* Permissions */}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-secondary mb-2">
          {t("Ruhusa", "Permissions")}
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
                  background: isChecked ? "rgba(47,109,79,0.05)" : "white",
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePermission(perm.key)}
                  disabled={saving}
                  className="w-4 h-4 rounded text-[#2F6D4F] focus:ring-[#2F6D4F] shrink-0"
                />
                <span className="text-xs text-primary truncate">
                  {perm.label?.[lang] || perm.label?.sw}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-secondary disabled:opacity-50"
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
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          {t("Hifadhi", "Save")}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STAFF CARD
// ============================================================
function StaffCard({ staff, roles, lang, onEdit, onRemove, isBusy }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const role = roles.find((r) => r.key === staff.roleKey);

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 w-full min-w-0"
    >
      <div className="flex items-start gap-3">
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
        >
          <span className="text-sm font-bold text-[#101A2E]">
            {staff.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary truncate">
            {staff.name}
          </p>
          <p className="text-xs text-secondary truncate">{staff.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              style={{ background: `${COLORS.gold}20`, color: "#8A5A16" }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
            >
              {role?.label?.[lang] || role?.label?.sw || staff.roleKey}
            </span>
            <span
              style={{
                background: staff.active
                  ? "rgba(47,109,79,0.12)"
                  : "rgba(16,26,46,0.08)",
                color: staff.active ? COLORS.green : COLORS.night,
              }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
            >
              {staff.active ? t("Hai", "Active") : t("Imezimwa", "Inactive")}
            </span>
          </div>
          {staff.addedAt && (
            <p className="text-[10px] text-muted mt-1.5">
              {t("Aliongezwa", "Added")} {timeAgo(staff.addedAt, lang)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(staff)}
            disabled={isBusy}
            className="p-1.5 text-muted hover:text-[#E8A33D] transition-colors disabled:opacity-50"
            aria-label={t("Hariri", "Edit")}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onRemove(staff)}
            disabled={isBusy}
            className="p-1.5 text-muted hover:text-[#C1502E] transition-colors disabled:opacity-50"
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
    </div>
  );
}

// ============================================================
// STAFF FORM
// ============================================================
function StaffForm({ initial, roles, lang, onSave, onCancel, saving }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [form, setForm] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    roleKey: initial?.roleKey || roles[0]?.key || "",
    active: initial?.active ?? true,
    userId: initial?.userId || null,
  });

  const canSave = form.name.trim() && form.email.trim() && form.roleKey;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3 w-full min-w-0"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Jina", "Name")}
          </span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Amina Rashid"
            disabled={saving}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Barua Pepe", "Email")}
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="amina@sokomkononi.co.tz"
            disabled={saving}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-[11px] font-semibold text-secondary">
          {t("Role", "Role")}
        </span>
        <select
          value={form.roleKey}
          onChange={(e) => setForm({ ...form, roleKey: e.target.value })}
          disabled={saving}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
        >
          {roles.map((role) => (
            <option key={role.key} value={role.key}>
              {role.label?.[lang] || role.label?.sw}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
          disabled={saving}
          className="w-4 h-4 rounded text-[#E8A33D] shrink-0"
        />
        <span className="text-xs text-secondary">
          {t("Hai (anaweza kuingia)", "Active (can log in)")}
        </span>
      </label>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-secondary disabled:opacity-50"
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
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
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
  const [activeTab, setActiveTab] = useState("roles");
  const [addingRole, setAddingRole] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [addingStaff, setAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  // ⬇️ MPYA: busy + error state
  const [busy, setBusy] = useState({}); // { [key]: true }
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // ROLE HANDLERS
  // ============================================================
  const handleAddRole = async (form) => {
    if (busy.roleSave) return;

    setBusy((b) => ({ ...b, roleSave: true }));
    setError("");

    const key = form.label.en
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const res = await addRoleAsync({ ...form, key });
    setBusy((b) => {
      const next = { ...b };
      delete next.roleSave;
      return next;
    });

    if (res.ok) {
      setAddingRole(false);
    } else {
      setError(
        res.error?.message || t("Imeshindwa kuongeza role.", "Failed to add role.")
      );
    }
  };

  const handleUpdateRole = async (key, form) => {
    if (busy.roleSave) return;

    setBusy((b) => ({ ...b, roleSave: true }));
    setError("");

    const res = await updateRoleAsync(key, form);
    setBusy((b) => {
      const next = { ...b };
      delete next.roleSave;
      return next;
    });

    if (res.ok) {
      setEditingRole(null);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi role.", "Failed to save role.")
      );
    }
  };

  const handleRemoveRole = async (role) => {
    if (
      !window.confirm(
        t(`Futa role "${role.key}"?`, `Delete role "${role.key}"?`)
      )
    )
      return;

    if (busy[`role-${role.key}`]) return;

    setBusy((b) => ({ ...b, [`role-${role.key}`]: true }));
    setError("");

    const res = await removeRoleAsync(role.key);
    setBusy((b) => {
      const next = { ...b };
      delete next[`role-${role.key}`];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message || t("Imeshindwa kufuta role.", "Failed to delete role.")
      );
    }
  };

  // ============================================================
  // STAFF HANDLERS
  // ============================================================
  const handleAddStaff = async (form) => {
    if (busy.staffSave) return;

    if (!form.userId) {
      setError(
        t(
          "userId inahitajika. Chagua mtumiaji aliye na akaunti.",
          "userId required. Select a user with an existing account."
        )
      );
      return;
    }

    setBusy((b) => ({ ...b, staffSave: true }));
    setError("");

    const role = roles.find((r) => r.key === form.roleKey);
    const roleId = role?.id;
    if (typeof roleId !== "number") {
      setError(t("Role haina backend id. Hydrate kwanza.", "Role has no backend id. Hydrate first."));
      return;
    }
    const res = await addStaffAsync({
      userId: form.userId,
      roleId,
      active: form.active !== false,
    });
    setBusy((b) => {
      const next = { ...b };
      delete next.staffSave;
      return next;
    });

    if (res.ok) {
      setAddingStaff(false);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuongeza mfanyakazi.", "Failed to add staff.")
      );
    }
  };

  const handleUpdateStaff = async (id, form) => {
    if (busy.staffSave) return;

    setBusy((b) => ({ ...b, staffSave: true }));
    setError("");

    const role = roles.find((r) => r.key === form.roleKey);
    const res = await updateStaffAsync(id, {
      roleId: role?.id,
      active: form.active,
    });
    setBusy((b) => {
      const next = { ...b };
      delete next.staffSave;
      return next;
    });

    if (res.ok) {
      setEditingStaff(null);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi mfanyakazi.", "Failed to save staff.")
      );
    }
  };

  const handleRemoveStaff = async (s) => {
    if (!window.confirm(t(`Ondoa ${s.name}?`, `Remove ${s.name}?`))) return;

    if (busy[`staff-${s.id}`]) return;

    setBusy((b) => ({ ...b, [`staff-${s.id}`]: true }));
    setError("");

    const res = await removeStaffAsync(s.id);
    setBusy((b) => {
      const next = { ...b };
      delete next[`staff-${s.id}`];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa mfanyakazi.", "Failed to remove staff.")
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Roles & Ruhusa", "Roles & Permissions")}
        subtitle={t(
          "Simamia roles za wafanyakazi na ruhusa zao kwenye mfumo.",
          "Manage staff roles and their permissions in the system."
        )}
      />

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
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
              onClick={() => setActiveTab(key)}
              style={{
                background: isActive ? COLORS.night : "white",
                color: isActive ? COLORS.sand : "var(--text-primary)",
                borderColor: COLORS.sandLine,
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border whitespace-nowrap shrink-0"
            >
              <Icon size={13} />
              {label?.[lang] || label?.sw}
            </button>
          );
        })}
      </div>

      {/* ROLES TAB */}
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
            <Plus size={13} />
            {t("Role Mpya", "New Role")}
          </button>

          {addingRole && (
            <RoleForm
              initial={{}}
              lang={lang}
              saving={!!busy.roleSave}
              onSave={handleAddRole}
              onCancel={() => setAddingRole(false)}
            />
          )}

          {editingRole && (
            <RoleForm
              initial={editingRole}
              lang={lang}
              saving={!!busy.roleSave}
              onSave={(form) => handleUpdateRole(editingRole.key, form)}
              onCancel={() => setEditingRole(null)}
            />
          )}

          {roles.map((role) => (
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
          ))}
        </div>
      )}

      {/* STAFF TAB */}
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
            <Plus size={13} />
            {t("Mfanyakazi Mpya", "New Staff")}
          </button>

          {addingStaff && (
            <StaffForm
              initial={{}}
              roles={roles}
              lang={lang}
              saving={!!busy.staffSave}
              onSave={handleAddStaff}
              onCancel={() => setAddingStaff(false)}
            />
          )}

          {editingStaff && (
            <StaffForm
              initial={editingStaff}
              roles={roles}
              lang={lang}
              saving={!!busy.staffSave}
              onSave={(form) => handleUpdateStaff(editingStaff.id, form)}
              onCancel={() => setEditingStaff(null)}
            />
          )}

          {staff.length === 0 && !addingStaff ? (
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
            >
              <UserCog size={40} className="mx-auto text-muted mb-3" />
              <h3 className="font-semibold text-primary mb-1">
                {t("Hakuna wafanyakazi", "No staff members")}
              </h3>
              <p className="text-sm text-secondary">
                {t(
                  "Wafanyakazi walioongezwa wataonekana hapa.",
                  "Added staff members will appear here."
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
    </div>
  );
}
