// ============================================================
// UndoToast.jsx — Undo window kwa items zilizofutwa
//
// Inasikiliza `undoStore` na kuonyesha toast yenye "Rejesha"
// button kwa dakika 5 (au kadri ya muda uliowekwa).
// ============================================================
import React, { useEffect, useRef } from "react";
import { useToast } from "./Toast.jsx";
import {
  useUndo,
  restoreUndo,
  secondsRemaining,
} from "../config/undoStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";

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
      const message =
        item.message ||
        t(
          `"${item.title}" imefutwa. Unaweza kuirejesha.`,
          `"${item.title}" deleted. You can undo.`
        );

      toast.push(message, {
        type: "info",
        duration: seconds * 1000,
        title: t("Kimefutwa", "Deleted"),
        action: {
          label: t("Rejesha", "Undo"),
          onClick: async () => {
            const res = await restoreUndo(item.undoId);
            if (res.ok) {
              toast.success(t("Kimerejeshwa", "Restored"), {
                duration: 2000,
              });
            } else {
              toast.error(
                res.error?.message || t("Imeshindikana", "Failed"),
                { duration: 3000 }
              );
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