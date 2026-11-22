// ============================================================
// UserManagementSection.jsx
// + Verify imeondolewa (verification iko VerificationSection)
// + Permanent delete inafanya kazi (body moja kwa moja)
// + Notifications zote ni bilingual (sw/en)
// + loading inaisha KILA MARA (request sequence)
// + AbortController + requestSeqRef (race-condition safe)
// + skeleton inaonekana tu kwenye firstLoad
// + timeout guard ya skeleton
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
  CheckCircle2,
  AlertCircle,
  X,
  History,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
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
  permanentDeleteUserAsync,
} from "../../../../config/usersStore.js";
import {
  useAuditLogs,
  AUDIT_ACTIONS,
} from "../../../../config/auditLogsStore.js";

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
      className="inline-block text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
    >
      {conf.label?.[lang] || conf.label?.sw}
    </span>
  );
}

const PAGE_SIZE = 20;
const SKELETON_TIMEOUT_MS = 15000;

function TableSkeleton({ rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-3 py-3">
            <div className="h-4 w-4 rounded bg-[rgb(var(--c-ink)/0.08)]" />
          </td>
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

// ============================================================
// TOAST (bilingual)
// ============================================================
function Toast({ toast, onClose, lang }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] sm:w-auto rounded-xl border px-4 py-3 shadow-lg flex items-start gap-3"
      style={{
        background: isError ? "rgba(193,80,46,0.10)" : "rgba(47,109,79,0.10)",
        borderColor: isError ? "rgba(193,80,46,0.35)" : "rgba(47,109,79,0.35)",
        color: isError ? COLORS.dangerText : COLORS.successText,
      }}
    >
      {isError ? (
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
      )}
      <p className="text-xs font-semibold leading-relaxed flex-1">
        {toast.message?.[lang] || toast.message?.sw}
      </p>
      <button
        onClick={onClose}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label={lang === "sw" ? "Funga" : "Close"}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ============================================================
// USER ACTIVITY MODAL — vitendo vya admin kwa mtumiaji huyu
// Chanzo: audit logs (action zinazoanza na "user." na targetId = user.id).
// ============================================================
function UserActivityModal({ user, lang, onClose }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const logs = useAuditLogs();

  const items = logs
    .filter(
      (l) =>
        typeof l.action === "string" &&
        l.action.startsWith("user.") &&
        l.targetId != null &&
        String(l.targetId) === String(user.id)
    )
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 20);

  const detailsOf = (l) => {
    const raw = typeof l.details === "string" ? l.details : "";
    return lang === "en"
      ? l.detailsEn || raw || l.detailsSw || ""
      : l.detailsSw || raw || l.detailsEn || "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-hairline p-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate">
              {t("Historia ya Vitendo", "Activity History")}
            </p>
            <p className="text-xs text-muted truncate">
              {user.name || user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-secondary shrink-0"
            aria-label={t("Funga", "Close")}
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          {items.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">
              {t(
                "Hakuna vitendo vya admin vilivyorekodiwa kwa mtumiaji huyu.",
                "No admin actions recorded for this user."
              )}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((l) => {
                const a = AUDIT_ACTIONS.find((x) => x.key === l.action);
                const d = detailsOf(l);
                return (
                  <li key={l.id} className="text-xs min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{ background: "rgb(var(--c-ink) / 0.08)", color: COLORS.ink }}
                        className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      >
                        {a?.label?.[lang] || a?.label?.sw || l.action}
                      </span>
                      <span className="text-xs text-muted whitespace-nowrap">
                        {timeAgo(l.at, lang)}
                      </span>
                      {l.adminName && (
                        <span className="text-xs text-muted truncate">
                          · {l.adminName}
                        </span>
                      )}
                    </div>
                    {d && (
                      <p className="text-xs text-secondary mt-1 break-words">
                        {d}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-muted mt-4">
            {t(
              "Zinaonyesha vitendo vya admin (simamisha, washa, n.k.) kutoka audit logs za hivi karibuni.",
              "Shows admin actions (suspend, activate, etc.) from the most recent audit logs."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UserManagementSection() {
  const { lang } = useLanguage();

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
  const [activityUser, setActivityUser] = useState(null);

  // ── Bulk actions ──
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkAction, setBulkAction] = useState(null); // "suspend" | "delete" | null
  const [bulkReason, setBulkReason] = useState("");
  const [bulkConfirmText, setBulkConfirmText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  // Toast ya bilingual
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToast = useCallback((message, type = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // AbortController + sequence kwa race condition
  const abortRef = useRef(null);
  const requestSeqRef = useRef(0);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const getUserRole = (user) => user.role || "Neither";

  // ── Fetch ─────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (p = 1) => {
      const seq = ++requestSeqRef.current;

      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      let res;
      try {
        res = await hydrateUsersFromApi(
          {
            page: p,
            pageSize: PAGE_SIZE,
            q: query.trim(),
            role: roleFilter,
            status: statusFilter,
            verified: verifiedFilter,
          },
          { signal: controller.signal }
        );
      } catch (err) {
        if (err?.name === "AbortError") return;
        res = { ok: false, error: err };
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
          setFirstLoad(false);
        }
      }

      if (seq !== requestSeqRef.current) return;

      if (res?.ok) {
        setUsers(getUsers());
        setSelectedIds(new Set()); // uchaguzi ni wa ukurasa wa sasa tu
        setPage(res.page || p);
        setTotalPages(res.totalPages || 1);
        setCount(res.count || 0);
      } else if (res) {
        showToast(
          {
            sw:
              res?.error?.message ||
              "Imeshindwa kupakia watumiaji. Jaribu tena.",
            en:
              res?.error?.message ||
              "Failed to load users. Please try again.",
          },
          "error"
        );
        setUsers([]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, roleFilter, statusFilter, verifiedFilter]
  );

  useEffect(() => {
    fetchPage(1);
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, roleFilter, statusFilter, verifiedFilter]);

  // Timeout guard — skeleton isiwe milele
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setFirstLoad(false);
      showToast(
        {
          sw: "Inachukua muda mrefu kupakia. Tafadhali jaribu tena.",
          en: "Loading is taking too long. Please try again.",
        },
        "error"
      );
    }, SKELETON_TIMEOUT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ── HANDLERS ───────────────────────────────────────────────
  const handleToggle = (userId) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;

    if (u.status === "suspended") {
      (async () => {
        setBusy((b) => ({ ...b, [userId]: "toggle" }));
        const res = await activateUserAsync(userId);
        setBusy((b) => {
          const n = { ...b };
          delete n[userId];
          return n;
        });
        if (!res.ok) {
          showToast(
            {
              sw:
                res.error?.message ||
                "Imeshindwa kumwasha mtumiaji.",
              en:
                res.error?.message ||
                "Failed to activate user.",
            },
            "error"
          );
        } else {
          showToast({
            sw: "Mtumiaji amewashwa kikamilifu.",
            en: "User activated successfully.",
          });
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
    const res = await suspendUserAsync(u.id, { reason });
    setBusy((b) => {
      const n = { ...b };
      delete n[u.id];
      return n;
    });
    if (!res.ok) {
      showToast(
        {
          sw:
            res.error?.message ||
            "Imeshindwa kumsimamisha mtumiaji.",
          en:
            res.error?.message ||
            "Failed to suspend user.",
        },
        "error"
      );
    } else {
      setSuspendTarget(null);
      showToast({
        sw: "Mtumiaji amesimamishwa.",
        en: "User suspended.",
      });
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
    const res = await permanentDeleteUserAsync(u.id, { reason, confirmText });
    setBusy((b) => {
      const n = { ...b };
      delete n[u.id];
      return n;
    });
    if (!res.ok) {
      showToast(
        {
          sw:
            res.error?.message ||
            "Imeshindwa kumfuta mtumiaji.",
          en:
            res.error?.message ||
            "Failed to delete user.",
        },
        "error"
      );
    } else {
      setDeleteTarget(null);
      if (selectedUser?.id === u.id) setSelectedUser(null);
      showToast({
        sw: "Mtumiaji amefutwa kabisa.",
        en: "User permanently deleted.",
      });
      fetchPage(page);
    }
  };

  // ── Bulk helpers ───────────────────────────────────────────
  const MIN_REASON = 5;
  // Staff hawawezi kusimamishwa/kufutwa kwa wingi
  const selectableUsers = users.filter((u) => !u.isStaff);
  const allShownSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedIds.has(u.id));

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds(
      allShownSelected ? new Set() : new Set(selectableUsers.map((u) => u.id))
    );

  const closeBulkForm = () => {
    setBulkAction(null);
    setBulkReason("");
    setBulkConfirmText("");
  };

  const runBulk = async (action) => {
    // Chukua tu waliochaguliwa ambao si staff (ulinzi mara ya pili)
    const targets = users.filter((u) => selectedIds.has(u.id) && !u.isStaff);
    if (targets.length === 0 || bulkBusy) return;

    if (action !== "activate") {
      if (bulkReason.trim().length < MIN_REASON) {
        showToast(
          {
            sw: `Sababu lazima iwe na angalau herufi ${MIN_REASON}.`,
            en: `Reason must be at least ${MIN_REASON} characters.`,
          },
          "error"
        );
        return;
      }
      if (action === "delete" && bulkConfirmText !== "DELETE") {
        showToast(
          { sw: 'Andika "DELETE" kuthibitisha.', en: 'Type "DELETE" to confirm.' },
          "error"
        );
        return;
      }
    }

    setBulkBusy(true);
    let ok = 0;
    let failed = 0;
    // Mfuatano — huzuia rate-limit na kuhifadhi mpangilio wa audit logs
    for (const u of targets) {
      let res;
      try {
        if (action === "suspend") {
          if (u.status === "suspended") { ok += 1; continue; }
          res = await suspendUserAsync(u.id, { reason: bulkReason.trim() });
        } else if (action === "activate") {
          if (u.status !== "suspended") { ok += 1; continue; }
          res = await activateUserAsync(u.id);
        } else {
          res = await permanentDeleteUserAsync(u.id, {
            reason: bulkReason.trim(),
            confirmText: "DELETE",
          });
        }
      } catch (e) {
        res = { ok: false };
      }
      if (res?.ok) ok += 1;
      else failed += 1;
    }
    setBulkBusy(false);
    closeBulkForm();
    showToast(
      {
        sw: `Imefanikiwa: ${ok}. Imeshindwa: ${failed}.`,
        en: `Succeeded: ${ok}. Failed: ${failed}.`,
      },
      failed > 0 ? "error" : "success"
    );
    fetchPage(page);
  };

  // ── ActionButtons ──────────────────────────────────────────
  const ActionButtons = ({ user, fullWidth = false }) => {
    const isSuspended = user.status === "suspended";
    const isBusy = !!busy[user.id];
    const busyAction = busy[user.id];

    return (
      <div
        className={`flex items-center gap-1.5 flex-wrap ${
          fullWidth ? "w-full" : "justify-end"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActivityUser(user);
          }}
          title={t("Historia ya Vitendo", "Activity History")}
          aria-label={t("Historia ya Vitendo", "Activity History")}
          style={{ color: COLORS.ink, borderColor: "rgb(var(--c-ink) / 0.2)" }}
          className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            fullWidth ? "flex-1" : ""
          }`}
        >
          <History size={14} />
          {fullWidth && t("Historia", "History")}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle(user.id);
          }}
          disabled={isBusy}
          title={
            isSuspended
              ? t("Washa Tena", "Activate")
              : t("Simamisha", "Suspend")
          }
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
              <Loader2 size={14} className="animate-spin" />
              {fullWidth &&
                t("Inafanya...", "Working...")}
            </>
          ) : isSuspended ? (
            <>
              <RotateCcw size={14} />
              {fullWidth && t("Washa Tena", "Activate")}
            </>
          ) : (
            <>
              <Ban size={14} />
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
              <Loader2 size={14} className="animate-spin" />
              {fullWidth && t("Inafuta...", "Deleting...")}
            </>
          ) : (
            <>
              <Trash2 size={14} />
              {fullWidth && t("Futa", "Delete")}
            </>
          )}
        </button>
      </div>
    );
  };

  // ── Pagination ─────────────────────────────────────────────
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
          "Dhibiti akaunti za watumiaji — simamisha, washa, au futa",
          "Manage user accounts — suspend, activate, or delete"
        )}
      />

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
          <Search
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
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
          <option value="unverified">
            {t("Haijathibitishwa", "Unverified")}
          </option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-muted mb-2">
        {loading && firstLoad
          ? t("Inapakia...", "Loading...")
          : t(`Watumiaji ${count}`, `${count} users`)}
      </p>

      {/* BULK BAR */}
      {selectedIds.size > 0 && (
        <div
          style={{ borderColor: COLORS.gold, background: "rgb(var(--c-card))" }}
          className="rounded-xl border-2 p-3 sm:p-4 mb-3 flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-primary">
              {selectedIds.size} {t("wamechaguliwa", "selected")}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => runBulk("activate")}
                disabled={bulkBusy}
                style={{ color: COLORS.successText, borderColor: `${COLORS.green}33` }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-50"
              >
                {bulkBusy && !bulkAction ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                {t("Washa", "Activate")}
              </button>
              <button
                onClick={() => { setBulkAction("suspend"); setBulkConfirmText(""); }}
                disabled={bulkBusy}
                style={{ color: COLORS.dangerText, borderColor: `${COLORS.rust}33` }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-50"
              >
                <Ban size={14} />
                {t("Simamisha", "Suspend")}
              </button>
              <button
                onClick={() => { setBulkAction("delete"); setBulkConfirmText(""); }}
                disabled={bulkBusy}
                style={{ color: COLORS.dangerText, borderColor: `${COLORS.rust}33` }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-50"
              >
                <Trash2 size={14} />
                {t("Futa Kabisa", "Delete")}
              </button>
              <button
                onClick={() => { setSelectedIds(new Set()); closeBulkForm(); }}
                disabled={bulkBusy}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-secondary hover:bg-ink/5 disabled:opacity-50"
              >
                {t("Ondoa uchaguzi", "Clear")}
              </button>
            </div>
          </div>

          {bulkAction && (
            <div className="flex flex-col gap-2">
              <p
                style={{ background: "rgba(193,80,46,0.08)", color: COLORS.dangerText }}
                className="text-xs font-semibold px-3 py-2 rounded-lg"
              >
                {bulkAction === "delete"
                  ? t(
                      `Utafuta KABISA watumiaji ${selectedIds.size}. Hatua hii haiwezi kurudishwa.`,
                      `You are about to PERMANENTLY delete ${selectedIds.size} users. This cannot be undone.`
                    )
                  : t(
                      `Utasimamisha watumiaji ${selectedIds.size}.`,
                      `You are about to suspend ${selectedIds.size} users.`
                    )}
              </p>
              <textarea
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                rows={2}
                disabled={bulkBusy}
                placeholder={t(
                  `Sababu (angalau herufi ${MIN_REASON})...`,
                  `Reason (at least ${MIN_REASON} characters)...`
                )}
                className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-xs outline-none resize-none disabled:opacity-50"
              />
              {bulkAction === "delete" && (
                <input
                  value={bulkConfirmText}
                  onChange={(e) => setBulkConfirmText(e.target.value)}
                  disabled={bulkBusy}
                  placeholder={t('Andika "DELETE" kuthibitisha', 'Type "DELETE" to confirm')}
                  className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-xs font-mono outline-none disabled:opacity-50"
                />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={closeBulkForm}
                  disabled={bulkBusy}
                  className="text-xs font-semibold px-3 py-2 rounded-lg border border-hairline text-secondary disabled:opacity-50"
                >
                  {t("Ghairi", "Cancel")}
                </button>
                <button
                  onClick={() => runBulk(bulkAction)}
                  disabled={
                    bulkBusy ||
                    bulkReason.trim().length < MIN_REASON ||
                    (bulkAction === "delete" && bulkConfirmText !== "DELETE")
                  }
                  style={{ background: COLORS.rust, color: "white" }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkBusy && <Loader2 size={14} className="animate-spin" />}
                  {bulkAction === "delete" ? t("Futa Kabisa", "Delete Permanently") : t("Simamisha", "Suspend")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DESKTOP — TABLE */}
      <div className="hidden sm:block bg-card rounded-xl border border-hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-page">
              <tr>
                <th className="px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={allShownSelected}
                    onChange={toggleSelectAll}
                    disabled={selectableUsers.length === 0 || bulkBusy}
                    aria-label={t("Chagua wote", "Select all")}
                    className="w-4 h-4 rounded"
                  />
                </th>
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
                    colSpan={7}
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
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(u.id)}
                          onChange={() => toggleSelect(u.id)}
                          disabled={u.isStaff || bulkBusy}
                          title={u.isStaff ? t("Admin hawezi kuchaguliwa", "Admin cannot be selected") : undefined}
                          className="w-4 h-4 rounded disabled:opacity-30"
                        />
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-primary">
                        <div className="flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.isVerified && (
                            <ShieldCheck
                              size={14}
                              style={{ color: COLORS.successText }}
                              className="shrink-0"
                              title={t("Imethibitishwa", "Verified")}
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
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelect(u.id)}
                    disabled={u.isStaff || bulkBusy}
                    aria-label={t("Chagua mtumiaji", "Select user")}
                    className="w-4 h-4 mt-1 rounded shrink-0 disabled:opacity-30"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-primary truncate">
                        {u.name}
                      </p>
                      {u.isVerified && (
                        <ShieldCheck
                          size={14}
                          style={{ color: COLORS.successText }}
                          className="shrink-0"
                          title={t("Imethibitishwa", "Verified")}
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

      {/* ACTIVITY MODAL */}
      {activityUser && (
        <UserActivityModal
          user={activityUser}
          lang={lang}
          onClose={() => setActivityUser(null)}
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

      {/* TOAST (bilingual) */}
      <Toast toast={toast} onClose={() => setToast(null)} lang={lang} />
    </>
  );
}