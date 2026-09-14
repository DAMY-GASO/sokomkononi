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
//   - getCategory() / getCategoryIcon() — re-export kutoka categoriesStore
//
// Sections zote zinatumia NAV hii.
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
  UserCheck,
  History,
  Headphones,
  FileText,
  BarChart3,
  Sparkles,
  Lock,
  Store,
  BookOpen,
  Megaphone,
  Calendar,
  Package,
} from "lucide-react";
import { NOTIFICATION_EVENTS } from "../../../../config/notificationsStore.js";

// ============================================================
// RE-EXPORTS — kwa urahisi wa sections
// ============================================================
export {
  getCategory,
  getCategoryIcon,
  getCategoryLabel,
} from "../../../../config/categoriesStore.js";

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

// ============================================================
// NAV — sidebar navigation (sections zote 14)
// ============================================================
export const NAV = [
  // Core
  {
    key: "overview",
    label: { sw: "Muhtasari & Uchanganuzi", en: "Overview & Analytics" },
    icon: LayoutDashboard,
  },
  {
    key: "users",
    label: { sw: "Usimamizi wa Watumiaji", en: "User Management" },
    icon: Users,
  },
  {
    key: "moderation",
    label: { sw: "Uidhinishaji wa Mali", en: "Listing Moderation" },
    icon: ShieldCheck,
  },
  {
    key: "verification",
    label: { sw: "Uthibitisho", en: "Verification" },
    icon: UserCheck,
  },
  {
    key: "deals",
    label: { sw: "Deal Rooms & Migogoro", en: "Deal Rooms & Disputes" },
    icon: MessagesSquare,
  },
  {
    key: "revenue",
    label: { sw: "Mapato & Fedha", en: "Revenue & Financial" },
    icon: Wallet,
  },
  {
    key: "bundles",
    label: { sw: "Vifurushi vya Huduma", en: "Service Bundles" },
    icon: Package,
  },
  {
    key: "promotions",
    label: { sw: "Matangazo & Kampeni", en: "Promotions & Campaigns" },
    icon: Sparkles,
  },
  {
    key: "reports",
    label: { sw: "Ripoti & Uchanganuzi", en: "Reports & Analytics" },
    icon: BarChart3,
  },

  // Support & Content
  {
    key: "support",
    label: { sw: "Huduma kwa Wateja", en: "Customer Care" },
    icon: Headphones,
  },
  {
    key: "content",
    label: { sw: "Usimamizi wa Maudhui", en: "Content Management" },
    icon: FileText,
  },

  // System
  {
    key: "audit",
    label: { sw: "Kumbukumbu za Matendo", en: "Audit Logs" },
    icon: History,
  },
  {
    key: "system",
    label: { sw: "Mipangilio ya Mfumo", en: "System Settings" },
    icon: SettingsIcon,
  },
  {
    key: "staff",
    label: { sw: "Roles & Wafanyakazi", en: "Roles & Staff" },
    icon: Lock,
  },
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
  if (hours < 24)
    return lang === "sw"
      ? hours === 1
        ? "Saa 1 iliyopita"
        : `Masaa ${hours} yaliyopita`
      : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return lang === "sw" ? "Jana" : "Yesterday";
  return lang === "sw" ? `Siku ${days} zilizopita` : `${days} days ago`;
}

export function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}
