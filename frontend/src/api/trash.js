// ============================================================
// api/trash.js — Trash / Recycle Bin API client
// Backend: /api/trash/
// ============================================================
import { api } from "./client";

// ============================================================
// TRASH TYPES — zote zinazotumika kwenye mfumo
// ============================================================
export const TRASH_TYPES = [
  "listings",
  "users",
  "verifications",
  "tickets",
  "banners",
  "announcements",
  "deals",
];

// ============================================================
// TRASH API
// ============================================================
export const trashApi = {
  /**
   * Muhtasari wa trash — idadi ya items kwa kila type.
   * Backend inarudisha:
   *   { counts: { listings: 5, users: 2, total: 7 } }
   *   AU flat: { listings: 5, users: 2, total: 7 }
   */
  overview: () => api.get("/trash/overview/"),

  /**
   * Items za type moja.
   * @param {string} type - "listings" | "users" | "verifications" | ...
   */
  items: (type) => {
    if (!type) throw new Error("trashApi.items: type is required");
    return api.get(`/trash/${type}/`);
  },

  /**
   * Kurudisha item kutoka trash.
   * @param {string} type - Type ya item
   * @param {number|string} id - ID ya item
   */
  restore: (type, id) => {
    if (!type) throw new Error("trashApi.restore: type is required");
    if (id === undefined || id === null)
      throw new Error("trashApi.restore: id is required");
    return api.post(`/trash/${type}/${id}/restore/`, {});
  },

  /**
   * Kufuta item kabisa (permanent delete).
   * @param {string} type - Type ya item
   * @param {number|string} id - ID ya item
   */
  permanentDelete: (type, id) => {
    if (!type)
      throw new Error("trashApi.permanentDelete: type is required");
    if (id === undefined || id === null)
      throw new Error("trashApi.permanentDelete: id is required");
    return api.delete(`/trash/${type}/${id}/`);
  },

  /**
   * Kufuta items zote za type moja.
   * @param {string} type - Type ya item
   */
  emptyByType: (type) => {
    if (!type)
      throw new Error("trashApi.emptyByType: type is required");
    return api.post(`/trash/${type}/empty/`, { confirm: true });
  },

  /**
   * Kufuta trash yote (types zote).
   */
  emptyAll: () => api.post("/trash/empty/", { confirm: true }),
};

// ============================================================
// HELPER — Kupata label ya type kwa lugha
// ============================================================
export function getTrashTypeLabel(type, lang = "sw") {
  const labels = {
    listings: { sw: "Mali (Listings)", en: "Listings" },
    users: { sw: "Watumiaji", en: "Users" },
    verifications: { sw: "Uthibitisho", en: "Verifications" },
    tickets: { sw: "Tiketi", en: "Tickets" },
    banners: { sw: "Banner", en: "Banners" },
    announcements: { sw: "Matangazo", en: "Announcements" },
    deals: { sw: "Deals", en: "Deals" },
  };
  const label = labels[type];
  if (!label) return type;
  return label[lang] || label.sw || type;
}

// ============================================================
// DEFAULT EXPORT (kwa convenience)
// ============================================================
export default trashApi;