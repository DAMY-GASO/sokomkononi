import client from "./client";

export const fetchProperties = (params) => client.get("/properties", { params }).then((r) => r.data);
export const fetchProperty = (id) => client.get(`/properties/${id}`).then((r) => r.data);
export const fetchMyListings = () => client.get("/properties/mine").then((r) => r.data);
export const createProperty = (data) => client.post("/properties", data).then((r) => r.data);
