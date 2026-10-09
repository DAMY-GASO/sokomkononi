// ============================================================
// useActivityEvents.js
// FIX: uses useMyListings (not the merged list) and passes
//      currentUserId to useDeals. Recipient/sender classification
//      is now correct for both buyers and sellers.
// NEW: transactions kutoka transactionLifecycleStore (sale/purchase).
// NEW: bundle purchases zinaonekana kwenye shughuli.
// NEW: simulations zimeondolewa (hakuna "listing posted" fake events).
// ============================================================
import { useMemo } from "react";
import {
  PlusCircle, Rocket, MessagesSquare, Heart, Wallet, CreditCard,
  Package, TrendingUp, Megaphone, AlertTriangle, XCircle,
} from "lucide-react";
import { COLORS } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import {
  useMyListings,
  usePublicListings,
} from "../../../config/listingsStore.js";
import { useDeals } from "../../../config/dealsStore.js";
import { useTransactions as useFeeTransactions } from "../../../config/transactionsStore.js";
import {
  useTransactions as useLifecycleTransactions,
  TX_STATUS,
} from "../../../config/transactionLifecycleStore.js";
import {
  useSavedIds,
  useSavedSnapshots,
} from "../../../config/savedStore.js";

// ============================================================
// HELPERS
// ============================================================
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
  const credits =
    tx.credits && typeof tx.credits === "object" ? tx.credits : {};
  const creditKeys = Object.keys(credits).filter(
    (k) => Number(credits[k]) > 0
  );
  for (const k of creditKeys) {
    if (BUNDLE_TYPE_META[k]) return BUNDLE_TYPE_META[k];
  }
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
  const feeTransactions = useFeeTransactions();
  const lifecycleTransactions = useLifecycleTransactions();
  const savedIds = useSavedIds();
  const savedSnapshots = useSavedSnapshots();

  return useMemo(() => {
    const events = [];

    if (side === "seller") {
      // ── Listing boosts (real events only) ─────────────────
      // Listing "posted" events zimeondolewa — hazina maana kwenye timeline
      // (ni action, sio event ya mazingira).
      myListings.forEach((l) => {
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
            at: l.boostedUntil || l.boostExpiresAt,
            onClick: () => onNavigate("listings"),
          });
        }
      });

      // ── Sale events (kutoka lifecycle transactions) ───────
      lifecycleTransactions
        .filter(
          (tx) =>
            tx.status === TX_STATUS.COMPLETED &&
            tx.sellerId === currentUserId
        )
        .forEach((tx) => {
          events.push({
            id: `sale_${tx.id}`,
            type: "payment",
            icon: Wallet,
            color: COLORS.green,
            title: t(
              `Umepokea malipo — "${tx.listingTitle}"`,
              `You received payment — "${tx.listingTitle}"`
            ),
            at: tx.confirmedAt || tx.updatedAt || tx.createdAt,
            onClick: () => onNavigate("transactions"),
          });
        });
    } else {
      // ── Saved (buyer) ─────────────────────────────────────
      const savedListings = allListings.filter((l) =>
        savedIds.includes(l.id)
      );
      savedListings.forEach((l) => {
        const savedAt = savedSnapshots[l.id]?.savedAt || l.createdAt || l.postedAt;
        if (!savedAt) return; // skip kama haina timestamp
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

      // ── Purchase (kutoka lifecycle transactions) ──────────
      lifecycleTransactions
        .filter(
          (tx) =>
            tx.status === TX_STATUS.COMPLETED &&
            tx.buyerId === currentUserId
        )
        .forEach((tx) => {
          events.push({
            id: `purchase_${tx.id}`,
            type: "payment",
            icon: Wallet,
            color: COLORS.green,
            title: t(
              `Ununuzi umekamilika — "${tx.listingTitle}"`,
              `Purchase completed — "${tx.listingTitle}"`
            ),
            at: tx.confirmedAt || tx.updatedAt || tx.createdAt,
            onClick: () => onNavigate("transactions"),
          });
        });
    }

    // ══════════════════════════════════════════════════════════
    // DEALS — onyesha tu zenye activity halisi
    // (completed, disputed, cancelled, au zenye messages za hivi karibuni)
    // ══════════════════════════════════════════════════════════
    deals.forEach((d) => {
      const isCompleted = d.status === "completed";
      const isDisputed = d.status === "disputed";
      const isCancelled = d.status === "cancelled";
      const hasRecentMessages =
        d.messages?.length > 0 &&
        d.updatedAt &&
        new Date(d.updatedAt).getTime() >
          Date.now() - 30 * 24 * 60 * 60 * 1000; // siku 30

      // Onyesha tu kama ni "significant" event
      if (!isCompleted && !isDisputed && !isCancelled && !hasRecentMessages) {
        return;
      }

      let icon = MessagesSquare;
      let color = COLORS.rust;
      let titleSw = "";
      let titleEn = "";
      let at = d.updatedAt || d.createdAt;

      if (isCompleted) {
        icon = Wallet;
        color = COLORS.green;
        titleSw = `Deal imekamilika — "${d.listingTitle}"`;
        titleEn = `Deal completed — "${d.listingTitle}"`;
        at = d.agreedAt || d.updatedAt;
      } else if (isDisputed) {
        icon = AlertTriangle;
        color = COLORS.rust;
        titleSw = `Mgogoro kwenye deal — "${d.listingTitle}"`;
        titleEn = `Dispute in deal — "${d.listingTitle}"`;
      } else if (isCancelled) {
        icon = XCircle;
        color = COLORS.night;
        titleSw = `Deal imeghairiwa — "${d.listingTitle}"`;
        titleEn = `Deal cancelled — "${d.listingTitle}"`;
      } else if (hasRecentMessages) {
        icon = MessagesSquare;
        color = COLORS.rust;
        titleSw =
          side === "seller"
            ? `Ujumbe mpya kutoka kwa mnunuzi — "${d.listingTitle}"`
            : `Ujumbe mpya kutoka kwa muuzaji — "${d.listingTitle}"`;
        titleEn =
          side === "seller"
            ? `New message from buyer — "${d.listingTitle}"`
            : `New message from seller — "${d.listingTitle}"`;
      }

      if (!titleSw) return;

      events.push({
        id: `deal_${d.id}_${d.status}`,
        type: "deal",
        icon,
        color,
        title: t(titleSw, titleEn),
        at,
        onClick: () => onNavigate("deals"),
      });
    });

    // ══════════════════════════════════════════════════════════
    // FEE PAYMENTS — listing_fee, boost, reservation
    // ══════════════════════════════════════════════════════════
    feeTransactions
      .filter((tx) => tx.status === "completed")
      .forEach((tx) => {
        const meta = {
          listing_fee: {
            icon: PlusCircle,
            color: COLORS.gold,
            titleSw: `Umefuta ada ya kuchapisha — "${tx.title || tx.property}"`,
            titleEn: `You paid listing fee — "${tx.title || tx.property}"`,
          },
          boost: {
            icon: Rocket,
            color: COLORS.gold,
            titleSw: `Umefuta ada ya boost — "${tx.title || tx.property}"`,
            titleEn: `You paid for boost — "${tx.title || tx.property}"`,
          },
          reservation: {
            icon: CreditCard,
            color: COLORS.green,
            titleSw: `Umefuta Reservation Fee — "${tx.title || tx.property}"`,
            titleEn: `You paid Reservation Fee — "${tx.title || tx.property}"`,
          },
          leading: {
            icon: TrendingUp,
            color: "#2563EB",
            titleSw: `Umefuta ada ya leading — "${tx.title || tx.property}"`,
            titleEn: `You paid leading fee — "${tx.title || tx.property}"`,
          },
          advertisement: {
            icon: Megaphone,
            color: COLORS.rust,
            titleSw: `Umefuta ada ya matangazo — "${tx.title || tx.property}"`,
            titleEn: `You paid advertisement fee — "${tx.title || tx.property}"`,
          },
        }[tx.type];

        if (!meta) return; // skip "sale" (tunaona kutoka lifecycle)
        const Icon = meta.icon;

        events.push({
          id: `fee_${tx.type}_${tx.id}`,
          type: "payment",
          icon: Icon,
          color: meta.color,
          title: t(meta.titleSw, meta.titleEn),
          at: tx.at || tx.paidAt,
          onClick: () => onNavigate("transactions"),
        });
      });

    // ══════════════════════════════════════════════════════════
    // BUNDLE PURCHASES
    // ══════════════════════════════════════════════════════════
    feeTransactions
      .filter(
        (tx) => tx.type === "bundle_purchase" && tx.status === "completed"
      )
      .forEach((tx) => {
        const meta = getBundleIcon(tx);
        const BundleIcon = meta.icon;

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
          at: tx.at || tx.paidAt,
          onClick: () => onNavigate("bundles"),
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
    feeTransactions,
    lifecycleTransactions,
    lang,
    onNavigate,
    currentUserId,
  ]);
}