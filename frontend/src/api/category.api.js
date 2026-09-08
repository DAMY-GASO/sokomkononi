import client from "./client";

export const fetchCategories = () => client.get("/categories").then((r) => r.data);
