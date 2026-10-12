// ============================================================
// undoStore.js — Undo window kwa items zilizofutwa
//
// Inashughulikia:
// - "Rejesha" baada ya kufuta (dakika 5)
// - Timer ya auto-expire
// - Storage ya pending actions
// ============================================================
import { useEffect, useState } from "react";

const KEY = "sokomkononi_undo_v1";
const EV = "sokomkononi:undo-updated";

const UNDO_WINDOW_MS = 5 * 60 * 1000; // dakika 5

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    if (!Array.isArray(p)) return [];
    // Chuja zilizo-expire
    const now = Date.now();
    return p.filter((item) => item.expiresAt > now);
  } catch {
    return [];
  }
}

function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

export function getUndoItems() {
  return read();
}

/**
 * Anzisha undo window kwa item iliyofutwa.
 * @param {object} item
 * @param {string} item.type - "listing" | "message" | "deal" | n.k.
 * @param {number|string} item.id
 * @param {string} item.title
 * @param {Function} item.onRestore - async function inayorejesha
 * @param {Function} item.onExpire - async function inayofuta kabisa (hiari)
 * @param {string} item.message - ujumbe wa toast
 * @returns {string} id ya undo item
 */
export function startUndo({
  type,
  id,
  title,
  onRestore,
  onExpire,
  message,
}) {
  const undoId = `undo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();
  const item = {
    undoId,
    type,
    itemId: id,
    title,
    message: message || title,
    startedAt: now,
    expiresAt: now + UNDO_WINDOW_MS,
    onRestore: null,   // Function haiwezi ku-serialize
    onExpire: null,
  };

  // Hifadhi functions kwenye memory (si localStorage)
  pendingCallbacks[undoId] = { onRestore, onExpire };

  // Ongeza kwenye storage
  const current = read();
  write([item, ...current]);

  // Set timer ya auto-expire
  const timer = setTimeout(() => {
    expireUndo(undoId);
  }, UNDO_WINDOW_MS);
  pendingTimers[undoId] = timer;

  return undoId;
}

// Memory ya callbacks (haiwezi kuwa localStorage)
const pendingCallbacks = {};
const pendingTimers = {};

/**
 * Rejesha item (mtumiaji amebofya "Rejesha").
 */
let _RESTORE_HANDLERS = null;
export function registerRestoreHandlers(map) {
  _RESTORE_HANDLERS = { ...(_RESTORE_HANDLERS || {}), ...map };
}

export async function restoreUndo(undoId) {
  const item = read().find((i) => i.undoId === undoId);
  if (!item) return { ok: false, error: new Error("Undo haipo") };

  const cb = pendingCallbacks[undoId];
  if (cb?.onRestore) {
    try {
      await cb.onRestore();
    } catch (err) {
      console.warn("[undoStore] restore failed:", err);
      return { ok: false, error: err };
    }
  } else if (_RESTORE_HANDLERS?.[item.type]) {
    try {
      await _RESTORE_HANDLERS[item.type](item.itemId);
    } catch (err) {
      console.warn("[undoStore] handler restore failed:", err);
      return { ok: false, error: err };
    }
  } else {
    return {
      ok: false,
      error: new Error("Undo callback lost (page was reloaded)"),
    };
  }

  cancelUndo(undoId);
  return { ok: true };
}

/**
 * Ondoa undo item (mtumiaji ameacha, au amefuta kabisa).
 */
export function cancelUndo(undoId) {
  const current = read();
  write(current.filter((i) => i.undoId !== undoId));
  if (pendingTimers[undoId]) {
    clearTimeout(pendingTimers[undoId]);
    delete pendingTimers[undoId];
  }
  delete pendingCallbacks[undoId];
}

/**
 * Auto-expire (timer inaisha).
 */
async function expireUndo(undoId) {
  const item = read().find((i) => i.undoId === undoId);
  if (!item) return;

  const cb = pendingCallbacks[undoId];
  if (cb?.onExpire) {
    try {
      await cb.onExpire();
    } catch (err) {
      console.warn("[undoStore] onExpire failed:", err);
    }
  }

  cancelUndo(undoId);
}

// ── Hook ────────────────────────────────────────────────
export function useUndo() {
  const [items, setItems] = useState(() => read());

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);

    // Timer ya ku-check expiry kila 1s
    const interval = setInterval(() => {
      setItems(read());
    }, 1000);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
      clearInterval(interval);
    };
  }, []);

  return {
    items,
    startUndo,
    restoreUndo,
    cancelUndo,
  };
}

/**
 * Convert expiresAt → seconds remaining
 */
export function secondsRemaining(expiresAt) {
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}