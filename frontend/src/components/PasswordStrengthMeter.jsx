import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { CHART } from "../pages/dashboard/admin/shared/chartColors.js";
import { COLORS } from "../pages/dashboard/components/shared.js";

const COMMON = new Set(["password","password1","12345678","123456789","qwerty123","qwertyuiop","admin123","letmein","welcome","iloveyou","abc12345","11111111","tanzania","sokomkononi","changeme","football","monkey123"]);

function score(pw = "") {
  if (!pw) return { level: 0, key: "", color: CHART.slateLight };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (COMMON.has(pw.toLowerCase())) s = 0;
  if (/^\d+$/.test(pw)) s = Math.min(s, 1);
  if (s <= 2) return { level: 1, key: "weak", color: COLORS.rust };
  if (s <= 3) return { level: 2, key: "fair", color: COLORS.goldInk };
  if (s <= 4) return { level: 3, key: "good", color: COLORS.green };
  return { level: 4, key: "strong", color: COLORS.green };
}

export default function PasswordStrengthMeter({ value }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const s = score(value);
  if (!value) return null;
  const label = { weak: t("Dhaifu", "Weak"), fair: t("Wastani", "Fair"), good: t("Nzuri", "Good"), strong: t("Imara", "Strong") }[s.key];
  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1 rounded-full overflow-hidden bg-[color:rgb(var(--c-hairline))]">
        {[1, 2, 3, 4].map((i) => (<div key={i} className="flex-1 transition-colors duration-300" style={{ background: i <= s.level ? s.color : "transparent" }} />))}
      </div>
      <p className="mt-1.5 text-xs" style={{ color: s.color }}>
        {label}
        {s.level <= 2 && <span className="ml-2 text-muted">{t("Tumia herufi 12+ (kubwa na ndogo), namba na alama.", "Use 12+ chars (upper+lower), number and symbol.")}</span>}
      </p>
    </div>
  );
}
