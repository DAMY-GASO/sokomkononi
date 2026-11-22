// ============================================================
// categories.js — API client for Categories
//
// Marekebisho:
//  - Ongeza bulk() method kwa bulk actions
// ============================================================
import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const categoriesApi = {
  list: (params = {}) => api.get(`/categories/${toQuery(params)}`),
  detail: (idOrSlug) => api.get(`/categories/${idOrSlug}/`),
  uploadImage: (formData) => api.upload("/categories/upload-image/", formData),

  // ⬇️ Reorder — inatuma list ya keys kwa mpangilio mpya
  reorder: (order) => api.post("/categories/reorder/", { order }),

  // ⬇️ MPYA: bulk actions — enable/disable/mark_popular/unmark_popular/delete
  bulk: (action, ids) =>
    api.post("/categories/bulk/", { action, ids }),
};