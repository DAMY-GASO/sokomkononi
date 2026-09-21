// ============================================================
// EditablePercent.jsx
// Asilimia inayoweza kuhaririwa — kwa Revenue section.
// Kipenseli kinaonekana wazi — msimamizi anaweza kuliona haraka.
// Responsive: inafanya kazi kwenye grid-cols-3 ya simu.
// ============================================================

import React, { useState } from "react";
import { Save, Pencil, X } from "lucide-react";
import { COLORS } from "../../shared/constants.js";

export default function EditablePercent({ value, onSave }) {
  const safeValue = value ?? 0;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState((safeValue * 100).toString());

  const startEditing = () => {
    setDraft((safeValue * 100).toString());
    setEditing(true);
  };

  const handleChange = (e) => {
    // Ruhusu digits na decimal moja tu
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    const cleaned =
      parts.length > 1
        ? `${parts[0]}.${parts.slice(1).join("")}`
        : parts[0];
    setDraft(cleaned);
  };

  const handleSave = () => {
    const num = Number(draft);
    if (!isNaN(num) && num >= 0) {
      onSave(num / 100);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft((safeValue * 100).toString());
    setEditing(false);
  };

  // ============================================================
  // EDITING MODE — input + % + save/cancel buttons
  // ============================================================
  if (editing) {
    return (
      <div className="flex items-center gap-1.5 w-full min-w-0">
        <input
          type="text"
          inputMode="decimal"
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
        <span
          className="text-sm font-semibold shrink-0"
          style={{ color: "var(--text-primary)" }}
        >
          %
        </span>
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
  // DISPLAY MODE — asilimia + kipenseli kinachoonekana
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
        {(safeValue * 100).toFixed(1)}%
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
