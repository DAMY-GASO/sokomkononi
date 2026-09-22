import { api } from "./client";

export const trashApi = {
  overview: () => api.get("/trash/overview/"),
};
