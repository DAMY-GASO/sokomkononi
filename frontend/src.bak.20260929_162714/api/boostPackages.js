// ============================================================
// api/boostPackages.js — Admin operations for boost package prices
// 
// Read operations use `boostingApi.packages()` (public GET).
// This module focuses on admin-specific operations (update price).
//
// ⚠️ NOTE: `list` and `detail` are aliased to `boostingApi` to
// maintain backward compatibility. New code should use
// `boostingApi.packages()` and `boostingApi.package(id)` directly.
// ============================================================
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
   * Admin: Update boost package price.
   * Only admin-specific operation in this module.
   */
  update: (id, patch) => api.patch(`/boosting/packages/${id}/`, patch),
};

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default boostPackagesApi;