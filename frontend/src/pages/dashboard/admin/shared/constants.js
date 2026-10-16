// src/pages/dashboard/admin/shared/constants.js
import {
  AlertTriangle, BarChart3, Bell, BellRing, BookOpen, Calendar,
  CheckCircle2, Clock3, CreditCard, Eye, FileText, Flag, HandCoins,
  Headphones, History, Home, LayoutDashboard, Lock, Megaphone,
  MessagesSquare, Package, Receipt, Rocket, Search, Settings as SettingsIcon,
  ShieldCheck, Smartphone, Sparkles, Store, Tags, Trash2, User,
  UserCheck, Users, Wallet, XCircle,
} from "lucide-react";

export { getCategory, getCategoryIcon, getCategoryLabel } from "../../../../config/categoriesStore.js";

import { COLORS as _COLORS, FONTS as _FONTS, timeAgo as sharedTimeAgo, formatTZS as sharedFormatTZS } from "../../../dashboard/components/shared.js";
export const COLORS = _COLORS;
export const FONTS = _FONTS;

export const SURFACE = {
  card: "bg-card border-[color:rgb(var(--c-hairline))]",
  page: "bg-page",
  soft: "bg-[color:rgb(var(--c-page))]",
  input: "bg-[color:rgb(var(--c-card))] border border-[color:rgb(var(--c-hairline))] text-primary placeholder:text-muted focus:border-[color:rgb(var(--c-gold))] focus:ring-2 focus:ring-[color:rgb(var(--c-gold)/0.15)] outline-none transition-colors",
  textPrimary: "text-primary",
  textSecondary: "text-secondary",
  textMuted: "text-muted",
};

export const NAV = [
  { key: "overview",     label: { sw: "Muhtasari & Uchanganuzi",   en: "Overview & Analytics" },     icon: LayoutDashboard },
  { key: "users",        label: { sw: "Usimamizi wa Watumiaji",    en: "User Management" },           icon: Users },
  { key: "moderation",   label: { sw: "Uidhinishaji wa Mali",      en: "Listing Moderation" },        icon: ShieldCheck },
  { key: "verification", label: { sw: "Uthibitisho",               en: "Verification" },              icon: UserCheck },
  { key: "deals",        label: { sw: "Vyumba vya majadiliano",     en: "Deal Rooms" },     icon: MessagesSquare },
  { key: "revenue",      label: { sw: "Mapato & Fedha",            en: "Revenue & Financial" },       icon: Wallet },
  { key: "bundles",      label: { sw: "Vifurushi vya Huduma",      en: "Service Bundles" },           icon: Package },
  { key: "promotions",   label: { sw: "Matangazo & Kampeni",       en: "Promotions & Campaigns" },    icon: Sparkles },
  { key: "refunds",      label: { sw: "Marejesho",                   en: "Refunds" },                   icon: Receipt },   // ⬅️ MPYA
  { key: "reports",      label: { sw: "Ripoti & Uchanganuzi",      en: "Reports & Analytics" },       icon: BarChart3 },
  { key: "support",      label: { sw: "Huduma kwa Wateja",         en: "Customer Care" },             icon: Headphones },
  { key: "content",      label: { sw: "Usimamizi wa Maudhui",      en: "Content Management" },        icon: FileText },
  { key: "categories",   label: { sw: "Kategoria",                 en: "Categories" },                icon: Tags },
  { key: "audit",        label: { sw: "Kumbukumbu za Matendo",     en: "Audit Logs" },                icon: History },
  { key: "trash",        label: { sw: "Recycle Bin",               en: "Recycle Bin" },               icon: Trash2 },
  { key: "system",       label: { sw: "Mipangilio ya Mfumo",       en: "System Settings" },           icon: SettingsIcon },
  { key: "staff",        label: { sw: "Roles & Wafanyakazi",       en: "Roles & Staff" },             icon: Lock },
  { key: "profile",      label: { sw: "Wasifu Wangu",              en: "My Profile" },                icon: User },
];

export const ADMIN_NOTIFICATION_ICONS = {
  GENERAL: Bell, LISTING_CREATED: Home, LISTING_APPROVED: CheckCircle2, LISTING_REJECTED: AlertTriangle,
  LISTING_DELETED: Trash2, LISTING_RESTORED: Home, ACCOUNT_DELETED: AlertTriangle, ACCOUNT_RESTORED: CheckCircle2,
  NEW_OFFER: HandCoins, OFFER_COUNTERED: HandCoins, OFFER_ACCEPTED: CheckCircle2, TRANSACTION_CREATED: HandCoins,
  RESERVATION_CREATED: Clock3, RESERVATION_PAID: Wallet, RESERVATION_EXPIRING: Clock3, RESERVATION_EXPIRED: XCircle,
  INSPECTION_STARTED: Eye, INSPECTION_COMPLETED: CheckCircle2, BUYER_DECISION: FileText, PAYMENT_PROOF_UPLOADED: CreditCard,
  PAYMENT_CONFIRMED: Wallet, TRANSACTION_COMPLETED: CheckCircle2, TRANSACTION_CANCELLED: XCircle, WAITING_LIST_JOINED: Users,
  WAITING_LIST_AVAILABLE: BellRing, BOOST_ACTIVATED: Rocket,
};

export const timeAgo = sharedTimeAgo;
export const formatTZS = sharedFormatTZS;
export { resolveSender } from "../../../dashboard/components/shared.js";