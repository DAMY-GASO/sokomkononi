// ============================================================
// contact.js — Contact form API
// ============================================================
import { api } from "./client";

export const contactApi = {
  /**
   * Tuma ujumbe wa contact form.
   * Backend inatarajiwa kurudisha { id, status } au 201.
   */
  submit: (payload) => api.post("/contact/", {
    name: payload.name,
    email: payload.email,
    message: payload.message,
  }),
};
