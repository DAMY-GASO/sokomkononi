import { useEffect, useRef } from "react";
import {
  subscribeToPush,
  subscriptionToJSON,
} from "../api/pushSubscription";
import { subscribePush } from "../api/pushApi";

/**
 * Hook ya kusajili push subscription mara moja mtumiaji akiingia.
 * Inafanya kazi kimya kimya — haizuii UI.
 */
export function usePushSubscription(userId) {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (registeredRef.current) return;
    registeredRef.current = true;

    (async () => {
      try {
        const sub = await subscribeToPush();
        const json = subscriptionToJSON(sub);
        if (json) {
          await subscribePush(json);
          console.log("[push] subscribed");
        }
      } catch (err) {
        console.warn("[push] subscribe failed:", err);
      }
    })();
  }, [userId]);
}