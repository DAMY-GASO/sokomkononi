// ============================================================
// EditableNumber.jsx
// Kama EditableAmount lakini BILA TZS prefix.
// Inatumika kwa "hours" (muda), sio fedha.
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { COLORS } from "../../dashboard/components/shared.js";

export default function EditableNumber({
  value,
  onSave,
  min = 1,
  max = 8760,
  suffix = "",
  disabled = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(String(value ?? ""));
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (disabled) return;
    setDraft(String(value ?? ""));
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(String(value ?? ""));
  };

  const commit = async () => {
    const num = Number(String(draft).replace(/[^0-9]/g, ""));
    if (!Number.isFinite(num) || num < min || num > max) {
      cancel();
      return;
    }
    if (num === Number(value)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(num);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEdit}
        disabled={disabled}
        className="group flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#E8A33D] transition-colors disabled:opacity-50"
      >
        <span>
          {value ?? 0}
          {suffix ? ` ${suffix}` : ""}
        </span>
        <Pencil
          size={11}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        disabled={saving}
        className="w-16 rounded-md border px-2 py-1 text-sm text-center outline-none focus:border-[#E8A33D]"
        style={{ borderColor: COLORS.sandLine }}
      />
      {suffix && (
        <span className="text-xs text-muted">{suffix}</span>
      )}
      {saving ? (
        <Loader2 size={12} className="animate-spin text-muted" />
      ) : (
        <button
          type="button"
          onClick={commit}
          className="p-1 text-[#2F6D4F] hover:bg-[#2F6D4F]/10 rounded transition-colors"
          aria-label="Save"
        >
          <Check size={12} />
        </button>
      )}
      <button
        type="button"
        onClick={cancel}
        disabled={saving}
        className="p-1 text-muted hover:text-[#C1502E] rounded transition-colors"
        aria-label="Cancel"
      >
        <X size={12} />
      </button>
    </div>
  );
}