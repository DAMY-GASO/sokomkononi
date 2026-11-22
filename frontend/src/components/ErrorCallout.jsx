// ============================================================
// src/components/ErrorCallout.jsx
// Onyesha maelezo ya kosa kwa mtumiaji kwa lugha rahisi.
//
// Inatumika na:
//   - explainApiError() → info = { status, code, title, message, steps[], cta }
//   - DealRooms.jsx (reopen errors)
//   - Fomu nyingine zinazotumia apiErrors.js
// ============================================================

import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  sandLine: "#E8E3D5",
  rust: "#C1502E",
  green: "#2F6D4F",
};

export default function ErrorCallout({ info, onDismiss }) {
  if (!info) return null;

  const {
    title = "",
    message = "",
    steps = [],
    cta = null,
  } = info;

  if (!title && !message && !steps.length && !cta) return null;

  return (
    <div
      role="alert"
      style={{
        background: "rgba(193,80,46,0.08)",
        borderColor: COLORS.sandLine,
        borderLeft: `4px solid ${COLORS.rust}`,
        color: COLORS.night,
      }}
      className="rounded-lg border px-4 py-3 flex flex-col gap-2"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          size={18}
          color={COLORS.rust}
          className="shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          {title && (
            <p
              style={{ color: COLORS.rust }}
              className="text-sm font-bold mb-1"
            >
              {title}
            </p>
          )}
          {message && (
            <p className="text-sm text-secondary leading-relaxed">
              {message}
            </p>
          )}
        </div>
      </div>

      {steps.length > 0 && (
        <ol
          className="text-sm pl-5 list-decimal space-y-1"
          style={{ color: COLORS.night }}
        >
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}

      {cta && cta.to && (
        <div className="pt-1">
          <Link
            to={cta.to}
            style={{
              background: COLORS.green,
              color: "white",
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg"
          >
            {cta.label || cta.to}
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}