// ============================================================
// api/reports.js
// ============================================================
import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const reportsApi = {
  overview: () => api.get("/admin/reports/overview/"),
  usersGrowth: (days = 30) => api.get(`/admin/reports/users-growth/${toQuery({ days })}`),
  listingsGrowth: (days = 30) => api.get(`/admin/reports/listings-growth/${toQuery({ days })}`),
  revenueByMonth: (months = 6) => api.get(`/admin/reports/revenue-by-month/${toQuery({ months })}`),
  dealsStatus: () => api.get("/admin/reports/deals-status/"),
  topSellers: (limit = 5) => api.get(`/admin/reports/top-sellers/${toQuery({ limit })}`),
  mostViewedListings: (limit = 5) => api.get(`/admin/reports/most-viewed-listings/${toQuery({ limit })}`),
  topCategories: (limit = 5) => api.get(`/admin/reports/top-categories/${toQuery({ limit })}`),
  topLocations: (limit = 5) => api.get(`/admin/reports/top-locations/${toQuery({ limit })}`),
  conversionRate: () => api.get("/admin/reports/conversion-rate/"),
};
