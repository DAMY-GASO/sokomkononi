// ============================================================
// UndoToast.jsx — Undo window kwa items zilizofutwa
//
// Marekebisho:
//  ✅ Inasajili fallback handler kwa `listing` — inaruhusu undo
//     HATA baada ya refresh (memory callbacks zinapotea).
//  ✅ Bulk undo: item moja yenye `itemIds[]` inaonyeshwa kama
//     toast moja ("Matangazo 5 yamefutwa").
//  ✅ Toast ya "Kimerejeshwa" inaonekana TU kama `restoreUndo`
//     inarudisha `{ ok: true }` (sio "success ya uongo").
//  ✅ Toast ya kosa inaonyesha sababu halisi (`NO_HANDLER`,
//     `RESTORE_FAILED`, `NOT_FOUND`).
//  ✅ Kila undo item inaonyeshwa mara moja (kwa `undoId`).
//  ✅ Timer ya auto-expire inasafisha toast yenyewe.
// ============================================================
import React, { useEffect, useRef } from "react";
import { useToast } from "./Toast.jsx";
import {
  useUndo,
  restoreUndo,
  registerRestoreHandlers,
  secondsRemaining,
} from "../config/undoStore.js";
import { restoreListingAsync } from "../config/listingsStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";

// ✅ Fallback handler kwa listings — inaruhusu undo HATA baada ya refresh
// (memory callbacks zinapotea, lakini code hii inabaki).
registerRestoreHandlers({
  listing: async (itemOrIds) => {
    const ids = Array.isArray(itemOrIds)
      ? itemOrIds
      : itemOrIds != null
        ? [itemOrIds]
        : [];
    if (ids.length === 0) {
      return { ok: false, error: new Error("No listing id") };
    }

    // Rejesha sequentially ili tuepuke race conditions kwenye backend
    const errors = [];
    for (const id of ids) {
      try {
        const res = await restoreListingAsync(id);
        if (res && res.ok === false) {
          errors.push({ id, error: res.error });
        }
      } catch (err) {
        errors.push({ id, error: err });
      }
    }

    if (errors.length > 0) {
      return {
        ok: false,
        error:
          errors[0].error ||
          new Error(
            `${errors.length} listing(s) failed to restore`
          ),
      };
    }
    return { ok: true };
  },
});

export default function UndoToast() {
  const { lang } = useLanguage();
  const toast = useToast();
  const { items } = useUndo();
  const shownRef = useRef(new Set());
  const shown = shownRef.current;

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // Onyesha toast kwa kila undo item mpya
  useEffect(() => {
    // Drop refs to undo items that are no longer in the list.
    const live = new Set(items.map((i) => i.undoId));
    for (const k of Array.from(shown)) if (!live.has(k)) shown.delete(k);

    items.forEach((item) => {
      if (shown.has(item.undoId)) return;

      const seconds = secondsRemaining(item.expiresAt);
      // duration 0 ingeacha toast milele; muda ukiisha, usionyeshe
      if (!(seconds > 0)) return;

      const ids = item.itemIds || (item.itemId != null ? [item.itemId] : []);
      const count = ids.length;
      const title = item.title || "";
      const isBulk = count > 1;

      const defaultMessage = isBulk
        ? t(
            `Matangazo ${count} yamefutwa. Unaweza kuyarejesha.`,
            `${count} listings deleted. You can undo.`
          )
        : t(
            `"${title}" imefutwa. Unaweza kuirejesha.`,
            `"${title}" deleted. You can undo.`
          );
      const message = item.message || defaultMessage;

      const toastId = toast.push(message, {
        type: "info",
        duration: seconds * 1000,
        title: isBulk
          ? t(`${count} zimefutwa`, `${count} deleted`)
          : t("Kimefutwa", "Deleted"),
        action: {
          label: t("Rejesha", "Undo"),
          onClick: async () => {
            // Futa toast yenyewe kwanza ili mtumiaji asione "inajaribu" mara mbili
            try {
              toast.dismiss(toastId);
            } catch {
              /* noop */
            }

            const res = await restoreUndo(item.undoId);

            if (res.ok) {
              toast.success(
                isBulk
                  ? t(
                      `Matangazo ${count} yamerejeshwa.`,
                      `${count} listings restored.`
                    )
                  : t("Kimerejeshwa", "Restored"),
                { duration: 2000 }
              );
            } else {
              // Onyesha sababu halisi
              const code = res.code || "RESTORE_FAILED";
              let msg;
              if (code === "NO_HANDLER") {
                msg = t(
                  "Ukurasa ulirefresh — nenda Mali Zangu na ujaribu tena.",
                  "Page was refreshed — go to My Listings and try again."
                );
              } else if (code === "NOT_FOUND") {
                msg = t(
                  "Muda wa kurejesha umeisha.",
                  "The undo window has expired."
                );
              } else {
                msg =
                  res.error?.data?.detail ||
                  res.error?.message ||
                  t("Imeshindikana kurejesha.", "Restore failed.");
              }
              toast.error(msg, { duration: 5000 });
            }
          },
        },
      });

      shown.add(item.undoId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, lang]);

  return null;
}