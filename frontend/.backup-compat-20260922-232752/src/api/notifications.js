import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const notificationsApi = {
  list: (params = {}) => api.get(`/notifications/${toQuery(params)}`),
  detail: (id) => api.get(`/notifications/${id}/`),
  unread: (params = {}) => api.get(`/notifications/unread/${toQuery(params)}`),
  unreadCount: () => api.get("/notifications/unread-count/"),
  byPriority: (priority, params = {}) =>
    api.get(`/notifications/priority/${priority}/${toQuery(params)}`),
  markRead: (id) => api.post(`/notifications/${id}/read/`, {}),
  markAllRead: () => api.post("/notifications/read-all/", {}),
  remove: (id) => api.delete(`/notifications/${id}/`),
};
