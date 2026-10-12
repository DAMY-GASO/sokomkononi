// ============================================================
// NotificationsPage.jsx
// Ukurasa wa taarifa za mtumiaji — bilingual + KILA KITU CENTERED.
// notif.title na notif.body zinaweza kuwa { sw, en }.
// ============================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Rocket,
  MessageSquare,
  HandCoins,
  Shield,
  Clock,
  Info,
  Eye,
  TrendingUp,
  Megaphone,
  Receipt,
  BellRing,
} from "lucide-react";
import {
  COLORS,
  formatTZS,
  timeAgo,
} from "./dashboard/components/shared";
import {
  useNotifications,
  getLocalizedField,
  resolveNotificationRoute,
} from "../config/notificationsStore.js";
import { useDashboardSide } from "../config/dashboardSideStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import { useToast } from "../components/Toast.jsx";

// ============================================================
// NOTIFICATION TYPES — icon + color
// ============================================================
const NOTIFICATION_TYPES = {
  message: {
    icon: MessageSquare,
    color: COLORS.gold,
    bg: "rgba(232,163,61,0.12)",
  },
  deal: { icon: HandCoins, color: COLORS.green, bg: "rgba(47,109,79,0.12)" },
  boost: { icon: Rocket, color: COLORS.rust, bg: "rgba(193,80,46,0.12)" },
  leading: { icon: TrendingUp, color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  advertisement: {
    icon: Megaphone,
    color: COLORS.gold,
    bg: "rgba(232,163,61,0.12)",
  },
  listing_fee: {
    icon: Receipt,
    color: COLORS.green,
    bg: "rgba(47,109,79,0.12)",
  },
  verified: { icon: Shield, color: COLORS.green, bg: "rgba(47,109,79,0.12)" },
  reminder: { icon: Clock, color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  listing_released: {
    icon: BellRing,
    color: COLORS.rust,
    bg: "rgba(193,80,46,0.12)",
  },
  system: { icon: Info, color: COLORS.night, bg: "rgba(16,26,46,0.08)" },
  "dispute.resolved": {
    icon: Shield,
    color: COLORS.green,
    bg: "rgba(47,109,79,0.12)",
  },
  "payment.proof_submitted": {
    icon: Receipt,
    color: "#8A5A16",
    bg: "rgba(232,163,61,0.16)",
  },
};

// ============================================================
// NOTIFICATION ITEM
// ============================================================
function NotificationItem({ notif, onMarkRead, onRemove, lang, side }) {
  const navigate = useNavigate();
  const config = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.system;
  const Icon = config.icon;

  const title = getLocalizedField(notif.title, lang);
  const body = getLocalizedField(notif.body, lang);

  // Determine the destination route from the notification type + payload.
  const target = resolveNotificationRoute(notif, side);

  // Full date + time — not just "timeAgo".
  const when = notif.at ? new Date(notif.at) : null;
  const timeText = when && !Number.isNaN(when.getTime())
    ? when.toLocaleString(lang === "sw" ? "sw-TZ" : "en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleOpen = () => {
    if (!notif.read) onMarkRead(notif.id);
    navigate(target);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
      aria-label={title || ""}
      style={{
        background: notif.read ? "white" : (config?.bg || "#F5F3EC"),
        borderColor: COLORS.sandLine,
      }}
      className="rounded-xl border p-4 flex items-start gap-3 transition-all cursor-pointer hover:shadow-md hover:border-[#E8A33D]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A33D]"
    >
      {/* Icon */}
      <div
        style={{ background: config?.bg || "#F5F3EC" }}
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
      >
        <Icon size={18} color={config.color} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            style={{ color: "var(--text-primary)" }}
            className={`text-sm break-words ${
              notif.read ? "font-medium" : "font-semibold"
            }`}
          >
            {title}
          </p>
          {!notif.read && (
            <span
              style={{ background: COLORS.rust }}
              className="w-2 h-2 rounded-full shrink-0 mt-1.5"
              aria-label={lang === "sw" ? "Haijasomwa" : "Unread"}
            />
          )}
        </div>

        {body && (
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-xs mb-2 leading-relaxed whitespace-pre-wrap break-words"
          >
            {body}
          </p>
        )}

        {timeText && (
          <p
            style={{ color: "var(--text-muted)" }}
            className="text-[11px] font-medium"
          >
            {timeText}
          </p>
        )}
      </div>

      {/* Row actions (stop propagation so they don't trigger the card click) */}
      <div className="flex flex-col gap-1 shrink-0">
        {!notif.read && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notif.id);
            }}
            className="p-1.5 text-muted hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
            aria-label={lang === "sw" ? "Weka kama imesomwa" : "Mark as read"}
          >
            <Check size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(notif.id);
          }}
          className="p-1.5 text-muted hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          aria-label={lang === "sw" ? "Ondoa" : "Remove"}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function NotificationsPage() {
  const { lang } = useLanguage();
  const side = useDashboardSide();
  const confirm = useConfirm();
  const toast = useToast();
  const { notifications, unreadCount, markRead, markAllRead, remove, clearAll } =
    useNotifications("user");
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkRead = (id) => markRead(id);
  const handleMarkAllRead = () => markAllRead();
  const handleRemove = (id) => remove(id);

  const handleClearAll = async () => {
    const ok = await confirm({
      title: lang === "sw" ? "Ondoa alama zote za kusoma?" : "Clear all read marks?",
      description: lang === "sw"
        ? "Taarifa zote zitabaki lakini zitaonekana kama zimesomwa."
        : "All notifications stay but will be marked as read.",
      confirmLabel: lang === "sw" ? "Ondoa Alama" : "Clear",
    });
    if (!ok) return;
    const res = await markAllRead();
    if (!res?.ok) toast.error(res?.error?.message || "Failed.");
    else toast.success(lang === "sw" ? "Alama zimeondolewa" : "Marks cleared");
  };

  const handleDeleteAll = async () => {
    const ok = await confirm({
      title: lang === "sw" ? "Futa taarifa zote?" : "Delete all notifications?",
      description: lang === "sw"
        ? "Hatua hii haiwezi kurudishwa."
        : "This action cannot be undone.",
      confirmLabel: lang === "sw" ? "Futa Zote" : "Delete All",
      danger: true,
    });
    if (!ok) return;
    const res = await clearAll();
    if (!res?.ok) toast.error(res?.error?.message || "Failed.");
    else toast.success(lang === "sw" ? "Zimefutwa" : "Deleted");
  };

  return (
    <div
      style={{
        background: COLORS.sand,
        minHeight: "100%",
      }}
      className="w-full p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto">
        {/* ============================================================ */}
        {/* HEADER — CENTERED */}
        {/* ============================================================ */}
        <div className="mb-5 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <h1
              style={{ color: "var(--text-primary)" }}
              className="text-2xl sm:text-3xl font-semibold"
            >
              {lang === "sw" ? "Taarifa" : "Notifications"}
            </h1>
            {unreadCount > 0 && (
              <span
                style={{ background: COLORS.rust, color: "white" }}
                className="text-xs font-bold px-2.5 py-1 rounded-full"
              >
                {unreadCount}
              </span>
            )}
          </div>
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-sm max-w-xl mx-auto"
          >
            {lang === "sw"
              ? "Taarifa za miamala, ujumbe, na mabadiliko kwenye akaunti yako."
              : "Notifications about transactions, messages, and account changes."}
          </p>
        </div>

        {/* ============================================================ */}
        {/* FILTER + ACTIONS — CENTERED */}
        {/* ============================================================ */}
        {notifications.length > 0 && (
          <div className="flex flex-col items-center gap-3 mb-4">
            <div
              style={{ background: "white", borderColor: COLORS.sandLine }}
              className="flex rounded-full border p-1"
            >
              <button
                onClick={() => setFilter("all")}
                style={{
                  background:
                    filter === "all" ? COLORS.night : "transparent",
                  color: filter === "all" ? COLORS.sand : "var(--text-primary)",
                }}
                className="text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
              >
                {lang === "sw" ? "Zote" : "All"} ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                style={{
                  background:
                    filter === "unread" ? COLORS.night : "transparent",
                  color: filter === "unread" ? COLORS.sand : "var(--text-primary)",
                }}
                className="text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
              >
                {lang === "sw" ? "Hazijasomwa" : "Unread"} ({unreadCount})
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  style={{ color: COLORS.green }}
                >
                  <CheckCheck size={14} />
                  {lang === "sw" ? "Soma zote" : "Mark all read"}
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ color: COLORS.night }}
              >
                <CheckCheck size={14} />
                {lang === "sw" ? "Ondoa Alama Zote" : "Clear All"}
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ color: COLORS.rust }}
              >
                <Trash2 size={14} />
                {lang === "sw" ? "Futa Zote" : "Delete All"}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* EMPTY STATE — CENTERED */}
        {/* ============================================================ */}
        {filtered.length === 0 ? (
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="rounded-2xl border-2 border-dashed p-12 text-center bg-white"
          >
            <Bell size={48} className="mx-auto text-muted mb-3" />
            <h3
              style={{ color: "var(--text-primary)" }}
              className="font-semibold mb-1"
            >
              {filter === "unread"
                ? lang === "sw"
                  ? "Hakuna taarifa mpya"
                  : "No new notifications"
                : lang === "sw"
                  ? "Hakuna taarifa"
                  : "No notifications"}
            </h3>
            <p
              style={{ color: "var(--text-secondary)" }}
              className="text-sm"
            >
              {filter === "unread"
                ? lang === "sw"
                  ? "Umesoma taarifa zote."
                  : "You've read all your notifications."
                : lang === "sw"
                  ? "Taarifa zako zitaonekana hapa."
                  : "Your notifications will appear here."}
            </p>
          </div>
        ) : (
          /* ============================================================ */
          /* LIST — kadi zimeachwa kushoto kwa data nyingi */
          /* ============================================================ */
          <div className="flex flex-col gap-3">
            {filtered.map((n) => (
              <NotificationItem
                key={n.id}
                notif={n}
                onMarkRead={handleMarkRead}
                onRemove={handleRemove}
                lang={lang}
                side={side}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}