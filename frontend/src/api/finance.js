import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const financeApi = {
  dashboard: (period = "all") => api.get(`/finance/dashboard/${toQuery({ period })}`),
  revenue: ({ period = "all", source = "all" } = {}) =>
    api.get(`/finance/revenue/${toQuery({ period, source })}`),
  myTransactions: () => api.get("/finance/my-transactions/"),
};
