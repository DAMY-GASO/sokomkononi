import {
  AlertTriangle,
  BarChart3,
  Bell,
  BellRing,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  Flag,
  HandCoins,
  Headphones,
  History,
  Home,
  LayoutDashboard,
  Lock,
  Megaphone,
  MessagesSquare,
  Package,
  Rocket,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

// ============================================================
// RE-EXPORTS — kwa urahisi wa sections
// ============================================================
export {
  getCategory,
  getCategoryIcon,
  getCategoryLabel,
} from "../../../../config/categoriesStore.js";

// ============================================================
// BRAND TOKENS — chanzo kimoja: shared.js (dashboard/components)
// COLORS na FONTS haziandikwi tena hapa; zinatoka moja kwa moja
// kwenye chanzo halisi ili zisitofautiane kamwe.
// ============================================================
export { COLORS, FONTS } from "../../../dashboard/components/shared.js";

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
  
  { key: "trash", label: { sw: "Trash", en: "Trash" }, icon: Trash2 },
  
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
  // Backend NotificationTypeEnum (from OpenAPI spec)
  GENERAL: Bell,
  LISTING_CREATED: Home,
  LISTING_APPROVED: CheckCircle2,
  LISTING_REJECTED: AlertTriangle,
  LISTING_DELETED: Trash2,
  LISTING_RESTORED: Home,
  ACCOUNT_DELETED: AlertTriangle,
  ACCOUNT_RESTORED: CheckCircle2,
  NEW_OFFER: HandCoins,
  OFFER_COUNTERED: HandCoins,
  OFFER_ACCEPTED: CheckCircle2,
  TRANSACTION_CREATED: HandCoins,
  RESERVATION_CREATED: Clock3,
  RESERVATION_PAID: Wallet,
  RESERVATION_EXPIRING: Clock3,
  RESERVATION_EXPIRED: XCircle,
  INSPECTION_STARTED: Eye,
  INSPECTION_COMPLETED: CheckCircle2,
  BUYER_DECISION: FileText,
  PAYMENT_PROOF_UPLOADED: CreditCard,
  PAYMENT_CONFIRMED: Wallet,
  TRANSACTION_COMPLETED: CheckCircle2,
  TRANSACTION_CANCELLED: XCircle,
  WAITING_LIST_JOINED: Users,
  WAITING_LIST_AVAILABLE: BellRing,
  BOOST_ACTIVATED: Rocket,
};

export function timeAgo(dateStr, lang = "sw") {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return lang === "sw" ? "Sasa hivi" : "Just now";
  if (mins < 60)
    return lang === "sw" ? `Dakika ${mins} zilizopita` : `${mins} min ago`;
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
