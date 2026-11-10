import { COLORS } from "../shared";

export const FALLBACK_DEAL_STATUS = (lang, key) => ({
  label: key
    ? String(key).replace(/_/g, " ")
    : lang === "sw"
      ? "Inaendelea"
      : "In Progress",
  bg: "rgba(47,109,79,0.12)",
  fg: COLORS.green,
});

export const getDealStatus = (lang) => ({
  open: {
    label: lang === "sw" ? "Wazi" : "Open",
    bg: "rgba(47,109,79,0.12)",
    fg: COLORS.green,
  },
  pending: {
    label: lang === "sw" ? "Inasubiri" : "Pending",
    bg: "rgba(232,163,61,0.16)",
    fg: "#8A5A16",
  },
  negotiating: {
    label: lang === "sw" ? "Inaendelea" : "Negotiating",
    bg: "rgba(47,109,79,0.12)",
    fg: COLORS.green,
  },
  offer_sent: {
    label: lang === "sw" ? "Ofa Imetumwa" : "Offer Sent",
    bg: "rgba(232,163,61,0.16)",
    fg: "#8A5A16",
  },
  accepted: {
    label: lang === "sw" ? "Imekubaliwa" : "Accepted",
    bg: "rgba(47,109,79,0.16)",
    fg: COLORS.green,
  },
  declined: {
    label: lang === "sw" ? "Imekataliwa" : "Declined",
    bg: "rgba(193,80,46,0.12)",
    fg: COLORS.rust,
  },
  reserved: {
    label: lang === "sw" ? "Kipindi cha Ukaguzi" : "Inspection Period",
    bg: "rgba(16,26,46,0.08)",
    fg: COLORS.night,
  },
  awaiting_final_payment: {
    label:
      lang === "sw"
        ? "Tayari kwa Malipo ya Mwisho"
        : "Ready for Final Payment",
    bg: "rgba(37,99,235,0.12)",
    fg: "#2563EB",
  },
  payment_proof_submitted: {
    label: lang === "sw" ? "Uthibitisho Umetumwa" : "Proof Submitted",
    bg: "rgba(232,163,61,0.16)",
    fg: "#8A5A16",
  },
  completed: {
    label: lang === "sw" ? "Imekamilika" : "Completed",
    bg: "rgba(47,109,79,0.18)",
    fg: COLORS.green,
  },
  disputed: {
    label:
      lang === "sw"
        ? "Mgogoro — Chini ya Ukaguzi"
        : "Dispute — Under Review",
    bg: "rgba(193,80,46,0.16)",
    fg: COLORS.rust,
  },
  cancelled: {
    label: lang === "sw" ? "Imeghairiwa" : "Cancelled",
    bg: "rgba(16,26,46,0.08)",
    fg: COLORS.night,
  },
});

export const PAYMENT_METHODS = [
  "M-Pesa",
  "Mixx by Yas",
  "Airtel Money",
  "HaloPesa",
  "Benki (CRDB)",
];

export const REVIVABLE_STATUSES = ["cancelled", "declined"];

export function formatHours(hours, lang) {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return lang === "sw"
      ? `Saa ${hours} (Siku ${days})`
      : `${hours} hrs (${days} days)`;
  }
  return lang === "sw" ? `Saa ${hours}` : `${hours} hrs`;
}
