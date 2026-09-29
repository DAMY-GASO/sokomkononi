// ============================================================
// useActivityEvents.js
// FIX: uses useMyListings (not the merged list) and passes
//      currentUserId to useDeals. Recipient/sender classification
//      is now correct for both buyers and sellers.
// ============================================================
import { useMemo } from "react";
import {
  PlusCircle, Rocket, MessagesSquare, Heart, Wallet, CreditCard,
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
      myListings.forEach((l) => {
        if (l.postedAt) {
          events.push({
            id: `listing_posted_${l.id}`,
            type: "listing",
            icon: PlusCircle,
            color: COLORS.green,
            title: t(`Listing "${l.title}" ilichapishwa`, `Listing "${l.title}" was posted`),
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
            title: t(`Listing "${l.title}" imeboostiwa`, `Listing "${l.title}" was boosted`),
            at: l.boostExpiresAt,
            onClick: () => onNavigate("listings"),
          });
        }
      });

      transactions
        .filter((tx) => tx.type === "sale" && tx.status === "completed")
        .forEach((tx) => {
          events.push({
            id: `sale_${tx.id}`,
            type: "payment",
            icon: Wallet,
            color: COLORS.green,
            title: t(`Umepokea malipo — "${tx.title || tx.property}"`, `You received payment — "${tx.title || tx.property}"`),
            at: tx.at,
            onClick: () => onNavigate("transactions"),
          });
        });
    } else {
      const savedListings = allListings.filter((l) => savedIds.includes(l.id));
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

      transactions
        .filter((tx) =>
          (tx.type === "purchase" || tx.type === "reservation") &&
          tx.status === "completed")
        .forEach((tx) => {
          events.push({
            id: `txn_${tx.id}`,
            type: "payment",
            icon: tx.type === "purchase" ? Wallet : CreditCard,
            color: tx.type === "purchase" ? COLORS.green : COLORS.gold,
            title: tx.type === "purchase"
              ? t(`Ununuzi umekamilika — "${tx.title || tx.property}"`, `Purchase completed — "${tx.title || tx.property}"`)
              : t(`Umelipa Reservation Fee — "${tx.title || tx.property}"`, `You paid a Reservation Fee — "${tx.title || tx.property}"`),
            at: tx.at,
            onClick: () => onNavigate("transactions"),
          });
        });
    }

    deals.forEach((d) => {
      events.push({
        id: `deal_${d.id}`,
        type: "deal",
        icon: MessagesSquare,
        color: COLORS.rust,
        title: side === "seller"
          ? t(`Deal Room mpya — "${d.listingTitle}"`, `New Deal Room — "${d.listingTitle}"`)
          : t(`Deal Room na muuzaji — "${d.listingTitle}"`, `Deal Room with seller — "${d.listingTitle}"`),
        at: d.messages?.[0]?.at || d.updatedAt || new Date().toISOString(),
        onClick: () => onNavigate("deals"),
      });
    });

    return events
      .filter((e) => e.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [
    side, myListings, allListings, savedIds, savedSnapshots,
    deals, transactions, lang, onNavigate, currentUserId,
  ]);
}
