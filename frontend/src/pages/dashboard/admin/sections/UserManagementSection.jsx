// ============================================================
// UserManagementSection.jsx
// Usimamizi wa watumiaji — table (desktop) + card list (mobile).
// Bilingual + Async actions na rollback + loading state.
// + Status filter, Verified filter, Pagination
// + UserDrawer inachukua data yake yenyewe (/full/ endpoint)
// + Event listeners: refresh kwenye users-updated/verifications-updated
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  RotateCcw,
  Ban,
  Loader2,
  Trash2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import UserDrawer from "../shared/UserDrawer.jsx";
import DeleteUserModal from "../shared/DeleteUserModal.jsx";
import SuspendUserModal from "../shared/SuspendUserModal.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useUsers,
  hydrateUsersFromApi,
  activateUserAsync,
  suspendUserAsync,
  verifyUserAsync,
  permanentDeleteUserAsync,
} from "../../../../config/usersStore.js";

// ============================================================
// ROLE BADGE
// ============================================================
const ROLE_STYLES = {
  Admin: {
    label: { sw: "Admin", en: "Admin" },
    bg: "rgba(16,26,46,0.10)",
    fg: COLORS.night,
    border: "rgba(16,26,46,0.25)",
  },
  Both: {
    label: { sw: "Wote Wawili", en: "Both" },
    bg: "rgba(124,58,237,0.12)",
    fg: "#7C3AED",
    border: "rgba(124,58,237,0.3)",
  },
  Seller: {
    label: { sw: "Muuzaji", en: "Seller" },
    bg: "rgba(232,163,61,0.16)",
    fg: "#8A5A16",
    border: "rgba(232,163,61,0.4)",
  },
  Buyer: {
    label: { sw: "Mnunuzi", en: "Buyer" },
    bg: "rgba(47,109,79,0.14)",
    fg: COLORS.green,
    border: "rgba(47,109,79,0.35)",
  },
  Neither: {
    label: { sw: "Wapya", en: "Neither" },
    bg: "rgba(16,26,46,0.06)",
    fg: "var(--text-secondary, #4B5563)",
    border: "rgba(16,26,46,0.15)",
  },
};

function RoleBadge({ role, lang }) {
  const conf = ROLE_STYLES[role] || ROLE_STYLES.Neither;
  return (
    <span
      style={{
        background: conf.bg,
        color: conf.fg,
        borderColor: conf.border,
      }}
      className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
    >
      {conf.label?.[lang] || conf.label?.sw}
    </span>
  );
}

const PAGE_SIZE = 20;

export default function UserManagementSection() {
  const { lang } = useLanguage();
  const users = useUsers();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const getUserRole = (user) => user.role || "Neither";

  // ── Fetch with filters + pagination ────────────────────────
  const fetchPage = useCallback(
    async (p = 1) => {
      const res = await hydrateUsersFromApi({
        page: p,
        pageSize: PAGE_SIZE,
        q: query.trim(),
        role: roleFilter,
        status: statusFilter,
        verified: verifiedFilter,
      });
      if (res.ok) {
        setPage(res.page || p);
        setTotalPages(res.totalPages || 1);
        setCount(res.count || 0);
      } else {
        setError(
          res.error?.message ||
            t("Imeshindwa kupakia watumiaji.", "Failed to load users.")
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, roleFilter, statusFilter, verifiedFilter]
  );

  // Initial load
  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to page 1 + refetch kama filter imebadilika
  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, roleFilter, statusFilter, verifiedFilter]);

  // ── Sikiliza events ili refresh list ───────────────────────
  // (mfano: admin ana-approve verification kwenye tab nyingine)
  useEffect(() => {
    const onUpdate = () => {
      fetchPage(page);
    };
    window.addEventListener("sokomkononi:users-updated", onUpdate);
    window.addEventListener("sokomkononi:verifications-updated", onUpdate);
    return () => {
      window.removeEventListener("sokomkononi:users-updated", onUpdate);
      window.removeEventListener("sokomkononi:verifications-updated", onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query, roleFilter, statusFilter, verifiedFilter]);

  // ── HANDLERS ───────────────────────────────────────────────
  const handleToggle = (userId) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;

    if (u.status === "suspended") {
      (async () => {
        setBusy((b) => ({ ...b, [userId]: "toggle" }));
        setError("");
        const res = await activateUserAsync(userId);
        setBusy((b) => {
          const n = { ...b };
          delete n[userId];
          return n;
        });
        if (!res.ok) {
          setError(
            res.error?.message ||
              t("Imeshindwa kumwasha mtumiaji.", "Failed to activate user.")
          );
        } else {
          fetchPage(page);
        }
      })();
    } else {
      setSuspendTarget(u);
    }
  };

  const handleSuspendConfirm = async ({ reason }) => {
    const u = suspendTarget;
    if (!u) return;
    setBusy((b) => ({ ...b, [u.id]: "toggle" }));
    setError("");
    const res = await suspendUserAsync(u.id, { reason });
    setBusy((b) => {
      const n = { ...b };
      delete n[u.id];
      return n;
    });
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kumsimamisha mtumiaji.", "Failed to suspend user.")
      );
    } else {
      setSuspendTarget(null);
      fetchPage(page);
    }
  };

  const handleDelete = (userId) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;
    setDeleteTarget(u);
  };

  const handleDeleteConfirm = async ({ reason, confirmText }) => {
    const u = deleteTarget;
    if (!u) return;
    setBusy((b) => ({ ...b, [u.id]: "delete" }));
    setError("");
    const res = await permanentDeleteUserAsync(u.id, { reason, confirmText });
    setBusy((b) => {
      const n = { ...b };
      delete n[u.id];
      return n;
    });
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kumfuta mtumiaji.", "Failed to delete user.")
      );
    } else {
      setDeleteTarget(null);
      if (selectedUser?.id === u.id) setSelectedUser(null);
      fetchPage(page);
    }
  };

  const handleVerify = async (userId) => {
    setBusy((b) => ({ ...b, [userId]: "verify" }));
    setError("");
    const res = await verifyUserAsync(userId);
    setBusy((b) => {
      const n = { ...b };
      delete n[userId];
      return n;
    });
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuthibitisha mtumiaji.", "Failed to verify user.")
      );
    } else {
      fetchPage(page);
    }
  };

  // ── ActionButtons ──────────────────────────────────────────
  const ActionButtons = ({ user, fullWidth = false }) => {
    const isSuspended = user.status === "suspended";
    const isVerified = user.isVerified;
    const isBusy = !!busy[user.id];
    const busyAction = busy[user.id];

    return (
      <div
        className={`flex items-center gap-1.5 flex-wrap ${
          fullWidth ? "w-full" : "justify-end"
        }`}
      >
        {!isVerified && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVerify(user.id);
            }}
            disabled={isBusy}
            style={{
              color: COLORS.green,
              borderColor: `${COLORS.green}33`,
            }}
            className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              fullWidth ? "flex-1" : ""
            }`}
            title={t("Thibitisha", "Verify")}
          >
            {busyAction === "verify" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ShieldCheck size={13} />
            )}
            {fullWidth && t("Thibitisha", "Verify")}
          </button>
        )}

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
              {fullWidth && t("Inafanya...", "Working...")}
            </>
          ) : isSuspended ? (
            <>
              <RotateCcw size={13} />
              {fullWidth && t("Washa Tena", "Activate")}
            </>
          ) : (
            <>
              <Ban size={13} />
              {fullWidth && t("Simamisha", "Suspend")}
            </>
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(user.id);
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

  // ── Pagination controls ────────────────────────────────────
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => page > 1 && fetchPage(page - 1)}
          disabled={page <= 1}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-colors"
          aria-label={t("Nyuma", "Previous")}
        >
          <ChevronLeft size={16} />
        </button>

        {start > 1 && (
          <>
            <button
              onClick={() => fetchPage(1)}
              className="w-9 h-9 rounded-lg border border-gray-200 text-sm font-medium text-secondary hover:bg-gray-50"
            >
              1
            </button>
            {start > 2 && <span className="text-muted px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => fetchPage(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? "bg-gold text-night"
                : "border border-gray-200 text-secondary hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="text-muted px-1">…</span>
            )}
            <button
              onClick={() => fetchPage(totalPages)}
              className="w-9 h-9 rounded-lg border border-gray-200 text-sm font-medium text-secondary hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => page < totalPages && fetchPage(page + 1)}
          disabled={page >= totalPages}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-colors"
          aria-label={t("Mbele", "Next")}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <>
      <SectionHeader
        title={t("Usimamizi wa Watumiaji", "User Management")}
        subtitle={t(
          "Dhibiti akaunti za watumiaji — thibitisha, simamisha, washa, au futa",
          "Manage user accounts — verify, suspend, activate, or delete"
        )}
      />

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
      <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "Tafuta kwa jina au email...",
              "Search by name or email..."
            )}
            className="smk-inline-search w-full rounded-lg border border-gray-200 bg-white pl-3 pr-10 py-2 text-sm outline-none focus:outline-none focus-visible:outline-none"
            style={{ WebkitAppearance: "none" }}
          />
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary"
        >
          <option value="all">{t("Nafasi: Zote", "Role: All")}</option>
          <option value="Admin">Admin</option>
          <option value="Seller">{t("Wauzaji", "Sellers")}</option>
          <option value="Buyer">{t("Wanunuzi", "Buyers")}</option>
          <option value="Both">{t("Wote Wawili", "Both")}</option>
          <option value="Neither">{t("Wapya", "Neither")}</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary"
        >
          <option value="all">{t("Hali: Zote", "Status: All")}</option>
          <option value="active">{t("Hai", "Active")}</option>
          <option value="suspended">{t("Amesimamishwa", "Suspended")}</option>
        </select>

        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary"
        >
          <option value="all">{t("Uthibitisho: Zote", "Verified: All")}</option>
          <option value="verified">{t("Imethibitishwa", "Verified")}</option>
          <option value="unverified">{t("Haijathibitishwa", "Unverified")}</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-muted mb-2">
        {t(`Watumiaji ${count}`, `${count} users`)}
      </p>

      {/* DESKTOP — TABLE */}
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
                  {t("Nafasi", "Role")}
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
              {users.map((u) => {
                const role = getUserRole(u);
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(u)}
                  >
                    <td className="px-5 py-3 text-sm font-medium text-primary">
                      <div className="flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.isVerified && (
                          <ShieldCheck
                            size={13}
                            style={{ color: COLORS.green }}
                            className="shrink-0"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-secondary">
                      {u.email}
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={role} lang={lang} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={u.status} lang={lang} />
                    </td>
                    <td className="px-5 py-3 text-sm text-muted">
                      {u.joined}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ActionButtons user={u} />
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
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

      {/* MOBILE — CARD LIST */}
      <div className="sm:hidden flex flex-col gap-3">
        {users.map((u) => {
          const role = getUserRole(u);
          return (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-primary truncate">
                      {u.name}
                    </p>
                    {u.isVerified && (
                      <ShieldCheck
                        size={13}
                        style={{ color: COLORS.green }}
                        className="shrink-0"
                      />
                    )}
                  </div>
                  <p className="text-xs text-secondary truncate mt-0.5">
                    {u.email}
                  </p>
                </div>
                <StatusBadge status={u.status} lang={lang} />
              </div>

              <div className="flex items-center gap-3 text-xs text-secondary mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-muted">
                    {t("Nafasi:", "Role:")}
                  </span>
                  <RoleBadge role={role} lang={lang} />
                </span>
                <span className="text-muted">•</span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-muted">
                    {t("Alijiunga:", "Joined:")}
                  </span>
                  <span className="font-medium text-primary">
                    {u.joined}
                  </span>
                </span>
              </div>

              <ActionButtons user={u} fullWidth />
            </div>
          );
        })}

        {users.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-muted">
            {t("Hakuna matokeo", "No results")}
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <PaginationControls />

      {/* DRAWER — inachukua data yenyewe kutoka /full/ */}
      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          lang={lang}
        />
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onClose={() => !busy[deleteTarget.id] && setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          busy={busy[deleteTarget.id] === "delete"}
        />
      )}

      {/* SUSPEND MODAL */}
      {suspendTarget && (
        <SuspendUserModal
          user={suspendTarget}
          onClose={() => !busy[suspendTarget.id] && setSuspendTarget(null)}
          onConfirm={handleSuspendConfirm}
          busy={busy[suspendTarget.id] === "toggle"}
        />
      )}
    </>
  );
}