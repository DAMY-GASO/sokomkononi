// ============================================================
// RevealPasswordInput.jsx — input ya nenosiri yenye kitufe cha jicho
// (onyesha / ficha). Inapokea props zote za <input> (value, onChange,
// autoComplete, placeholder, disabled, className, style, ...).
// ============================================================
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function RevealPasswordInput({
  lang = "sw",
  className = "",
  style,
  wrapperClassName = "",
  disabled,
  ...inputProps
}) {
  const [show, setShow] = useState(false);
  const sw = lang === "sw";
  const label = show
    ? sw ? "Ficha nenosiri" : "Hide password"
    : sw ? "Onyesha nenosiri" : "Show password";

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        {...inputProps}
        disabled={disabled}
        type={show ? "text" : "password"}
        className={className}
        // inline ili padding ya kulia ishinde class yoyote ya `.input`
        style={{ ...style, paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        // usipoteze focus ya input kwa kubonyeza jicho
        onMouseDown={(e) => e.preventDefault()}
        disabled={disabled}
        aria-label={label}
        aria-pressed={show}
        title={label}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-secondary disabled:opacity-50"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
