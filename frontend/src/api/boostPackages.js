
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
   * Admin: Update boost package (price, is_active, n.k.).
   * PATCH `/boosting/packages/{id}/`
   */
  update: (id, patch) => api.patch(`/boosting/packages/${id}/`, patch),

  remove: (id) => api.delete(`/boosting/packages/${id}/`),
};

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default boostPackagesApi;