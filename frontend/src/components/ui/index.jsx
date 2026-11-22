import React from "react";
import { Link } from "react-router-dom";

export const cx = (...c) => c.filter(Boolean).join(" ");

const BTN_VARIANTS = {
  primary:   "btn btn-primary",
  secondary: "btn btn-secondary",
  outline:   "btn btn-outline",
  ghost:     "btn btn-ghost",
  danger:    "btn btn-danger",
};
const BTN_SIZES = { sm: "btn-sm", md: "", lg: "btn-lg" };

export function Button({ as, to, href, variant = "primary", size = "md", leftIcon, rightIcon, loading = false, className = "", children, ...props }) {
  const cls = cx(BTN_VARIANTS[variant] || BTN_VARIANTS.primary, BTN_SIZES[size], className);
  const inner = (
    <>
      {loading ? <Spinner size="sm" /> : leftIcon ? <span className="shrink-0 -ml-0.5">{leftIcon}</span> : null}
      {children}
      {rightIcon && !loading && <span className="shrink-0 -mr-0.5">{rightIcon}</span>}
    </>
  );
  if (to)  return <Link  to={to}  className={cls} {...props}>{inner}</Link>;
  if (href) return <a href={href} className={cls} {...props}>{inner}</a>;
  const Tag = as || "button";
  return <Tag className={cls} disabled={loading || props.disabled} {...props}>{inner}</Tag>;
}

export function Spinner({ size = "md", className = "" }) {
  const s = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" }[size] || "w-5 h-5";
  return (
    <svg className={cx("animate-spin-slow", s, className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Card({ className = "", as: Tag = "div", hover = false, children, ...rest }) {
  return <Tag className={cx("card", hover && "card-hover", className)} {...rest}>{children}</Tag>;
}
export function CardBody({ className = "", children }) { return <div className={cx("p-5", className)}>{children}</div>; }

export function Input({ label, hint, error, leftIcon, rightIcon, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <label htmlFor={inputId} className="block">
      {label && <span className="block mb-1.5 text-sm font-medium text-primary">{label}</span>}
      <span className="relative block">
        {leftIcon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">{leftIcon}</span>}
        <input id={inputId} className={cx("input", leftIcon && "pl-10", rightIcon && "pr-10", className)} {...props} />
        {rightIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{rightIcon}</span>}
      </span>
      {error ? <span className="mt-1.5 block text-xs text-[#C1502E]">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-secondary">{hint}</span> : null}
    </label>
  );
}

export function Textarea({ label, hint, error, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <label htmlFor={inputId} className="block">
      {label && <span className="block mb-1.5 text-sm font-medium text-primary">{label}</span>}
      <textarea id={inputId} className={cx("textarea", className)} {...props} />
      {error ? <span className="mt-1.5 block text-xs text-[#C1502E]">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-secondary">{hint}</span> : null}
    </label>
  );
}

export function Select({ label, error, className = "", id, children, ...props }) {
  const inputId = id || props.name;
  return (
    <label htmlFor={inputId} className="block">
      {label && <span className="block mb-1.5 text-sm font-medium text-primary">{label}</span>}
      <select id={inputId} className={cx("select pr-9", className)} {...props}>{children}</select>
      {error && <span className="mt-1.5 block text-xs text-[#C1502E]">{error}</span>}
    </label>
  );
}

export function Badge({ variant = "default", className = "", children, icon }) {
  const v = { default: "", gold: "badge-gold", royal: "badge-royal", night: "badge-night", success: "badge-success" }[variant] || "";
  return <span className={cx("badge", v, className)}>{icon}{children}</span>;
}

export function Eyebrow({ children, className = "" }) { return <span className={cx("eyebrow", className)}>{children}</span>; }

export function SectionHeader({ eyebrow, title, subtitle, action, align = "left", className = "" }) {
  const center = align === "center";
  return (
    <div className={cx("flex flex-col gap-3 mb-8 sm:mb-10", center ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className={cx("max-w-2xl", center && "mx-auto")}>
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        {title && <h2 className="text-headline text-primary">{title}</h2>}
        {subtitle && <p className="mt-3 text-secondary text-body-sm sm:text-body max-w-xl">{subtitle}</p>}
      </div>
      {action && !center && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Section({ className = "", size = "md", id, children }) {
  return <section id={id} className={cx(size === "lg" ? "section-lg" : "section", className)}><div className="container">{children}</div></section>;
}

export function Divider({ className = "" }) { return <hr className={cx("divider", className)} />; }

export function EmptyState({ icon, title, description, action, className = "" }) {
  return (
    <div className={cx("card p-10 text-center", className)}>
      {icon && <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sand text-secondary">{icon}</div>}
      <h3 className="text-section mb-1.5">{title}</h3>
      {description && <p className="text-secondary text-body-sm mx-auto max-w-md">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
