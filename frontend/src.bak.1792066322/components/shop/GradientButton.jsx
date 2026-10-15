import React from "react";
import { Link } from "react-router-dom";

export default function GradientButton({
  to, onClick, type = "button", children, disabled,
  size = "md", variant = "gradient", className = "", fullWidth = false,
}) {
  const sizes = {
    sm: "px-3.5 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-sm sm:text-base",
  };
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold " +
    "transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed " +
    sizes[size];

  const style =
    variant === "gradient"
      ? { background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)", color: "#011957" }
      : variant === "dark"
        ? { background: "#011957", color: "#FFFFFF" }
        : { background: "transparent", color: "currentColor", border: "1px solid rgba(255,255,255,0.35)" };

  const classes = `${base} ${fullWidth ? "w-full" : ""} ${className}`;

  if (to) {
    return <Link to={to} className={classes} style={style}>{children}</Link>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} style={style}>
      {children}
    </button>
  );
}
