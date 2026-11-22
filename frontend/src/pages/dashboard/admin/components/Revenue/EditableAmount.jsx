// ============================================================
// EditableAmount.jsx
// Inline-edit monetary value — reverts on failure, shows inline error.
// ============================================================
import React, { useState } from "react";
import { Save, Pencil, X, Loader2, AlertTriangle } from "lucide-react";
import { COLORS } from "../../shared/constants.js";

function formatWithCommas(value) {
  if (value === "" || value === null || value === undefined) return "";
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}
function parseNumber(value) {
  const digits = String(value).replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export default function EditableAmount({ value, onSave, prefix = "TZS ", error = null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  const safeValue = value ?? 0;
  const errMsg = localError || (error ? String(error) : "");

  const startEditing = () => {
    setDraft(formatWithCommas(safeValue));
    setLocalError("");
    setEditing(true);
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setDraft(raw ? Number(raw).toLocaleString("en-US") : "");
    if (localError) setLocalError("");
  };

  const handleSave = async () => {
    const num = parseNumber(draft);
    if (num === safeValue) { setEditing(false); return; }
    setSaving(true);
    setLocalError("");
    try {
      const res = await onSave(num);
      if (res && typeof res === "object" && res.ok === false) {
        setDraft(formatWithCommas(safeValue));
        setLocalError(
          res.error?.data?.detail || res.error?.message || "Save failed",
        );
        return;
      }
      setEditing(false);
    } catch (err) {
      setDraft(formatWithCommas(safeValue));
      setLocalError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(formatWithCommas(safeValue));
    setLocalError("");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1 w-full min-w-0">
        <div className="flex items-center gap-1.5 w-full min-w-0">
          <input
            type="text"
            inputMode="numeric"
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
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: COLORS.green, color: "white" }}
            className="shrink-0 p-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
            aria-label="Save"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            style={{ background: COLORS.sandLine, color: "var(--text-primary)" }}
            className="shrink-0 p-1.5 rounded-lg hover:opacity-80 disabled:opacity-50"
            aria-label="Cancel"
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
      className="group flex items-center justify-between gap-2 w-full min-w-0 text-left rounded-lg border-2 px-2.5 py-1.5 transition-all hover:shadow-sm"
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      title="Bofya kuhariri / Click to edit"
    >
      <span style={{ color: "var(--text-primary)" }} className="text-sm font-semibold truncate">
        {prefix}{safeValue.toLocaleString()}
      </span>
      <span
        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg"
        style={{ background: `${COLORS.gold}15`, color: COLORS.gold }}
      >
        <Pencil size={13} />
      </span>
    </button>
  );
}
