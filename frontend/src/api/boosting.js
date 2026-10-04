import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const boostingApi = {
  packages: (params = {}) => api.get(`/boosting/packages/${toQuery(params)}`),
  package: (id) => api.get(`/boosting/packages/${id}/`),

  // Global boost-fee switch. GET is public, PATCH is admin only.
  feeConfig: () => api.get("/boosting/fee-config/"),
  updateFeeConfig: (patch) => api.patch("/boosting/fee-config/", patch),

  list: (params = {}) => api.get(`/boosting/${toQuery(params)}`),
  detail: (id) => api.get(`/boosting/${id}/`),
  mine: (params = {}) => api.get(`/boosting/my/${toQuery(params)}`),
  create: ({ listing, package: pkg }) =>
    api.post("/boosting/", { listing, package: pkg }),
  pay: (id, body = {}) =>
    api.post(`/boosting/${id}/pay/`,
      body && typeof body === "object" ? body : {}),
  activate: (id) => api.post(`/boosting/${id}/activate/`, {}),
  cancel: (id) => api.post(`/boosting/${id}/cancel/`, { confirm: true }),
};