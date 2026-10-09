// src/components/Revenue/PackageRow.jsx
// ============================================================
// PackageRow — mstari mmoja wa package (Boost/Leading/Advertisement).
// Inaruhusu kuhariri: jina, muda, bei.
// Ina toggle (is_active) na delete.
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { Pencil, Check, X, Loader2, Trash2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import EditableAmount from "./EditableAmount.jsx";

function formatTZS(amount) {
  return "TZS " + Math.round(Number(amount) || 0).toLocaleString("en-US");
}

// ------------------------------------------------------------
// Editable text (kwa jina la package)
// ------------------------------------------------------------
function EditableName({ value, onSave, disabled, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = async () => {
    const next = (draft || "").trim();
    if (!next || next === value) {
      setEditing(false);
      setDraft(value || "");
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value || "");
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => !disabled && setEditing(true)}
        disabled={disabled}
        className="group flex items-center gap-1.5 text-sm font-medium text-primary hover:text-[#E8A33D] transition-colors disabled:opacity-50"
      >
        <span className="truncate">{value || placeholder || "—"}</span>
        <Pencil size={11} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { e.preventDefault(); cancel(); }
        }}
        onBlur={commit}
        disabled={saving}
        placeholder={placeholder}
        className="w-full max-w-[200px] rounded-md border px-2 py-1 text-sm outline-none focus:border-[#E8A33D]"
        style={{ borderColor: COLORS.sandLine }}
      />
      {saving ? (
        <Loader2 size={12} className="animate-spin text-muted shrink-0" />
      ) : (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
          className="p-1 text-[#2F6D4F] hover:bg-[#2F6D4F]/10 rounded transition-colors shrink-0"
        >
          <Check size={12} />
        </button>
      )}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={cancel}
        disabled={saving}
        className="p-1 text-muted hover:text-[#C1502E] rounded transition-colors shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ------------------------------------------------------------
// PackageRow
// ------------------------------------------------------------
export default function PackageRow({
  pkg,
  lang,
  onUpdateName,
  onUpdatePrice,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
  isUpdatingName,
  accentColor,
  showDelete = true,
  t,
}) {
  return (
    <div className="py-3 flex items-center gap-2 flex-wrap">
      {/* Jina + muda */}
      <div className="flex-1 min-w-0">
        <EditableName
          value={pkg.name}
          onSave={onUpdateName}
          disabled={isUpdatingName}
          placeholder={t("Jina la package", "Package name")}
        />
        <p className="text-[10px] text-muted mt-0.5">
          {pkg.hours}h ({pkg.days} {t("siku", "days")})
          {pkg.pricing?.discount_percent > 0 && (
            <span
              style={{ background: `${COLORS.rust}15`, color: COLORS.rust }}
              className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            >
              -{pkg.pricing.discount_percent}%
            </span>
          )}
        </p>
      </div>

      {/* Bei + toggle + delete */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end gap-0.5">
          {pkg.pricing?.discount_percent > 0 && (
            <span className="text-[10px] text-muted line-through">
              {formatTZS(pkg.pricing.base_price)}
            </span>
          )}
          <EditableAmount
            value={pkg.pricing?.discount_percent > 0 ? pkg.pricing.final_price : pkg.price}
            onSave={onUpdatePrice}
          />
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={pkg.isActive}
          onClick={onToggle}
          disabled={isToggling}
          className="relative inline-flex items-center h-5 w-9 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          style={{ background: pkg.isActive ? COLORS.green : "#D1D5DB" }}
        >
          <span
            className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform"
            style={{ transform: pkg.isActive ? "translateX(18px)" : "translateX(3px)" }}
          />
        </button>

        {showDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="p-1.5 text-muted hover:text-[#C1502E] rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            aria-label={t("Futa", "Delete")}
          >
            {isDeleting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}