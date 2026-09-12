// ============================================================
// EditableAmount.jsx
// Kiasi kinachoweza kuhaririwa — kwa Revenue section.
// Responsive: inafanya kazi kwenye grid-cols-3 ya simu.
// ============================================================

import React, { useState } from "react";
import { Save, Pencil, X } from "lucide-react";
import { COLORS } from "../../shared/constants.js";

export default function EditableAmount({ value, onSave, prefix = "TZS " }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? 0);

  const safeValue = value ?? 0;

  const handleSave = () => {
    const num = Number(draft);
    if (!isNaN(num)) {
      onSave(num);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(safeValue);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 w-full min-w-0">
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
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
      onClick={() => {
        setDraft(safeValue);
        setEditing(true);
      }}
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
