// ============================================================
// useActivityEvents.js
// FIX: uses useMyListings (not the merged list) and passes
//      currentUserId to useDeals. Recipient/sender classification
//      is now correct for both buyers and sellers.
// NEW: bundle purchases zinaonekana kwenye shughuli.
// ============================================================
import { useMemo } from "react";
import {
  PlusCircle, Rocket, MessagesSquare, Heart, Wallet, CreditCard,
  Package, TrendingUp, Megaphone,
} from "lucide-react";
import { COLORS } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import {
  useMyListings,
  usePublicListings,
} from "../../../config/listingsStore.js";
import { useDeals } from "../../../config/dealsStore.js";
import { useTransactions } from "../../../config/transactionsStore.js";
import { useSavedIds, useSavedSnapshots } from "../../../config/savedStore.js";

// ============================================================
// HELPERS
// ============================================================
// Map transaction type → icon + color kwa bundle purchases
const BUNDLE_TYPE_META = {
  boost: { icon: Rocket, color: COLORS.gold },
  leading: { icon: TrendingUp, color: "#2563EB" },
  ads: { icon: Megaphone, color: COLORS.rust },
  listing: { icon: PlusCircle, color: COLORS.green },
  reservation: { icon: CreditCard, color: COLORS.green },
  success: { icon: Wallet, color: COLORS.green },
  premium: { icon: Package, color: COLORS.gold },
  package: { icon: Package, color: COLORS.gold },
};

function getBundleIcon(tx) {
  // Jaribu `credits` (JSON) kwanza, kisha `type`
  const credits =
    tx.credits && typeof tx.credits === "object" ? tx.credits : {};
  const creditKeys = Object.keys(credits).filter(
    (k) => Number(credits[k]) > 0
  );
  for (const k of creditKeys) {
    if (BUNDLE_TYPE_META[k]) return BUNDLE_TYPE_META[k];
  }
  // Kama `type` ina bundle type
  const meta = BUNDLE_TYPE_META[tx.type];
  if (meta) return meta;
  return { icon: Package, color: COLORS.gold };
}

// ============================================================
// MAIN HOOK
// ============================================================
export function useActivityEvents(side = "seller", onNavigate) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const currentUserId = user?.id || null;
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const myListings = useMyListings();
  const allListings = usePublicListings();
  const deals = useDeals(currentUserId);
  const transactions = useTransactions();
  const savedIds = useSavedIds();
  const savedSnapshots = useSavedSnapshots();

  return useMemo(() => {
    const events = [];

    if (side === "seller") {
      // ── Listings ──────────────────────────────────────────
      myListings.forEach((l) => {
        if (l.postedAt) {
          events.push({
            id: `listing_posted_${l.id}`,
            type: "listing",
            icon: PlusCircle,
            color: COLORS.green,
            title: t(
              `Listing "${l.title}" ilichapishwa`,
              `Listing "${l.title}" was posted`
            ),
            at: l.postedAt,
            onClick: () => onNavigate("listings"),
          });
        }
        if (l.boostExpiresAt && new Date(l.boostExpiresAt) > new Date()) {
          events.push({
            id: `listing_boosted_${l.id}`,
            type: "listing",
            icon: Rocket,
            color: COLORS.gold,
            title: t(
              `Listing "${l.title}" imeboostiwa`,
              `Listing "${l.title}" was boosted`
            ),
            at: l.boostExpiresAt,
            onClick: () => onNavigate("listings"),
          });
        }
      });

      // ── Sales ─────────────────────────────────────────────
      transactions
        .filter((tx) => tx.type === "sale" && tx.status === "completed")
        .forEach((tx) => {
          events.push({
            id: `sale_${tx.id}`,
            type: "payment",
            icon: Wallet,
            color: COLORS.green,
            title: t(
              `Umepokea malipo — "${tx.title || tx.property}"`,
              `You received payment — "${tx.title || tx.property}"`
            ),
            at: tx.at,
            onClick: () => onNavigate("transactions"),
          });
        });
    } else {
      // ── Saved (buyer) ────────────────────────────────────
      const savedListings = allListings.filter((l) =>
        savedIds.includes(l.id)
      );
      savedListings.forEach((l) => {
        const savedAt = savedSnapshots[l.id]?.savedAt || l.postedAt;
        events.push({
          id: `saved_${l.id}`,
          type: "saved",
          icon: Heart,
          color: COLORS.rust,
          title: t(`Umehifadhi "${l.title}"`, `You saved "${l.title}"`),
          at: savedAt,
          onClick: () => onNavigate("saved"),
        });
      });

      // ── Purchases + reservations (buyer) ─────────────────
      transactions
        .filter(
          (tx) =>
            (tx.type === "purchase" || tx.type === "reservation") &&
            tx.status === "completed"
        )
        .forEach((tx) => {
          events.push({
            id: `txn_${tx.id}`,
            type: "payment",
            icon: tx.type === "purchase" ? Wallet : CreditCard,
            color: tx.type === "purchase" ? COLORS.green : COLORS.gold,
            title:
              tx.type === "purchase"
                ? t(
                    `Ununuzi umekamilika — "${tx.title || tx.property}"`,
                    `Purchase completed — "${tx.title || tx.property}"`
                  )
                : t(
                    `Umelipa Reservation Fee — "${tx.title || tx.property}"`,
                    `You paid a Reservation Fee — "${tx.title || tx.property}"`
                  ),
            at: tx.at,
            onClick: () => onNavigate("transactions"),
          });
        });
    }

    // ══════════════════════════════════════════════════════════
    // BUNDLE PURCHASES — zinaonekana kwa seller NA buyer
    // ══════════════════════════════════════════════════════════
    transactions
      .filter(
        (tx) => tx.type === "bundle_purchase" && tx.status === "completed"
      )
      .forEach((tx) => {
        const meta = getBundleIcon(tx);
        const BundleIcon = meta.icon;

        // Credits breakdown (kama ipo)
        const credits =
          tx.credits && typeof tx.credits === "object" ? tx.credits : {};
        const creditsList = Object.entries(credits)
          .filter(([, v]) => Number(v) > 0)
          .map(([k, v]) => `${v}× ${k}`)
          .join(", ");

        const titleSw = creditsList
          ? `Umenunua kifurushi — ${creditsList}`
          : `Umenunua kifurushi — "${tx.title || tx.bundle_name || "Bundle"}"`;
        const titleEn = creditsList
          ? `You bought a bundle — ${creditsList}`
          : `You bought a bundle — "${tx.title || tx.bundle_name || "Bundle"}"`;

        events.push({
          id: `bundle_${tx.id}`,
          type: "payment",
          icon: BundleIcon,
          color: meta.color,
          title: t(titleSw, titleEn),
          at: tx.at,
          onClick: () => onNavigate("bundles"),
        });
      });

    // ── Deals (seller + buyer) ──────────────────────────────
    deals.forEach((d) => {
      events.push({
        id: `deal_${d.id}`,
        type: "deal",
        icon: MessagesSquare,
        color: COLORS.rust,
        title:
          side === "seller"
            ? t(
                `Deal Room mpya — "${d.listingTitle}"`,
                `New Deal Room — "${d.listingTitle}"`
              )
            : t(
                `Deal Room na muuzaji — "${d.listingTitle}"`,
                `Deal Room with seller — "${d.listingTitle}"`
              ),
        at:
          d.updatedAt ||
          d.createdAt ||
          d.messages?.[d.messages.length - 1]?.at ||
          d.messages?.[0]?.at ||
          null, // skip fabricated timestamps
        onClick: () => onNavigate("deals"),
      });
    });

    return events
      .filter((e) => e.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [
    side,
    myListings,
    allListings,
    savedIds,
    savedSnapshots,
    deals,
    transactions,
    lang,
    onNavigate,
    currentUserId,
  ]);
}