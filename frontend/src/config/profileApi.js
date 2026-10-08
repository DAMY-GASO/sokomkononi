// ============================================================
// profileApi.js  →  weka kwenye src/config/
// ============================================================
import { api } from "../api/client.js";

const PATHS = {
  activities: "/auth/me/activities/",
  preferences: "/auth/me/preferences/",
  notificationPrefs: "/auth/me/notification-preferences/",
};

async function safe(promise, signal) {
  try {
    const data = await promise;
    if (signal?.aborted) return { ok: false, aborted: true };
    return { ok: true, data };
  } catch (error) {
    if (signal?.aborted) return { ok: false, aborted: true };
    return { ok: false, error };
  }
}

// ============================================================
// ACTIVITIES
// ============================================================
function normalizeActivities(d) {
  const list = Array.isArray(d) ? d : d?.results || [];
  return list.map((a) => ({
    id: a.id,
    type: a.type || undefined,
    title: a.title,
    description: a.description,
    createdAt: a.created_at,
  }));
}

export const fetchActivities = async (signal) => {
  const r = await safe(api.get(PATHS.activities), signal);
  return r.ok ? { ...r, data: normalizeActivities(r.data) } : r;
};

// ============================================================
// PREFERENCES
// ============================================================
export const fetchPreferences = async (signal) => {
  const r = await safe(api.get(PATHS.preferences), signal);
  if (!r.ok) return r;
  const d = r.data || {};
  return {
    ...r,
    data: {
      language: d.language,
      currency: d.currency,
      region: d.region,
      showPhone: d.show_phone ?? d.showPhone,
      showEmail: d.show_email ?? d.showEmail,
    },
  };
};

export const savePreferences = (p) =>
  safe(
    api.patch(PATHS.preferences, {
      language: p.language,
      currency: p.currency,
      region: p.region,
      show_phone: p.showPhone,
      show_email: p.showEmail,
    })
  );

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================
export const fetchNotificationPrefs = async (signal) => {
  const r = await safe(api.get(PATHS.notificationPrefs), signal);
  if (!r.ok) return r;
  return { ok: true, data: r.data || {} };
};

export const saveNotificationPrefs = (partial) =>
  safe(api.patch(PATHS.notificationPrefs, partial));