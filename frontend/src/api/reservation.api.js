import client from "./client";

// TODO Awamu 5: backend bado ina stub (501) kwa hizi — tazama muongozo 3.5
export const createReservation = (payload) =>
  client.post("/reservations", payload).then((r) => r.data);
