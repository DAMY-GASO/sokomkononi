// ============================================================
// EditableAmount.jsx
// Kiasi kinachoweza kuhaririwa — kwa Revenue section.
// Kipenseli kinaonekana wazi — msimamizi anaweza kuliona haraka.
// Comma inajiweka automatically mtumiaji anapoandika.
// ============================================================

import React, { useState } from "react";
import { Save, Pencil, X } from "lucide-react";
import { COLORS } from "../../shared/constants.js";

// Format namba na comma: 8500000 -> "8,500,000"
function formatWithCommas(value) {
  if (value === "" || value === null || value === undefined) return "";
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

// Toa comma na kurudi namba: "8,500,000" -> 8500000
function parseNumber(value) {
  const digits = String(value).replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export default function EditableAmount({ value, onSave, prefix = "TZS " }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const safeValue = value ?? 0;

  const startEditing = () => {
    setDraft(formatWithCommas(safeValue));
    setEditing(true);
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setDraft(raw ? Number(raw).toLocaleString("en-US") : "");
  };

  const handleSave = () => {
    const num = parseNumber(draft);
    onSave(num);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(formatWithCommas(safeValue));
    setEditing(false);
  };

  // ============================================================
  // EDITING MODE — input + save/cancel buttons
  // ============================================================
  if (editing) {
    return (
      <div className="flex items-center gap-1.5 w-full min-w-0">
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="flex-1 min-w-0 text-sm font-semibold border-2 rounded-lg px-2.5 py-1.5 outline-none transition-colors"
          style={{
            borderColor: COLORS.gold,
            background: `${COLORS.gold}08`,
            color: "var(--text-primary)",
          }}
          autoFocus
        />
        <button
          onClick={handleSave}
          style={{ background: COLORS.green, color: "white" }}
          className="shrink-0 p-1.5 rounded-lg hover:opacity-90 transition-opacity"
          aria-label="Save"
        >
          <Save size={14} />
        </button>
        <button
          onClick={handleCancel}
          style={{ background: COLORS.sandLine, color: "var(--text-primary)" }}
          className="shrink-0 p-1.5 rounded-lg hover:opacity-80 transition-opacity"
          aria-label="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // ============================================================
  // DISPLAY MODE — kiasi + kipenseli kinachoonekana
  // ============================================================
  return (
    <button
      onClick={startEditing}
      className="group flex items-center justify-between gap-2 w-full min-w-0 text-left rounded-lg border-2 px-2.5 py-1.5 transition-all hover:shadow-sm"
      style={{
        borderColor: COLORS.sandLine,
        background: "white",
      }}
      title="Bofya kuhariri / Click to edit"
    >
      <span
        style={{ color: "var(--text-primary)" }}
        className="text-sm font-semibold truncate"
      >
        {prefix}
        {safeValue.toLocaleString()}
      </span>
      <span
        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
        style={{
          background: `${COLORS.gold}15`,
          color: COLORS.gold,
        }}
      >
        <Pencil size={13} />
      </span>
    </button>
  );
}
