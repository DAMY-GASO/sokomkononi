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
// Rangi zinatoka kwenye logo. `color` ni CSS variable — itumike kupitia
// style={{ color }} (si prop ya `color=` ya lucide, kwa sababu var() haifanyi
// kazi ndani ya SVG attribute).
const GOLD_BG = "rgba(254,164,6,0.14)";
const GREEN_BG = "rgba(47,109,79,0.14)";
const RUST_BG = "rgba(193,80,46,0.14)";
const ROYAL_BG = "rgba(0,98,253,0.12)";

const NOTIFICATION_TYPES = {
  message: { icon: MessageSquare, color: COLORS.goldText, bg: GOLD_BG },
  deal: { icon: HandCoins, color: COLORS.successText, bg: GREEN_BG },
  boost: { icon: Rocket, color: COLORS.dangerText, bg: RUST_BG },
  leading: { icon: TrendingUp, color: COLORS.link, bg: ROYAL_BG },
  advertisement: { icon: Megaphone, color: COLORS.goldText, bg: GOLD_BG },
  listing_fee: { icon: Receipt, color: COLORS.successText, bg: GREEN_BG },
  verified: { icon: Shield, color: COLORS.successText, bg: GREEN_BG },
  reminder: { icon: Clock, color: COLORS.link, bg: ROYAL_BG },
  listing_released: { icon: BellRing, color: COLORS.dangerText, bg: RUST_BG },
  system: { icon: Info, color: COLORS.ink, bg: "rgb(var(--c-ink) / 0.08)" },
  "dispute.resolved": { icon: Shield, color: COLORS.successText, bg: GREEN_BG },
  "payment.proof_submitted": { icon: Receipt, color: COLORS.goldText, bg: GOLD_BG },
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
        background: notif.read ? "rgb(var(--c-card))" : (config?.bg || "rgb(var(--c-page))"),
        borderColor: "rgb(var(--c-hairline))",
      }}
      className="rounded-xl border p-4 flex items-start gap-3 transition-all cursor-pointer hover:shadow-md hover:border-[#FEA406]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEA406]"
    >
      {/* Icon */}
      <div
        style={{ background: config?.bg || "rgb(var(--c-page))" }}
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
      >
        <Icon size={18} style={{ color: config.color }} />
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
            className="p-1.5 text-muted hover:text-[color:rgb(var(--c-success-text))] rounded-lg hover:bg-success/10 transition-colors"
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
          className="p-1.5 text-muted hover:text-[color:rgb(var(--c-danger-text))] rounded-lg hover:bg-danger/10 transition-colors"
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
  const handleMarkAllRead = async () => {
    const res = await markAllRead();
    if (res?.ok) toast.success(lang === "sw" ? "Zote zimesomwa" : "All marked as read");
    else toast.error(lang === "sw" ? "Imeshindwa kuweka zote kama zimesomwa" : "Failed to mark all read");
  };
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
    if (!res?.ok) toast.error(res?.error?.message || (lang === "sw" ? "Imeshindwa kufuta alama" : "Failed to clear marks"));
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
    if (!res?.ok) toast.error(res?.error?.message || (lang === "sw" ? "Imeshindwa kufuta" : "Failed to delete"));
    else toast.success(lang === "sw" ? "Zimefutwa" : "Deleted");
  };

  return (
    <div
      style={{ minHeight: "100%" }}
      className="bg-page w-full p-4 sm:p-6"
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
              className="flex rounded-full border border-hairline bg-card p-1"
            >
              <button
                onClick={() => setFilter("all")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${filter === "all" ? "chip-active" : "text-primary"}`}
              >
                {lang === "sw" ? "Zote" : "All"} ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${filter === "unread" ? "chip-active" : "text-primary"}`}
              >
                {lang === "sw" ? "Hazijasomwa" : "Unread"} ({unreadCount})
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  style={{ color: COLORS.successText }}
                >
                  <CheckCheck size={14} />
                  {lang === "sw" ? "Soma zote" : "Mark all read"}
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ color: COLORS.ink }}
              >
                <CheckCheck size={14} />
                {lang === "sw" ? "Ondoa Alama Zote" : "Clear All"}
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ color: COLORS.dangerText }}
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
            className="rounded-2xl border-2 border-dashed border-hairline p-12 text-center bg-card"
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