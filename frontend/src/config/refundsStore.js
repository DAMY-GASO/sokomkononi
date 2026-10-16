// ============================================================
// refundsStore.js — API-only via /api/payments/refunds/
// Refunds za promotions zilizofutwa.
// ============================================================
import { useEffect, useState } from "react";
import { paymentsApi } from "../api/payments.js";

const KEY = "sokomkononi_refunds_v1";
const EV = "sokomkononi:refunds-updated";

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
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

function sortNewest(list) {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function norm(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    promotionType: raw.promotion_type,
    promotionId: raw.promotion_id,
    userId: raw.user,
    userName: raw.user_name || "",
    amountPaid: Number(raw.amount_paid) || 0,
    amountRefunded: Number(raw.amount_refunded) || 0,
    status: raw.status,
    method: raw.method,
    reason: raw.reason || "",
    adminNote: raw.admin_note || "",
    processedBy: raw.processed_by,
    processedByName: raw.processed_by_name || "",
    paymentReference: raw.payment_reference || "",
    refundReference: raw.refund_reference || "",
    createdAt: raw.created_at,
    processedAt: raw.processed_at,
    completedAt: raw.completed_at,
  };
}

export function getRefunds() {
  return sortNewest(read());
}

export function getRefund(id) {
  return read().find((r) => r.id === id) || null;
}

// ── Hydrate ──────────────────────────────────────────────
let _inflight = null;
async function _hydrateImpl(params = {}) {
  try {
    const data = await paymentsApi.refunds.list(params);
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function hydrateRefundsFromApi(...args) {
  if (_inflight) return _inflight;
  _inflight = _hydrateImpl(...args).finally(() => {
    _inflight = null;
  });
  return _inflight;
}

// ── Mutations ────────────────────────────────────────────
export async function completeRefundAsync(id, { adminNote = "", method = null } = {}) {
  const current = read();
  const target = current.find((r) => r.id === id);

  // Optimistic
  write(
    current.map((r) =>
      r.id === id ? { ...r, status: "COMPLETED" } : r
    )
  );

  try {
    const raw = await paymentsApi.refunds.complete(id, {
      admin_note: adminNote,
      method,
    });
    const updated = norm(raw);
    write(current.map((r) => (r.id === id ? updated : r)));
    return { ok: true, refund: updated };
  } catch (err) {
    write(current); // rollback
    return { ok: false, error: err };
  }
}

export async function failRefundAsync(id, { adminNote = "" } = {}) {
  const current = read();

  write(
    current.map((r) =>
      r.id === id ? { ...r, status: "FAILED" } : r
    )
  );

  try {
    const raw = await paymentsApi.refunds.fail(id, {
      admin_note: adminNote,
    });
    const updated = norm(raw);
    write(current.map((r) => (r.id === id ? updated : r)));
    return { ok: true, refund: updated };
  } catch (err) {
    write(current);
    return { ok: false, error: err };
  }
}

// ── Hooks ────────────────────────────────────────────────
export function useRefunds() {
  const [list, setList] = useState(() => read());

  useEffect(() => {
    hydrateRefundsFromApi();
    const sync = () => setList(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);

  return sortNewest(list);
}

export function useRefund(id) {
  const list = useRefunds();
  if (!id) return null;
  return list.find((r) => r.id === id) || null;
}

export function useRefundsCount(status = null) {
  const list = useRefunds();
  if (!status) return list.length;
  return list.filter((r) => r.status === status).length;
}