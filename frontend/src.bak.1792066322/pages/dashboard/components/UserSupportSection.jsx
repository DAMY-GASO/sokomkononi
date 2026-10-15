// ============================================================
// UserSupportSection.jsx
// Customer Support wrapper for buyer + seller.
// Reuses SafetySupportSection which already handles:
//   • Report submission (tickets)
//   • My Reports (ticket thread + replies)
//   • FAQ accordion
//   • Contact channels
// ============================================================
import React from "react";
import SafetySupportSection from "../buyer/SafetySupportSection.jsx";

export default function UserSupportSection({ side = "buyer" }) {
  return <SafetySupportSection side={side} />;
}
