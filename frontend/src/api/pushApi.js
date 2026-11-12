// src/api/pushApi.js
import { api } from "./client";

export async function subscribePush(subscription) {
  return api.post("/push/subscribe/", subscription);
}

export async function unsubscribePush(endpoint) {
  return api.post("/push/unsubscribe/", { endpoint });
}