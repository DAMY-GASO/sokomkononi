import React, { useState } from "react";
import { Save, Pencil } from "lucide-react";
import { COLORS } from "../shared/constants.js";

export default function EditableAmount({ value, onSave, prefix = "TZS " }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-24 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none"
          autoFocus
        />
        <button
          onClick={() => {
            onSave(Number(draft));
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
        setDraft(value);
        setEditing(true);
      }}
      className="flex items-center gap-1.5 group"
    >
      <span style={{ color: COLORS.night }} className="text-sm font-semibold">
        {prefix}
        {value.toLocaleString()}
      </span>
      <Pencil size={12} className="text-gray-300 group-hover:text-gray-500" />
    </button>
  );
}
