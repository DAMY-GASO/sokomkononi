// ============================================================
// listings.js — shared listing helpers used by components AND pages.
// Extracted from pages/dashboard/components/shared.js so that
// components/ can import them without depending on pages/.
// ============================================================

export function isBoostActive(listing) {
  return Boolean(
    listing?.boostExpiresAt &&
      new Date(listing.boostExpiresAt).getTime() > Date.now()
  );
}

export function boostDaysRemaining(listing) {
  if (!isBoostActive(listing)) return 0;
  const ms = new Date(listing.boostExpiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86400000));
}

export function isLeadingActive(listing) {
  return Boolean(
    listing?.leadingExpiresAt &&
      new Date(listing.leadingExpiresAt).getTime() > Date.now()
  );
}

export function leadingDaysRemaining(listing) {
  if (!isLeadingActive(listing)) return 0;
  const ms = new Date(listing.leadingExpiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86400000));
}
