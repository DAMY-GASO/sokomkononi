// ============================================================
// notificationAlerts.js  →  weka kwenye src/config/
// Arifa za kivinjari + sauti + mtetemo (frontend pekee).
//
// MUHIMU: Hii inafanya kazi wakati app/tab imefunguliwa (au iko
// background). Push ya kweli ukiwa umefunga kivinjari inahitaji
// VAPID + Service Worker + backend (haipo hapa — tazama ripoti).
// ============================================================
import { useCallback, useEffect, useState } from "react";

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
const writeFlag = (key, val) => {
  try {
    localStorage.setItem(key, val ? "1" : "0");
  } catch {
    /* noop */
  }
};

export const browserAlertsSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const getPermission = () =>
  browserAlertsSupported() ? Notification.permission : "unsupported";

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
    setPermission(getPermission());
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      writeFlag(KEY_SOUND, !prev);
      return !prev;
    });
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
