import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { COLORS, FONTS, formatTZS, timeAgo } from "./dashboard/components/shared";
import { useNotifications } from "./config/notificationsStore.js";

// Notification types with icon + color — "leading", "advertisement" na
// "listing_fee" ni matukio halisi ya Awamu 7 (yanayotengenezwa na
// notificationsStore.js moja kwa moja BoostSasa/LeadingSasa/AdvertiseSasa
// na DashboardShell.markListingPaid zinapofanikiwa).
const NOTIFICATION_TYPES = {
  message: { icon: MessageSquare, color: COLORS.gold, bg: "rgba(232,163,61,0.12)" },
  deal: { icon: HandCoins, color: COLORS.green, bg: "rgba(47,109,79,0.12)" },
  boost: { icon: Rocket, color: COLORS.rust, bg: "rgba(193,80,46,0.12)" },
  leading: { icon: TrendingUp, color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  advertisement: { icon: Megaphone, color: COLORS.gold, bg: "rgba(232,163,61,0.12)" },
  listing_fee: { icon: Receipt, color: COLORS.green, bg: "rgba(47,109,79,0.12)" },
  verified: { icon: Shield, color: COLORS.green, bg: "rgba(47,109,79,0.12)" },
  reminder: { icon: Clock, color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  listing_released: { icon: BellRing, color: COLORS.rust, bg: "rgba(193,80,46,0.12)" },
  system: { icon: Info, color: COLORS.night, bg: "rgba(16,26,46,0.08)" },
};

function NotificationItem({ notif, onMarkRead, onRemove }) {
  const config = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.system;
  const Icon = config.icon;

  return (
    <div
      style={{
        background: notif.read ? "white" : `${config.bg}`,
        borderColor: COLORS.sandLine,
      }}
      className="rounded-xl border p-4 flex items-start gap-3 transition-colors"
    >
      <div
        style={{ background: config.bg }}
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
      >
        <Icon size={18} color={config.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p
            style={{ color: COLORS.night }}
            className={`text-sm ${notif.read ? "font-medium" : "font-semibold"}`}
          >
            {notif.title}
          </p>
          {!notif.read && (
            <span
              style={{ background: COLORS.rust }}
              className="w-2 h-2 rounded-full shrink-0 mt-1.5"
            />
          )}
        </div>
        <p style={{ color: "rgba(16,26,46,0.65)" }} className="text-xs mb-2 leading-relaxed">
          {notif.body}
        </p>
        <div className="flex items-center gap-3">
          <span style={{ color: "rgba(16,26,46,0.4)" }} className="text-[10px]">
            {timeAgo(notif.at)}
          </span>
          {notif.link && (
            <Link
              to={notif.link}
              className="text-[11px] font-semibold hover:underline"
              style={{ color: COLORS.gold }}
            >
              Angalia →
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        {!notif.read && (
          <button
            onClick={() => onMarkRead(notif.id)}
            className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
            aria-label="Mark as read"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={() => onRemove(notif.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          aria-label="Remove"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, remove, clearAll } =
    useNotifications("user");
  const [filter, setFilter] = useState("all"); // all | unread

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkRead = (id) => markRead(id);
  const handleMarkAllRead = () => markAllRead();
  const handleRemove = (id) => remove(id);

  const handleClearAll = () => {
    if (window.confirm("Una uhakika unataka kufuta taarifa zote?")) {
      clearAll();
    }
  };

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "100%" }} className="w-full p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold">
            Taarifa
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
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-5">
          Taarifa za miamala, ujumbe, na mabadiliko kwenye akaunti yako.
        </p>

        {/* Filters and actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div
              style={{ background: "white", borderColor: COLORS.sandLine }}
              className="flex rounded-full border p-1"
            >
              <button
                onClick={() => setFilter("all")}
                style={{
                  background: filter === "all" ? COLORS.night : "transparent",
                  color: filter === "all" ? COLORS.sand : COLORS.night,
                }}
                className="text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
              >
                Zote ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                style={{
                  background: filter === "unread" ? COLORS.night : "transparent",
                  color: filter === "unread" ? COLORS.sand : COLORS.night,
                }}
                className="text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
              >
                Hazijasomwa ({unreadCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  style={{ color: COLORS.green }}
                >
                  <CheckCheck size={14} />
                  Soma zote
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ color: COLORS.rust }}
              >
                <Trash2 size={14} />
                Futa zote
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="rounded-2xl border-2 border-dashed p-12 text-center bg-white"
          >
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 style={{ color: COLORS.night }} className="font-semibold mb-1">
              {filter === "unread" ? "Hakuna taarifa mpya" : "Hakuna taarifa"}
            </h3>
            <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-sm">
              {filter === "unread"
                ? "Umesoma taarifa zote."
                : "Taarifa zako zitaonekana hapa."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((n) => (
              <NotificationItem
                key={n.id}
                notif={n}
                onMarkRead={handleMarkRead}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
