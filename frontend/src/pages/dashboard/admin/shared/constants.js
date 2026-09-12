// ============================================================
// constants.js
// Shared constants + helpers kwa Admin dashboard.
//
// Hii ni chanzo kimoja cha ukweli kwa:
//   - COLORS (brand tokens)
//   - FONTS (brand fonts)
//   - NAV (sidebar navigation)
//   - ADMIN_NOTIFICATION_ICONS (icons za notifications)
//   - timeAgo() (kwa notifications)
//   - formatTZS() (kwa pesa)
//
// Sections zote (Overview, Users, Moderation, Deals, Revenue,
// SystemSettings) zita-import kutoka hapa.
// ============================================================

import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  MessagesSquare,
  Wallet,
  Settings as SettingsIcon,
  Home,
  Flag,
  CreditCard,
  AlertTriangle,
  Rocket,
  Search,
  Smartphone,
} from "lucide-react";
import { NOTIFICATION_EVENTS } from "../../../../config/notificationsStore.js";

export const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  nightSoft: "#1B2740",
  sandLine: "#E6E2D6",
};

export const FONTS = {
  display: "'Fraunces', serif",
  body: "'Manrope', sans-serif",
};

export const NAV = [
  { key: "overview", label: { sw: "Muhtasari & Uchanganuzi", en: "Overview & Analytics" }, icon: LayoutDashboard },
  { key: "users", label: { sw: "Usimamizi wa Watumiaji", en: "User Management" }, icon: Users },
  { key: "moderation", label: { sw: "Uidhinishaji wa Mali & Matangazo", en: "Listing & Ads Moderation" }, icon: ShieldCheck },
  { key: "deals", label: { sw: "Deal Rooms & Migogoro", en: "Deal Rooms & Disputes" }, icon: MessagesSquare },
  { key: "revenue", label: { sw: "Mapato & Fedha", en: "Revenue & Financial Settings" }, icon: Wallet },
  { key: "system", label: { sw: "Mipangilio ya Mfumo", en: "System Settings" }, icon: SettingsIcon },
];

export const ADMIN_NOTIFICATION_ICONS = {
  listing_pending: Home,
  dispute: Flag,
  payment_issue: CreditCard,
  fraud_flag: AlertTriangle,
  boost: Rocket,
  leading: Search,
  ads: Smartphone,
  listing_fee: CreditCard,
  [NOTIFICATION_EVENTS.DISPUTE_RESOLVED]: Flag,
  [NOTIFICATION_EVENTS.PAYMENT_PROOF_SUBMITTED]: CreditCard,
};

export function timeAgo(dateStr, lang = "sw") {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return lang === "sw" ? "Sasa hivi" : "Just now";
  if (mins < 60) return lang === "sw" ? `Dakika ${mins} zilizopita` : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "sw" ? (hours === 1 ? "Saa 1 iliyopita" : `Masaa ${hours} yaliyopita`) : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return lang === "sw" ? "Jana" : "Yesterday";
  return lang === "sw" ? `Siku ${days} zilizopita` : `${days} days ago`;
}

export function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}
