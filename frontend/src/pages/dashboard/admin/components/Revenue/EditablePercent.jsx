// ============================================================
// EditablePercent.jsx
// Inline-edit percentage — reverts on failure, shows inline error.
// ============================================================
import React, { useState } from "react";
import { Save, Pencil, X, Loader2, AlertTriangle } from "lucide-react";
import { COLORS } from "../../shared/constants.js";

export default function EditablePercent({ value, onSave, error = null }) {
  const safeValue = value ?? 0;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState((safeValue * 100).toString());
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  const errMsg = localError || (error ? String(error) : "");

  const startEditing = () => {
    setDraft((safeValue * 100).toString());
    setLocalError("");
    setEditing(true);
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    const cleaned = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : parts[0];
    setDraft(cleaned);
    if (localError) setLocalError("");
  };

  const handleSave = async () => {
    const num = Number(draft);
    if (isNaN(num) || num < 0) { handleCancel(); return; }
    if (num / 100 === safeValue) { setEditing(false); return; }
    setSaving(true);
    setLocalError("");
    try {
      const res = await onSave(num / 100);
      if (res && typeof res === "object" && res.ok === false) {
        setDraft((safeValue * 100).toString());
        setLocalError(res.error?.data?.detail || res.error?.message || "Save failed");
        return;
      }
      setEditing(false);
    } catch (err) {
      setDraft((safeValue * 100).toString());
      setLocalError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft((safeValue * 100).toString());
    setLocalError("");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1 w-full min-w-0">
        <div className="flex items-center gap-1.5 w-full min-w-0">
          <input
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !saving) handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            disabled={saving}
            autoFocus
            className="flex-1 min-w-0 text-sm font-semibold border-2 rounded-lg px-2.5 py-1.5 outline-none transition-colors disabled:opacity-50"
            style={{
              borderColor: errMsg ? COLORS.rust : COLORS.gold,
              background: `${errMsg ? COLORS.rust : COLORS.gold}08`,
              color: "var(--text-primary)",
            }}
          />
          <span className="text-sm font-semibold shrink-0" style={{ color: "var(--text-primary)" }}>%</span>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: COLORS.green, color: "white" }}
            className="shrink-0 p-1.5 rounded-lg disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            style={{ background: COLORS.sandLine, color: "var(--text-primary)" }}
            className="shrink-0 p-1.5 rounded-lg disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>
        {errMsg && (
          <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: COLORS.rust }}>
            <AlertTriangle size={10} /> {errMsg}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={startEditing}
      className="group flex items-center justify-between gap-2 w-full min-w-0 text-left rounded-lg border-2 px-2.5 py-1.5 hover:shadow-sm"
      style={{ borderColor: COLORS.sandLine, background: "white" }}
    >
      <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
        {(safeValue * 100).toFixed(1)}%
      </span>
      <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: `${COLORS.gold}15`, color: COLORS.gold }}>
        <Pencil size={13} />
      </span>
    </button>
  );
}
