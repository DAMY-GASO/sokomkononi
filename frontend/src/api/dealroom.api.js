import client from "./client";

// TODO Awamu 4: kukamilisha pale backend itakapokuwa tayari
export const createDealRoom = (propertyId) => client.post("/deal-rooms", { propertyId }).then((r) => r.data);
export const getDealRoom = (id) => client.get(`/deal-rooms/${id}`).then((r) => r.data);
export const sendDealMessage = (id, payload) => client.post(`/deal-rooms/${id}/messages`, payload).then((r) => r.data);
