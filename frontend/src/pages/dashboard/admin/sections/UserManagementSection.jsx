// ============================================================
// UserManagementSection.jsx
// Usimamizi wa watumiaji — table (desktop) + card list (mobile).
// Bilingual + Async actions na rollback + loading state.
// + Status filter, Verified filter, Pagination
// + UserDrawer inachukua data yake yenyewe (/full/ endpoint)
// + Event listeners: refresh kwenye users-updated/verifications-updated
// + FIX: loading state + race condition guard + fetch moja tu
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from "react";
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
  hydrateUsersFromApi,
  getUsers,
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
    bg: "rgb(var(--c-ink) / 0.10)",
    fg: COLORS.ink,
    border: "rgb(var(--c-ink) / 0.25)",
  },
  Both: {
    label: { sw: "Wote Wawili", en: "Both" },
    bg: "rgba(0,98,253,0.12)",
    fg: COLORS.link,
    border: "rgba(0,98,253,0.30)",
  },
  Seller: {
    label: { sw: "Muuzaji", en: "Seller" },
    bg: "rgba(254,164,6,0.16)",
    fg: COLORS.goldText,
    border: "rgba(254,164,6,0.40)",
  },
  Buyer: {
    label: { sw: "Mnunuzi", en: "Buyer" },
    bg: "rgba(47,109,79,0.14)",
    fg: COLORS.successText,
    border: "rgba(47,109,79,0.35)",
  },
  Neither: {
    label: { sw: "Wapya", en: "Neither" },
    bg: "rgb(var(--c-ink) / 0.06)",
    fg: "rgb(var(--c-text-2))",
    border: "rgb(var(--c-ink) / 0.15)",
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

// Skeleton row kwa desktop
function TableSkeleton({ rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-5 py-3">
            <div className="h-4 w-32 rounded bg-[rgb(var(--c-ink)/0.08)]" />
          </td>
          <td className="px-5 py-3">
            <div className="h-4 w-40 rounded bg-[rgb(var(--c-ink)/0.08)]" />
          </td>
          <td className="px-5 py-3">
            <div className="h-5 w-16 rounded-full bg-[rgb(var(--c-ink)/0.08)]" />
          </td>
          <td className="px-5 py-3">
            <div className="h-5 w-16 rounded-full bg-[rgb(var(--c-ink)/0.08)]" />
          </td>
          <td className="px-5 py-3">
            <div className="h-4 w-20 rounded bg-[rgb(var(--c-ink)/0.08)]" />
          </td>
          <td className="px-5 py-3">
            <div className="ml-auto h-7 w-24 rounded bg-[rgb(var(--c-ink)/0.08)]" />
          </td>
        </tr>
      ))}
    </>
  );
}

// Skeleton card kwa mobile
function CardSkeleton({ rows = 3 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-xl border border-hairline p-4 animate-pulse"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-[rgb(var(--c-ink)/0.08)]" />
              <div className="h-3 w-48 rounded bg-[rgb(var(--c-ink)/0.08)]" />
            </div>
            <div className="h-5 w-16 rounded-full bg-[rgb(var(--c-ink)/0.08)]" />
          </div>
          <div className="h-8 w-full rounded bg-[rgb(var(--c-ink)/0.08)]" />
        </div>
      ))}
    </>
  );
}

export default function UserManagementSection() {
  const { lang } = useLanguage();

  // ⬇️ TUNATUMIA useState BADALA YA useUsers() ili kuepuka
  // fetch ya pili inayogongana na fetchPage().
  const [users, setUsers] = useState(() => getUsers());

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  // ⬇️ Race-condition guard — kila fetch inapata id yake
  const requestIdRef = useRef(0);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const getUserRole = (user) => user.role || "Neither";

  // ── Fetch with filters + pagination ────────────────────────
  const fetchPage = useCallback(
    async (p = 1) => {
      const myId = ++requestIdRef.current;
      setLoading(true);
      setError("");

      const res = await hydrateUsersFromApi({
        page: p,
        pageSize: PAGE_SIZE,
        q: query.trim(),
        role: roleFilter,
        status: statusFilter,
        verified: verifiedFilter,
      });

      // Kama fetch nyingine imeanza baada ya hii, puuza matokeo
      if (myId !== requestIdRef.current) return;

      if (res.ok) {
        setUsers(getUsers());
        setPage(res.page || p);
        setTotalPages(res.totalPages || 1);
        setCount(res.count || 0);
      } else {
        setError(
          res.error?.message ||
            t("Imeshindwa kupakia watumiaji.", "Failed to load users.")
        );
      }
      setLoading(false);
      setFirstLoad(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, roleFilter, statusFilter, verifiedFilter]
  );

  // Reset to page 1 + refetch kama filter imebadilika
  // (Hii inatosha kwa mount + filter change — hakuna haja ya
  //  useEffect ya pili ya mount)
  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, roleFilter, statusFilter, verifiedFilter]);

  // ── Sikiliza events ili refresh list ───────────────────────
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
              color: COLORS.successText,
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
            color: isSuspended ? COLORS.successText : COLORS.dangerText,
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
            color: COLORS.dangerText,
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
          disabled={page <= 1 || loading}
          className="w-9 h-9 rounded-lg border border-hairline flex items-center justify-center disabled:opacity-40 hover:bg-ink/5 transition-colors"
          aria-label={t("Nyuma", "Previous")}
        >
          <ChevronLeft size={16} />
        </button>

        {start > 1 && (
          <>
            <button
              onClick={() => fetchPage(1)}
              disabled={loading}
              className="w-9 h-9 rounded-lg border border-hairline text-sm font-medium text-secondary hover:bg-ink/5 disabled:opacity-40"
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
            disabled={loading}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
              p === page
                ? "bg-gold on-gold"
                : "border border-hairline text-secondary hover:bg-ink/5"
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
              disabled={loading}
              className="w-9 h-9 rounded-lg border border-hairline text-sm font-medium text-secondary hover:bg-ink/5 disabled:opacity-40"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => page < totalPages && fetchPage(page + 1)}
          disabled={page >= totalPages || loading}
          className="w-9 h-9 rounded-lg border border-hairline flex items-center justify-center disabled:opacity-40 hover:bg-ink/5 transition-colors"
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
            color: COLORS.dangerText,
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
            className="smk-inline-search w-full rounded-lg border border-hairline bg-card pl-3 pr-10 py-2 text-sm outline-none focus:outline-none focus-visible:outline-none"
            style={{ WebkitAppearance: "none" }}
          />
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-card border border-hairline rounded-lg px-3 py-2 text-sm text-primary"
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
          className="bg-card border border-hairline rounded-lg px-3 py-2 text-sm text-primary"
        >
          <option value="all">{t("Hali: Zote", "Status: All")}</option>
          <option value="active">{t("Hai", "Active")}</option>
          <option value="suspended">{t("Amesimamishwa", "Suspended")}</option>
        </select>

        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="bg-card border border-hairline rounded-lg px-3 py-2 text-sm text-primary"
        >
          <option value="all">{t("Uthibitisho: Zote", "Verified: All")}</option>
          <option value="verified">{t("Imethibitishwa", "Verified")}</option>
          <option value="unverified">{t("Haijathibitishwa", "Unverified")}</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-muted mb-2">
        {loading && firstLoad
          ? t("Inapakia...", "Loading...")
          : t(`Watumiaji ${count}`, `${count} users`)}
      </p>

      {/* DESKTOP — TABLE */}
      <div className="hidden sm:block bg-card rounded-xl border border-hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-page">
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
            <tbody className="divide-y divide-hairline">
              {loading && firstLoad ? (
                <TableSkeleton rows={6} />
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-muted"
                  >
                    {t("Hakuna matokeo", "No results")}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const role = getUserRole(u);
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-ink/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(u)}
                    >
                      <td className="px-5 py-3 text-sm font-medium text-primary">
                        <div className="flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.isVerified && (
                            <ShieldCheck
                              size={13}
                              style={{ color: COLORS.successText }}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE — CARD LIST */}
      <div className="sm:hidden flex flex-col gap-3">
        {loading && firstLoad ? (
          <CardSkeleton rows={3} />
        ) : users.length === 0 ? (
          <div className="bg-card rounded-xl border border-hairline p-8 text-center text-sm text-muted">
            {t("Hakuna matokeo", "No results")}
          </div>
        ) : (
          users.map((u) => {
            const role = getUserRole(u);
            return (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="bg-card rounded-xl border border-hairline p-4 cursor-pointer hover:shadow-sm transition-shadow"
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
                          style={{ color: COLORS.successText }}
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
          })
        )}
      </div>

      {/* PAGINATION */}
      <PaginationControls />

      {/* DRAWER */}
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