// ============================================================
// RBACSection.jsx
// Admin — Roles & Permissions (RBAC).
// Bilingual + mobile-responsive.
// ============================================================

import React, { useState } from "react";
import {
  ShieldCheck,
  Users,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Check,
  Lock,
  UserCog,
  KeyRound,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useRoles,
  useSubAdminsWithRoles,
  addRole,
  updateRole,
  removeRole,
  addSubAdmin,
  updateSubAdmin,
  removeSubAdmin,
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
function RoleCard({ role, lang, onEdit, onDelete }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const count = role.permissions.length;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-4"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-gray-800">
              {role.label?.[lang] || role.label?.sw || role.key}
            </p>
            {role.isSystem && (
              <span
                style={{
                  background: `${COLORS.night}0D`,
                  color: COLORS.night,
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              >
                <Lock size={9} />
                {t("Mfumo", "System")}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {role.description?.[lang] || role.description?.sw}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(role)}
            className="p-1.5 text-gray-400 hover:text-[#E8A33D] transition-colors"
            aria-label={t("Hariri", "Edit")}
          >
            <Pencil size={14} />
          </button>
          {!role.isSystem && (
            <button
              onClick={() => onDelete(role)}
              className="p-1.5 text-gray-400 hover:text-[#C1502E] transition-colors"
              aria-label={t("Futa", "Delete")}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">
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
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
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
function RoleForm({ initial, lang, onSave, onCancel }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const isEditing = Boolean(initial?.key && initial?.isSystem !== undefined);

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
      className="rounded-xl border p-4 flex flex-col gap-3"
    >
      {/* Label bilingual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">
            {t("Jina (SW)", "Name (SW)")}
          </span>
          <input
            value={form.label.sw}
            onChange={(e) =>
              setForm({ ...form, label: { ...form.label, sw: e.target.value } })
            }
            placeholder="Msimamizi wa Mali"
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">
            {t("Jina (EN)", "Name (EN)")}
          </span>
          <input
            value={form.label.en}
            onChange={(e) =>
              setForm({ ...form, label: { ...form.label, en: e.target.value } })
            }
            placeholder="Moderator"
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D]"
          />
        </label>
      </div>

      {/* Description bilingual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">
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
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] resize-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">
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
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] resize-none"
          />
        </label>
      </div>

      {/* Permissions */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 mb-2">
          {t("Ruhusa", "Permissions")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PERMISSIONS.map((perm) => {
            const isChecked = form.permissions.includes(perm.key);
            return (
              <label
                key={perm.key}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors"
                style={{
                  borderColor: isChecked ? COLORS.green : COLORS.sandLine,
                  background: isChecked ? "rgba(47,109,79,0.05)" : "white",
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePermission(perm.key)}
                  className="w-4 h-4 rounded text-[#2F6D4F] focus:ring-[#2F6D4F]"
                />
                <span className="text-xs text-gray-700 truncate">
                  {perm.label?.[lang] || perm.label?.sw}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600"
        >
          {t("Ghairi", "Cancel")}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!canSave}
          style={{
            background: canSave ? COLORS.gold : COLORS.sandLine,
            color: canSave ? COLORS.night : "rgba(16,26,46,0.4)",
          }}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
        >
          <Save size={13} />
          {t("Hifadhi", "Save")}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STAFF CARD
// ============================================================
function StaffCard({ staff, roles, lang, onEdit, onRemove }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const role = roles.find((r) => r.key === staff.roleKey);

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-4"
    >
      <div className="flex items-start gap-3">
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        >
          <span className="text-sm font-bold text-[#101A2E]">
            {staff.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {staff.name}
          </p>
          <p className="text-xs text-gray-500 truncate">{staff.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              style={{ background: `${COLORS.gold}20`, color: "#8A5A16" }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
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
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            >
              {staff.active
                ? t("Hai", "Active")
                : t("Imezimwa", "Inactive")}
            </span>
          </div>
          {staff.addedAt && (
            <p className="text-[10px] text-gray-400 mt-1.5">
              {t("Aliongezwa", "Added")} {timeAgo(staff.addedAt, lang)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(staff)}
            className="p-1.5 text-gray-400 hover:text-[#E8A33D] transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onRemove(staff)}
            className="p-1.5 text-gray-400 hover:text-[#C1502E] transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAFF FORM
// ============================================================
function StaffForm({ initial, roles, lang, onSave, onCancel }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [form, setForm] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    roleKey: initial?.roleKey || roles[0]?.key || "",
    active: initial?.active ?? true,
  });

  const canSave =
    form.name.trim() && form.email.trim() && form.roleKey;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-4 flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">
            {t("Jina", "Name")}
          </span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Amina Rashid"
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">
            {t("Barua Pepe", "Email")}
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="amina@sokomkononi.co.tz"
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D]"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-gray-500">
          {t("Role", "Role")}
        </span>
        <select
          value={form.roleKey}
          onChange={(e) => setForm({ ...form, roleKey: e.target.value })}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D]"
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
          className="w-4 h-4 rounded text-[#E8A33D]"
        />
        <span className="text-xs text-gray-600">
          {t("Hai (anaweza kuingia)", "Active (can log in)")}
        </span>
      </label>

      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600"
        >
          {t("Ghairi", "Cancel")}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!canSave}
          style={{
            background: canSave ? COLORS.gold : COLORS.sandLine,
            color: canSave ? COLORS.night : "rgba(16,26,46,0.4)",
          }}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
        >
          <Save size={13} />
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

  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <>
      <SectionHeader
        title={t("Roles & Ruhusa", "Roles & Permissions")}
        subtitle={t(
          "Simamia roles za wafanyakazi na ruhusa zao kwenye mfumo.",
          "Manage staff roles and their permissions in the system."
        )}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: isActive ? COLORS.night : "white",
                color: isActive ? COLORS.sand : COLORS.night,
                borderColor: COLORS.sandLine,
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border whitespace-nowrap"
            >
              <Icon size={13} />
              {label?.[lang] || label?.sw}
            </button>
          );
        })}
      </div>

      {/* ROLES TAB */}
      {activeTab === "roles" && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setAddingRole(true);
              setEditingRole(null);
            }}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start"
          >
            <Plus size={13} />
            {t("Role Mpya", "New Role")}
          </button>

          {(addingRole || editingRole) && (
            <RoleForm
              initial={editingRole || {}}
              lang={lang}
              onSave={(form) => {
                if (editingRole) {
                  updateRole(editingRole.key, form);
                  setEditingRole(null);
                } else {
                  const key = form.label.en
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^a-z0-9_]/g, "");
                  addRole({ ...form, key });
                  setAddingRole(false);
                }
              }}
              onCancel={() => {
                setAddingRole(false);
                setEditingRole(null);
              }}
            />
          )}

          {roles.map((role) => (
            <RoleCard
              key={role.key}
              role={role}
              lang={lang}
              onEdit={(r) => {
                setEditingRole(r);
                setAddingRole(false);
              }}
              onDelete={(r) => {
                if (
                  window.confirm(
                    t(`Futa role "${r.key}"?`, `Delete role "${r.key}"?`)
                  )
                ) {
                  try {
                    removeRole(r.key);
                  } catch (e) {
                    alert(e.message);
                  }
                }
              }}
            />
          ))}
        </div>
      )}

      {/* STAFF TAB */}
      {activeTab === "staff" && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setAddingStaff(true);
              setEditingStaff(null);
            }}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start"
          >
            <Plus size={13} />
            {t("Mfanyakazi Mpya", "New Staff")}
          </button>

          {(addingStaff || editingStaff) && (
            <StaffForm
              initial={editingStaff || {}}
              roles={roles}
              lang={lang}
              onSave={(form) => {
                if (editingStaff) {
                  updateSubAdmin(editingStaff.id, form);
                  setEditingStaff(null);
                } else {
                  addSubAdmin(form);
                  setAddingStaff(false);
                }
              }}
              onCancel={() => {
                setAddingStaff(false);
                setEditingStaff(null);
              }}
            />
          )}

          {staff.length === 0 && !addingStaff ? (
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-2xl border-2 border-dashed p-10 text-center"
            >
              <UserCog size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">
                {t("Hakuna wafanyakazi", "No staff members")}
              </h3>
              <p className="text-sm text-gray-500">
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
                onEdit={(s) => {
                  setEditingStaff(s);
                  setAddingStaff(false);
                }}
                onRemove={(s) => {
                  if (
                    window.confirm(
                      t(
                        `Ondoa ${s.name}?`,
                        `Remove ${s.name}?`
                      )
                    )
                  ) {
                    removeSubAdmin(s.id);
                  }
                }}
              />
            ))
          )}
        </div>
      )}
    </>
  );
}
