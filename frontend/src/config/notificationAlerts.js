// ============================================================
// notificationAlerts.js  →  weka kwenye src/config/
// Arifa za kivinjari + sauti + mtetemo (frontend pekee).
//
// MUHIMU: Hii inafanya kazi wakati app/tab imefunguliwa (au iko
// background). Push ya kweli ukiwa umefunga kivinjari inahitaji
// VAPID + Service Worker + backend (haipo hapa — tazama ripoti).
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useNotifications,
  getLocalizedField,
  resolveNotificationSide,
} from "./notificationsStore.js";

const KEY_PUSH = "smk_alerts_browser";
const KEY_SOUND = "smk_alerts_sound";

const readFlag = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
};
const PREFS_EVENT = "smk:alerts-prefs";
const writeFlag = (key, val) => {
  try {
    localStorage.setItem(key, val ? "1" : "0");
  } catch {
    /* noop */
  }
  // Hook instances nyingine (Shell vs ukurasa wa Taarifa) zisome mapendeleo mapya
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PREFS_EVENT));
};

export const browserAlertsSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const getPermission = () =>
  browserAlertsSupported() ? Notification.permission : "unsupported";

// Kama Web Push (Service Worker) imewashwa, SW yenyewe inaonyesha notification —
// tusionyeshe ya pili kutoka ukurasa (ingekuwa mbili kwa taarifa moja).
async function hasPushSubscription() {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg || !reg.pushManager) return false;
    return Boolean(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}

let audioCtx = null;
function beep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.36);
  } catch {
    /* autoplay inaweza kuzuiwa — hakuna madhara */
  }
}

/** Hook: mapendeleo + ruhusa + alert(). */
export function useNotificationAlerts() {
  const [browserOn, setBrowserOn] = useState(() => readFlag(KEY_PUSH, false));
  const [soundOn, setSoundOn] = useState(() => readFlag(KEY_SOUND, true));
  const [permission, setPermission] = useState(getPermission());

  useEffect(() => {
    const sync = () => {
      setBrowserOn(readFlag(KEY_PUSH, false));
      setSoundOn(readFlag(KEY_SOUND, true));
      setPermission(getPermission());
    };
    sync();
    window.addEventListener(PREFS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PREFS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleSound = useCallback(() => {
    writeFlag(KEY_SOUND, !readFlag(KEY_SOUND, true));
    setSoundOn(readFlag(KEY_SOUND, true));
  }, []);

  // Inarudisha "granted" | "denied" | "default" | "unsupported"
  const enableBrowser = useCallback(async () => {
    if (!browserAlertsSupported()) return "unsupported";
    let p = Notification.permission;
    if (p === "default") {
      try {
        p = await Notification.requestPermission();
      } catch {
        p = Notification.permission;
      }
    }
    setPermission(p);
    const on = p === "granted";
    writeFlag(KEY_PUSH, on);
    setBrowserOn(on);
    return p;
  }, []);

  const disableBrowser = useCallback(() => {
    writeFlag(KEY_PUSH, false);
    setBrowserOn(false);
  }, []);

  const alert = useCallback(
    ({ title, body, tag, onClick }) => {
      if (soundOn) beep();
      if (soundOn && typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([120, 60, 120]);
        } catch {
          /* noop */
        }
      }
      if (
        browserOn &&
        browserAlertsSupported() &&
        Notification.permission === "granted" &&
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        hasPushSubscription().then((pushActive) => {
          if (pushActive) return;
          try {
            const n = new Notification(title || "SokoMkononi", {
              body: body || "",
              tag: tag || undefined,
            });
            n.onclick = () => {
              window.focus();
              if (onClick) onClick();
              n.close();
            };
          } catch {
            /* noop */
          }
        });
      }
    },
    [soundOn, browserOn]
  );

  return {
    supported: browserAlertsSupported(),
    permission,
    browserOn,
    soundOn,
    enableBrowser,
    disableBrowser,
    toggleSound,
    alert,
  };
}

/**
 * Weka MARA MOJA kwenye DashboardShell — arifa mpya (sauti/mtetemo/browser)
 * zinafanya kazi kwenye kila ukurasa wa dashboard, si ukurasa wa Taarifa tu.
 * Taarifa ya WAITING_LIST_AVAILABLE inatoka backend kama notification,
 * kwa hiyo nafasi ikifunguka inafyatua alert hii pia.
 */
export function useNewNotificationAlerts({ side, lang }) {
  const navigate = useNavigate();
  const alerts = useNotificationAlerts();
  const { notifications } = useNotifications("user");
  const alertRef = useRef(alerts.alert);
  alertRef.current = alerts.alert;
  const seen = useRef(null); // ids ZOTE zilizoonekana (si za side moja tu)

  useEffect(() => {
    const ids = new Set(notifications.map((n) => String(n.id)));
    if (seen.current === null) {
      seen.current = ids; // mzigo wa kwanza si "mpya"
      return;
    }
    const fresh = notifications.filter((n) => {
      if (n.read || seen.current.has(String(n.id))) return false;
      const s = resolveNotificationSide(n);
      return s === "both" || s === side;
    });
    seen.current = ids;
    if (fresh.length === 0) return;
    const first = fresh[0];
    alertRef.current({
      title: getLocalizedField(first.title, lang) || "SokoMkononi",
      body:
        fresh.length > 1
          ? lang === "sw"
            ? `Na taarifa nyingine ${fresh.length - 1}`
            : `And ${fresh.length - 1} more`
          : getLocalizedField(first.body, lang),
      tag: `smk-notif-${first.id}`,
      onClick: () => navigate("/dashboard/notifications"),
    });
  }, [notifications, side, lang, navigate]);
}