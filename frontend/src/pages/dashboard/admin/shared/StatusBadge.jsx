// ============================================================
// StatusBadge.jsx
// Badge ya status — kwa users, listings, deals.
// Bilingual — inasoma `lang` prop.
// ============================================================

import React from "react";

export default function StatusBadge({ status, lang = "sw" }) {
  const config = {
    active: {
      label: lang === "sw" ? "Hai" : "Active",
      color: "bg-green-100 text-green-700",
    },
    pending: {
      label: lang === "sw" ? "Inasubiri" : "Pending",
      color: "bg-yellow-100 text-yellow-700",
    },
    inactive: {
      label: lang === "sw" ? "Haifanyi Kazi" : "Inactive",
      color: "bg-gray-100 text-gray-500",
    },
    suspended: {
      label: lang === "sw" ? "Amesimamishwa" : "Suspended",
      color: "bg-red-100 text-red-700",
    },
    verified: {
      label: lang === "sw" ? "Imethibitishwa" : "Verified",
      color: "bg-green-100 text-green-700",
    },
    rejected: {
      label: lang === "sw" ? "Imekataliwa" : "Rejected",
      color: "bg-red-100 text-red-700",
    },
    live: {
      label: "Live",
      color: "bg-green-100 text-green-700",
    },
    reserved: {
      label: lang === "sw" ? "Ina Reservation" : "Reserved",
      color: "bg-yellow-100 text-yellow-700",
    },
    in_review: {
      label: lang === "sw" ? "Inasubiri" : "In Review",
      color: "bg-yellow-100 text-yellow-700",
    },
    pending_payment: {
      label: lang === "sw" ? "Inasubiri Malipo" : "Pending Payment",
      color: "bg-yellow-100 text-yellow-700",
    },
    sold: {
      label: lang === "sw" ? "Imeuzwa" : "Sold",
      color: "bg-blue-100 text-blue-700",
    },
    expired: {
      label: lang === "sw" ? "Muda Umeisha" : "Expired",
      color: "bg-gray-100 text-gray-500",
    },
    completed: {
      label: lang === "sw" ? "Imekamilika" : "Completed",
      color: "bg-green-100 text-green-700",
    },
    negotiating: {
      label: lang === "sw" ? "Inajadiliwa" : "Negotiating",
      color: "bg-yellow-100 text-yellow-700",
    },
    offer_sent: {
      label: lang === "sw" ? "Ofa Imetumwa" : "Offer Sent",
      color: "bg-yellow-100 text-yellow-700",
    },
    accepted: {
      label: lang === "sw" ? "Imekubaliwa" : "Accepted",
      color: "bg-green-100 text-green-700",
    },
    declined: {
      label: lang === "sw" ? "Imekataliwa" : "Declined",
      color: "bg-red-100 text-red-700",
    },
    awaiting_final_payment: {
      label: lang === "sw" ? "Malipo ya Mwisho" : "Final Payment",
      color: "bg-blue-100 text-blue-700",
    },
    payment_proof_submitted: {
      label: lang === "sw" ? "Uthibitisho Umetumwa" : "Proof Submitted",
      color: "bg-yellow-100 text-yellow-700",
    },
    disputed: {
      label: lang === "sw" ? "Mgogoro" : "Disputed",
      color: "bg-red-100 text-red-700",
    },
    cancelled: {
      label: lang === "sw" ? "Imeghairiwa" : "Cancelled",
      color: "bg-gray-100 text-gray-500",
    },
  };
  const s = config[status] || config.pending;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
}
