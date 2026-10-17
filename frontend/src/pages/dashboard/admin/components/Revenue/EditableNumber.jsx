// ============================================================
// EditableNumber.jsx — Inline-edit numeric value (revert on failure)
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { Check, X, Pencil, Loader2, AlertTriangle } from "lucide-react";
import { COLORS } from "../../shared/constants.js";

export default function EditableNumber({ value, onSave, min = 1, max = 8760, suffix = "", disabled = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { setDraft(String(value ?? "")); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  const startEdit = () => {
    if (disabled) return;
    setDraft(String(value ?? ""));
    setLocalError("");
    setEditing(true);
  };
  const cancel = () => {
    setEditing(false);
    setDraft(String(value ?? ""));
    setLocalError("");
  };

  const commit = async () => {
    const num = Number(String(draft).replace(/[^0-9]/g, ""));
    if (!Number.isFinite(num) || num < min || num > max) { cancel(); return; }
    if (num === Number(value)) { setEditing(false); return; }
    setSaving(true);
    setLocalError("");
    try {
      const res = await onSave(num);
      if (res && typeof res === "object" && res.ok === false) {
        setDraft(String(value ?? ""));
        setLocalError(res.error?.data?.detail || res.error?.message || "Save failed");
        return;
      }
      setEditing(false);
    } catch (err) {
      setDraft(String(value ?? ""));
      setLocalError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    else if (e.key === "Escape") { e.preventDefault(); cancel(); }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEdit}
        disabled={disabled}
        className="group flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#FEA406] transition-colors disabled:opacity-50"
      >
        <span>{value ?? 0}{suffix ? ` ${suffix}` : ""}</span>
        <Pencil size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(e) => { setDraft(e.target.value.replace(/[^0-9]/g, "")); if (localError) setLocalError(""); }}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          disabled={saving}
          className="w-16 rounded-md border px-2 py-1 text-sm text-center outline-none focus:border-[#FEA406]"
          style={{ borderColor: localError ? COLORS.rust : COLORS.sandLine }}
        />
        {suffix && <span className="text-xs text-muted">{suffix}</span>}
        {saving ? (
          <Loader2 size={12} className="animate-spin text-muted" />
        ) : (
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={commit} className="p-1 text-[#2F6D4F] hover:bg-[#2F6D4F]/10 rounded">
            <Check size={12} />
          </button>
        )}
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={cancel} disabled={saving} className="p-1 text-muted hover:text-[#C1502E] rounded">
          <X size={12} />
        </button>
      </div>
      {localError && (
        <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: COLORS.rust }}>
          <AlertTriangle size={10} /> {localError}
        </p>
      )}
    </div>
  );
}
