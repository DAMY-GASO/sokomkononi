import React from "react";

const CONFIG = {
  active:      { label: { sw: "Hai", en: "Active" },     tone: "success" },
  pending:     { label: { sw: "Inasubiri", en: "Pending" }, tone: "warn" },
  inactive:    { label: { sw: "Haifanyi Kazi", en: "Inactive" }, tone: "muted" },
  suspended:   { label: { sw: "Amesimamishwa", en: "Suspended" }, tone: "danger" },
  verified:    { label: { sw: "Imethibitishwa", en: "Verified" }, tone: "success" },
  rejected:    { label: { sw: "Imekataliwa", en: "Rejected" }, tone: "danger" },
  live:            { label: { sw: "Hai", en: "Live" },              tone: "success" },
  reserved:        { label: { sw: "Ina Reservation", en: "Reserved" }, tone: "gold" },
  in_review:       { label: { sw: "Inakaguliwa", en: "In Review" }, tone: "warn" },
  pending_payment: { label: { sw: "Inasubiri Malipo", en: "Pending Payment" }, tone: "warn" },
  sold:            { label: { sw: "Imeuzwa", en: "Sold" },          tone: "royal" },
  expired:         { label: { sw: "Muda Umeisha", en: "Expired" },  tone: "muted" },
  completed:                 { label: { sw: "Imekamilika", en: "Completed" }, tone: "success" },
  negotiating:               { label: { sw: "Inajadiliwa", en: "Negotiating" }, tone: "warn" },
  offer_sent:                { label: { sw: "Ofa Imetumwa", en: "Offer Sent" }, tone: "warn" },
  accepted:                  { label: { sw: "Imekubaliwa", en: "Accepted" }, tone: "success" },
  declined:                  { label: { sw: "Imekataliwa", en: "Declined" }, tone: "danger" },
  awaiting_final_payment:    { label: { sw: "Malipo ya Mwisho", en: "Final Payment" }, tone: "royal" },
  payment_proof_submitted:   { label: { sw: "Uthibitisho Umetumwa", en: "Proof Submitted" }, tone: "warn" },
  disputed:                  { label: { sw: "Mgogoro", en: "Disputed" }, tone: "danger" },
  cancelled:                 { label: { sw: "Imeghairiwa", en: "Cancelled" }, tone: "muted" },
  open:        { label: { sw: "Wazi", en: "Open" },        tone: "danger" },
  in_progress: { label: { sw: "Inaendelea", en: "In Progress" }, tone: "warn" },
  resolved:    { label: { sw: "Imetatuliwa", en: "Resolved" }, tone: "success" },
  closed:      { label: { sw: "Imefungwa", en: "Closed" }, tone: "muted" },
  approved:    { label: { sw: "Imeidhinishwa", en: "Approved" }, tone: "success" },
  reserved_paid:         { label: { sw: "Reservation Imelipwa", en: "Reservation Paid" }, tone: "success" },
  inspecting:            { label: { sw: "Inakaguliwa", en: "Inspecting" }, tone: "royal" },
  decided_accept:        { label: { sw: "Imekubaliwa", en: "Accepted" }, tone: "success" },
  decided_reject:        { label: { sw: "Imekataliwa", en: "Rejected" }, tone: "danger" },
  awaiting_confirmation: { label: { sw: "Inasubiri Uthibitisho", en: "Awaiting Confirmation" }, tone: "royal" },
};

const TONES = {
  success: "bg-[#2F6D4F]/12 text-[#2F6D4F] border-[#2F6D4F]/25",
  warn:    "bg-[#B45309]/12 text-[#B45309] border-[#B45309]/25",
  danger:  "bg-[#C1502E]/12 text-[#C1502E] border-[#C1502E]/25",
  gold:    "bg-[#FEA406]/15 text-[#A35F00] border-[#FEA406]/30",
  royal:   "bg-[#0062FD]/12 text-[#0062FD] border-[#0062FD]/25",
  muted:   "bg-[color:rgb(var(--c-hairline))]/60 text-secondary border-[color:rgb(var(--c-hairline))]",
};

export default function StatusBadge({ status, lang = "sw" }) {
  const c = CONFIG[status] || CONFIG.pending;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${TONES[c.tone] || TONES.muted}`}>
      {c.label?.[lang] || c.label?.sw || status}
    </span>
  );
}
