// ============================================================
// downloadHistoryStore.js
// ============================================================
import { useEffect, useState } from "react";

const KEY = "sokomkononi_download_history_v1";
const EV = "sokomkononi:download-history-updated";
const MAX_ENTRIES = 100;

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function write(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify(list.slice(0, MAX_ENTRIES))
    );
    window.dispatchEvent(new Event(EV));
  } catch {
    /* quota — noop */
  }
}

export function getDownloadHistory() {
  return read();
}

export function addDownloadEntry(entry = {}) {
  const newEntry = {
    id: `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    format: "pdf",
    period: "all",
    feeAmount: 0,
    paidWith: null,
    error: null,
    ...entry,
  };
  write([newEntry, ...read()]);
  return newEntry;
}

export function updateDownloadEntry(id, patch = {}) {
  const current = read();
  const updated = current.map((e) =>
    e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
  );
  write(updated);
  return updated.find((e) => e.id === id) || null;
}

export function removeDownloadEntry(id) {
  const next = read().filter((e) => e.id !== id);
  write(next);
  return next;
}

export function clearDownloadHistory() {
  write([]);
}

export function useDownloadHistory() {
  const [list, setList] = useState(() => read());

  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);

  return list;
}