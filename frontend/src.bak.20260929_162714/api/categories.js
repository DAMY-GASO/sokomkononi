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
};
