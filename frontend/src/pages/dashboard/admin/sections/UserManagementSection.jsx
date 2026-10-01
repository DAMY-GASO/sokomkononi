// ============================================================
// UserManagementSection.jsx
// Usimamizi wa watumiaji — table (desktop) + card list (mobile).
// Bilingual + Async actions na rollback + loading state.
// + Futa Permanently (hard delete) kwa admin.
// ============================================================

import React, { useState } from "react";
import { Search, RotateCcw, Ban, Loader2, Trash2 } from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import UserDrawer from "../shared/UserDrawer.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useUsers,
  toggleUserStatusAsync,
  permanentDeleteUserAsync,
} from "../../../../config/usersStore.js";
import { useListings } from "../../../../config/listingsStore.js";
import { useDeals } from "../../../../config/dealsStore.js";

export default function UserManagementSection() {
  const { lang } = useLanguage();
  const users = useUsers();
  const listings = useListings();
  const deals = useDeals();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [busy, setBusy] = useState({}); // { [userId]: "toggle" | "delete" }
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const filtered = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      u.role?.toLowerCase() === roleFilter.toLowerCase();
    return matchesQuery && matchesRole;
  });

  // ============================================================
  // HANDLE TOGGLE — suspend/activate
  // ============================================================
  const handleToggle = async (userId) => {
    if (busy[userId]) return;

    setBusy((b) => ({ ...b, [userId]: "toggle" }));
    setError("");

    const res = await toggleUserStatusAsync(userId);

    setBusy((b) => {
      const next = { ...b };
      delete next[userId];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t(
            "Imeshindwa kubadilisha hali ya mtumiaji.",
            "Failed to change user status."
          )
      );
    }
  };

  // ============================================================
  // HANDLE PERMANENT DELETE — double confirmation
  // ============================================================
  const handleDelete = async (userId, userName) => {
    if (busy[userId]) return;

    // First confirmation
    const confirmed = window.confirm(
      lang === "sw"
        ? `Futa mtumiaji "${userName}" KABISA?\n\nHatua hii haiwezi kurudishwa. Data yote itaondolewa.`
        : `Permanently delete user "${userName}"?\n\nThis cannot be undone. All data will be removed.`
    );
    if (!confirmed) return;

    // Second confirmation
    const doubleConfirm = window.confirm(
      lang === "sw"
        ? "Una uhakika KABISA? Bonyeza OK kuthibitisha."
        : "Are you ABSOLUTELY sure? Click OK to confirm."
    );
    if (!doubleConfirm) return;

    setBusy((b) => ({ ...b, [userId]: "delete" }));
    setError("");

    const res = await permanentDeleteUserAsync(userId);

    setBusy((b) => {
      const next = { ...b };
      delete next[userId];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kumfuta mtumiaji.", "Failed to delete user.")
      );
    } else {
      // Kama drawer ipo wazi kwa user huyu, ifunge
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    }
  };

  // ============================================================
  // ACTION BUTTONS — inatumika table na card
  // ============================================================
  const ActionButtons = ({ user, fullWidth = false }) => {
    const isSuspended = user.status === "suspended";
    const isBusy = !!busy[user.id];
    const busyAction = busy[user.id];

    return (
      <div
        className={`flex items-center gap-1.5 ${
          fullWidth ? "w-full" : "justify-end"
        }`}
      >
        {/* Suspend / Activate */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle(user.id);
          }}
          disabled={isBusy}
          style={{
            color: isSuspended ? COLORS.green : COLORS.rust,
            borderColor: isSuspended
              ? `${COLORS.green}33`
              : `${COLORS.rust}33`,
          }}
          className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            fullWidth ? "flex-1" : ""
          }`}
        >
          {busyAction === "toggle" ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              {t("Inafanya...", "Working...")}
            </>
          ) : isSuspended ? (
            <>
              <RotateCcw size={13} />
              {t("Washa Tena", "Activate")}
            </>
          ) : (
            <>
              <Ban size={13} />
              {t("Simamisha", "Suspend")}
            </>
          )}
        </button>

        {/* Futa Permanently */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(user.id, user.name);
          }}
          disabled={isBusy || user.isStaff}
          title={
            user.isStaff
              ? t("Hauwezi kumfuta admin", "Cannot delete admin")
              : t("Futa Kabisa", "Delete Permanently")
          }
          style={{
            color: COLORS.rust,
            borderColor: `${COLORS.rust}33`,
          }}
          className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            fullWidth ? "flex-1" : ""
          }`}
        >
          {busyAction === "delete" ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              {fullWidth && t("Inafuta...", "Deleting...")}
            </>
          ) : (
            <>
              <Trash2 size={13} />
              {fullWidth && t("Futa", "Delete")}
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      <SectionHeader
        title={t("Usimamizi wa Watumiaji", "User Management")}
        subtitle={t(
          "Dhibiti akaunti za watumiaji — simamisha, washa, au futa",
          "Manage user accounts — suspend, activate, or delete"
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

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={16} className="text-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "Tafuta kwa jina au email...",
              "Search by name or email..."
            )}
            className="outline-none text-sm flex-1 min-w-0"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary"
        >
          <option value="all">{t("Zote", "All")}</option>
          <option value="Buyer">{t("Wanunuzi", "Buyers")}</option>
          <option value="Seller">{t("Wauzaji", "Sellers")}</option>
        </select>
      </div>

      {/* ============================================================
          DESKTOP — TABLE
          ============================================================ */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Jina", "Name")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  Email
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  Role
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  Status
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Alijiunga", "Joined")}
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-secondary uppercase">
                  {t("Vitendo", "Actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(u)}
                >
                  <td className="px-5 py-3 text-sm font-medium text-primary">
                    {u.name}
                  </td>
                  <td className="px-5 py-3 text-sm text-secondary">
                    {u.email}
                  </td>
                  <td className="px-5 py-3 text-sm text-secondary">{u.role}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={u.status} lang={lang} />
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">{u.joined}</td>
                  <td className="px-5 py-3 text-right">
                    <ActionButtons user={u} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-muted"
                  >
                    {t("Hakuna matokeo", "No results")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================
          MOBILE — CARD LIST
          ============================================================ */}
      <div className="sm:hidden flex flex-col gap-3">
        {filtered.map((u) => (
          <div
            key={u.id}
            onClick={() => setSelectedUser(u)}
            className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary truncate">
                  {u.name}
                </p>
                <p className="text-xs text-secondary truncate mt-0.5">
                  {u.email}
                </p>
              </div>
              <StatusBadge status={u.status} lang={lang} />
            </div>

            <div className="flex items-center gap-3 text-xs text-secondary mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <span className="text-muted">Role:</span>
                <span className="font-medium text-primary">{u.role}</span>
              </span>
              <span className="text-muted">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="text-muted">
                  {t("Alijiunga:", "Joined:")}
                </span>
                <span className="font-medium text-primary">{u.joined}</span>
              </span>
            </div>

            <ActionButtons user={u} fullWidth />
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-muted">
            {t("Hakuna matokeo", "No results")}
          </div>
        )}
      </div>

      {/* DRAWER */}
      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          listings={listings}
          deals={deals}
          onClose={() => setSelectedUser(null)}
          lang={lang}
        />
      )}
    </>
  );
}
