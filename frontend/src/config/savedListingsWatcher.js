// ============================================================
// savedListingsWatcher.js
// Inafuatilia saved listings na kutuma notifications pale
// zinapobadilika (bei, status).
//
// Inaitwa na DashboardShell kwenye mount na kila dakika 2.
// ============================================================

import { getSnapshots, removeSnapshot } from "./savedStore.js";
import { getListings } from "./listingsStore.js";
import { pushNotification } from "./notificationsStore.js";

function fmtTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

/**
 * Angalia saved listings zote na linganisha na snapshots.
 * Tuma notifications kwa mabadiliko:
 *   - Bei imebadilika
 *   - Status → sold
 *   - Status → reserved
 *   - Listing imefutwa
 */
export function checkSavedListingsChanges() {
  const snapshots = getSnapshots();
  const listings = getListings();
  const snapshotsToRemove = [];

  Object.entries(snapshots).forEach(([id, snap]) => {
    const current = listings.find((l) => l.id === id);

    // Listing imefutwa
    if (!current) {
      pushNotification({
        audience: "user",
        type: "listing_released",
        title: {
          sw: `Listing "${snap.title || id}" haipo tena`,
          en: `Listing "${snap.title || id}" is no longer available`,
        },
        body: {
          sw: "Muuzaji ameondoa listing uliyokuwa umeihifadhi.",
          en: "The seller has removed the listing you saved.",
        },
        link: "/dashboard/saved",
        meta: { listingId: id, changeType: "removed" },
      });
      snapshotsToRemove.push(id);
      return;
    }

    // Bei imebadilika
    if (
      typeof current.price === "number" &&
      typeof snap.price === "number" &&
      current.price !== snap.price
    ) {
      const direction = current.price > snap.price ? "up" : "down";
      const directionText =
        direction === "up"
          ? { sw: "imepanda", en: "increased" }
          : { sw: "imepungua", en: "decreased" };

      pushNotification({
        audience: "user",
        type: "listing_released",
        title: {
          sw: `Bei ya "${current.title}" imebadilika`,
          en: `Price changed for "${current.title}"`,
        },
        body: {
          sw: `Bei ${directionText.sw} kutoka ${fmtTZS(snap.price)} hadi ${fmtTZS(current.price)}.`,
          en: `Price ${directionText.en} from ${fmtTZS(snap.price)} to ${fmtTZS(current.price)}.`,
        },
        link: `/mali/${id}`,
        meta: {
          listingId: id,
          changeType: "price",
          oldPrice: snap.price,
          newPrice: current.price,
        },
      });
    }

    // Status imebadilika
    if (current.status !== snap.status) {
      // → sold
      if (current.status === "sold" && snap.status !== "sold") {
        pushNotification({
          audience: "user",
          type: "listing_released",
          title: {
            sw: `"${current.title}" imeuzwa`,
            en: `"${current.title}" has been sold`,
          },
          body: {
            sw: "Listing uliyoihifadhi imeuzwa. Angalia listings nyingine zinazofanana.",
            en: "The listing you saved has been sold. Check other similar listings.",
          },
          link: "/dashboard/browse",
          meta: { listingId: id, changeType: "sold" },
        });
      }
      // → reserved
      else if (current.status === "reserved" && snap.status !== "reserved") {
        pushNotification({
          audience: "user",
          type: "listing_released",
          title: {
            sw: `"${current.title}" imehifadhiwa`,
            en: `"${current.title}" is now reserved`,
          },
          body: {
            sw: "Listing uliyoihifadhi sasa ina reservation. Unaweza kujiunga na waiting list.",
            en: "The listing you saved is now reserved. You can join the waiting list.",
          },
          link: `/mali/${id}`,
          meta: { listingId: id, changeType: "reserved" },
        });
      }
      // → live (kutoka reserved/sold — kawaida haiwezekani, lakini safety)
      else if (current.status === "live" && snap.status !== "live") {
        pushNotification({
          audience: "user",
          type: "listing_released",
          title: {
            sw: `"${current.title}" inapatikana tena`,
            en: `"${current.title}" is available again`,
          },
          body: {
            sw: "Listing uliyoihifadhi imerudi kuwa inapatikana. Harakisha kabla ya mwingine!",
            en: "The listing you saved is available again. Hurry before someone else takes it!",
          },
          link: `/mali/${id}`,
          meta: { listingId: id, changeType: "released" },
        });
      }
    }

    // Sasisha snapshot ili tusirudie notification
    if (current.price !== snap.price || current.status !== snap.status) {
      saveSnapshotSilently(id, {
        price: current.price,
        status: current.status,
        title: current.title,
        savedAt: snap.savedAt,
      });
    }
  });

  // Ondoa snapshots za listings zilizofutwa
  snapshotsToRemove.forEach((id) => removeSnapshot(id));
}

// Helper: sasisha snapshot bila ku-trigger event (kwa watcher)
function saveSnapshotSilently(id, snapshot) {
  try {
    const STORAGE_KEY = "sokomkononi_saved_snapshots_v1";
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const snapshots = raw ? JSON.parse(raw) : {};
    snapshots[id] = snapshot;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
    // Hatu-trigger event ili kuepuka loops
  } catch {
    // ignore
  }
}
