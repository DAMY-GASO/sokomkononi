import { api } from "./client";
import { boostingApi } from "./boosting";

export const boostPackagesApi = {
  /**
   * @deprecated Use `boostingApi.packages()` instead.
   * Kept for backward compatibility.
   */
  list: () => boostingApi.packages({ page_size: 100 }),

  /**
   * @deprecated Use `boostingApi.package(id)` instead.
   * Kept for backward compatibility.
   */
  detail: (id) => boostingApi.package(id),

  /**
   * Admin: Create a new boost package.
   * POST `/boosting/packages/`
   */
  create: (payload) => api.post("/boosting/packages/", payload),

  /**
   * Admin: Update boost package (price, is_active, name, hours, ordering).
   * PATCH `/boosting/packages/{id}/`
   */
  update: (id, patch) => api.patch(`/boosting/packages/${id}/`, patch),

  /**
   * Admin: Delete boost package.
   * DELETE `/boosting/packages/{id}/`
   */
  remove: (id) => api.delete(`/boosting/packages/${id}/`),
};

export default boostPackagesApi;