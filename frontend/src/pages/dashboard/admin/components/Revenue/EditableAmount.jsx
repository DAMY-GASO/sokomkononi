// ============================================================
// EditableAmount.jsx
// Kiasi kinachoweza kuhaririwa — kwa Revenue section.
// Responsive: inafanya kazi kwenye grid-cols-3 ya simu.
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

  if (editing) {
    return (
      <div className="flex items-center gap-1 w-full min-w-0">
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="flex-1 min-w-0 text-xs sm:text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#E8A33D]"
          autoFocus
        />
        <button
          onClick={handleSave}
          style={{ color: COLORS.green }}
          className="shrink-0 p-0.5 hover:opacity-80 transition-opacity"
          aria-label="Save"
        >
          <Save size={15} />
        </button>
        <button
          onClick={handleCancel}
          className="shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cancel"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEditing}
      className="flex items-center gap-1.5 group w-full min-w-0 text-left"
    >
      <span
        style={{ color: COLORS.night }}
        className="text-xs sm:text-sm font-semibold truncate"
      >
        {prefix}
        {safeValue.toLocaleString()}
      </span>
      <Pencil
        size={12}
        className="text-gray-300 group-hover:text-gray-500 shrink-0"
      />
    </button>
  );
}
