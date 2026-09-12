import React, { useState } from "react";
import { Save, Pencil } from "lucide-react";
import { COLORS } from "../shared/constants.js";

export default function EditablePercent({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState((value * 100).toString());

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step="0.1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none"
          autoFocus
        />
        <span className="text-sm text-gray-400">%</span>
        <button
          onClick={() => {
            onSave(Number(draft) / 100);
            setEditing(false);
          }}
          style={{ color: COLORS.green }}
        >
          <Save size={15} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft((value * 100).toString());
        setEditing(true);
      }}
      className="flex items-center gap-1.5 group"
    >
      <span style={{ color: COLORS.night }} className="text-sm font-semibold">
        {(value * 100).toFixed(1)}%
      </span>
      <Pencil size={12} className="text-gray-300 group-hover:text-gray-500" />
    </button>
  );
}
