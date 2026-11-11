// ============================================================
// undoStore.js — Undo window kwa items zilizofutwa
//
// Marekebisho:
//  ✅ Support ya bulk undo: `onRestore` inaweza kurejesha items nyingi
//     kwa pamoja (mfano, listings zote kwa `ids` array).
//  ✅ `restoreUndo` inathibitisha `{ ok }` ya `onRestore` — kama
//     `onRestore` inarudisha `{ ok: false }`, tunarudisha `{ ok: false }`
//     (badala ya "success" ya uongo).
//  ✅ Fallback handlers kupitia `registerRestoreHandlers` — inaruhusu
//     undo baada ya refresh (memory callbacks zinapotea).
//  ✅ Export ya `getPendingCallbacks()` kwa debugging.
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
 * Anzisha undo window kwa item(s) iliyofutwa.
 *
 * @param {object} item
 * @param {string} item.type - "listing" | "message" | "deal" | n.k.
 * @param {number|string} item.id - item moja
 * @param {number[]|string[]} [item.ids] - items nyingi (bulk delete)
 * @param {string} item.title - jina moja au "Matangazo 5"
 * @param {Function} item.onRestore - async function inayorejesha. Inaweza
 *   kurudisha `{ ok: true }`, `{ ok: false, error }`, au `undefined`
 *   (ambayo inachukuliwa kama success).
 * @param {Function} [item.onExpire] - async function inayofuta kabisa (hiari)
 * @param {string} [item.message] - ujumbe wa toast
 * @returns {string} undoId
 */
export function startUndo({
  type,
  id,
  ids,
  title,
  onRestore,
  onExpire,
  message,
}) {
  const undoId = `undo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();
  const idList = Array.isArray(ids) ? ids.map(String) : (id != null ? [String(id)] : []);
  const item = {
    undoId,
    type,
    itemId: id != null ? id : null,
    itemIds: idList,
    title,
    message: message || title,
    startedAt: now,
    expiresAt: now + UNDO_WINDOW_MS,
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

// Fallback handlers (zinadumu baada ya refresh)
let _RESTORE_HANDLERS = {};

/**
 * Sajili restore handlers kwa type. Hizi zinatumika kama `pendingCallbacks`
 * haipo (mfano, baada ya refresh).
 *
 * @param {Record<string, (itemId|itemIds, item) => Promise>} map
 */
export function registerRestoreHandlers(map) {
  _RESTORE_HANDLERS = { ..._RESTORE_HANDLERS, ...map };
}

export function getPendingCallbacks() {
  return { ...pendingCallbacks };
}

/**
 * Rejesha item (mtumiaji amebofya "Rejesha").
 *
 * Tunarudisha:
 *   { ok: true }                     — imefanikiwa
 *   { ok: false, error, code }       — imeshindwa
 *     code: "NOT_FOUND" | "NO_CALLBACK" | "RESTORE_FAILED" | "NO_HANDLER"
 */
export async function restoreUndo(undoId) {
  const item = read().find((i) => i.undoId === undoId);
  if (!item) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: new Error("Undo haipo (au imeisha muda)"),
    };
  }

  const cb = pendingCallbacks[undoId];

  // 1. Jaribu callback ya memory kwanza
  if (cb?.onRestore) {
    try {
      const result = await cb.onRestore(item);
      // Support ya `{ ok: false }` — usiseme "success" ikiwa `ok === false`
      if (result && result.ok === false) {
        return {
          ok: false,
          code: "RESTORE_FAILED",
          error: result.error || new Error("Restore failed"),
        };
      }
    } catch (err) {
      console.warn("[undoStore] restore failed:", err);
      return { ok: false, code: "RESTORE_FAILED", error: err };
    }
  }
  // 2. Fallback kwa handler ya type (inadumu baada ya refresh)
  else if (_RESTORE_HANDLERS[item.type]) {
    try {
      const result = await _RESTORE_HANDLERS[item.type](
        item.itemIds?.length > 1 ? item.itemIds : item.itemId,
        item
      );
      if (result && result.ok === false) {
        return {
          ok: false,
          code: "RESTORE_FAILED",
          error: result.error || new Error("Restore failed"),
        };
      }
    } catch (err) {
      console.warn("[undoStore] handler restore failed:", err);
      return { ok: false, code: "RESTORE_FAILED", error: err };
    }
  }
  // 3. Hakuna njia ya kurejesha
  else {
    return {
      ok: false,
      code: "NO_HANDLER",
      error: new Error(
        "Undo callback haipo (page ilirefresh). Jaribu tena kwenye orodha."
      ),
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