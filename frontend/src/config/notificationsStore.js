// ============================================================
// CANONICAL EVENTS (Muongozo §8.4) — Developer A's webhook payloads
// zinapaswa kutumia STRINGS HIZI HIZI. Frontend ina-export ili
// kuweza kulinganisha (switch/case) badala ya hard-coded strings.
// ============================================================
export const NOTIFICATION_EVENTS = {
  // User-side (buyer + seller)
  LISTING_APPROVED:         "listing.approved",
  LISTING_REJECTED:         "listing.rejected",
  LISTING_RELEASED:         "listing.released",
  LISTING_EXPIRED:          "listing.expired",
  LISTING_FEE_PAID:         "listing_fee.paid",
  BOOST_PURCHASED:          "boost.purchased",
  LEADING_PURCHASED:        "leading.purchased",
  ADVERTISEMENT_PURCHASED:  "advertisement.purchased",
  MESSAGE_RECEIVED:         "message.received",
  RESERVATION_CREATED:      "reservation.created",
  RESERVATION_EXPIRING:     "reservation.expiring",
  PAYMENT_PROOF_SUBMITTED:  "payment.proof_submitted",
  PAYMENT_CONFIRMED:        "payment.confirmed",
  INSPECTION_DECISION_MADE: "inspection.decision_made",
  DISPUTE_RESOLVED:         "dispute.resolved",
  // Admin-side
  LISTING_PENDING:          "admin.listing_pending",
  DISPUTE_FILED:            "admin.dispute_filed",
  PAYMENT_ISSUE:            "admin.payment_issue",
  FRAUD_FLAG:               "admin.fraud_flag",
};

// ... (SEED_NOTIFICATIONS inabaki; `type` values zinaweza kubadilishwa
//      kuwa NOTIFICATION_EVENTS.* hatua kwa hatua — seed inaendelea
//      kufanya kazi kwa short names kama "boost", "leading", n.k.)

// ... (helpers zote zilizopo zinaendelea kama zilivyo)

/**
 * NEW EMITTER: Admin amesuluhisha mgogoro. Inatuma taarifa kwa upande
 * wa mtumiaji (buyer na seller wote — kwa sasa mfumo ni single-user
 * kwa demo, kwa hivyo inaonekana kwa mtumiaji mmoja aliyeingia).
 */
export function notifyDisputeResolved({ dealId, listingTitle, action, adminNote }) {
  const actionText = {
    refund: "Malipo yamerejeshwa kwa mnunuzi.",
    continue: "Deal inaendelea (negotiation upya).",
    cancel: "Deal imeghairiwa bila kurejesha fedha.",
  }[action] || "Uamuzi umetolewa.";

  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.DISPUTE_RESOLVED,
    title: `Mgogoro wa "${listingTitle}" umetatuliwa`,
    body: `${actionText}${adminNote ? ` Maelezo: ${adminNote}` : ""}`,
    link: "/dashboard/deals",
    meta: { dealId, action },
  });
}

/**
 * NEW EMITTER: Muuzaji kapokea payment proof — anahitaji kubofya
 * "Nimepokea Malipo". (Inatumika baadaye — imeandaliwa tayari.)
 */
export function notifyPaymentProofSubmitted({ dealId, listingTitle, amount }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.PAYMENT_PROOF_SUBMITTED,
    title: "Uthibitisho wa malipo umetumwa",
    body: `"${listingTitle}" — mnunuzi amepakia uthibitisho wa ${fmtTZS(amount)}. Thibitisha "Nimepokea Malipo" kukamilisha muamala.`,
    link: "/dashboard/deals",
    meta: { dealId },
  });
}