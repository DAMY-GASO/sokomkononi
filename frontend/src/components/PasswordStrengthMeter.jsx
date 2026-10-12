// ============================================================
// PasswordStrengthMeter.jsx — client-side feedback
// ============================================================
import React from "react";
import { COLORS } from "../pages/dashboard/components/shared";

// Rough rules mirroring Django CommonPasswordValidator + NumericPasswordValidator
const COMMON = new Set([
  "password","password1","12345678","123456789","qwerty123","qwertyuiop",
  "admin123","letmein","welcome","iloveyou","abc12345","11111111",
  "tanzania","sokomkononi","changeme","football","monkey123",
]);

function score(pw = "") {
  if (!pw) return { level: 0, label: "", color: "#9CA3AF" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (COMMON.has(pw.toLowerCase())) s = 0;
  if (/^\d+$/.test(pw)) s = Math.min(s, 1);

  if (s <= 2) return { level: 1, label: "Weak", color: COLORS.rust };
  if (s <= 4) return { level: 2, label: "Fair", color: "#D97706" };
  if (s <= 5) return { level: 3, label: "Good", color: COLORS.green };
  return { level: 4, label: "Strong", color: COLORS.green };
}

export default function PasswordStrengthMeter({ value, lang = "sw" }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const s = score(value);
  if (!value) return null;

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 rounded-full transition-colors"
               style={{ background: i <= s.level ? s.color : "#E5E7EB" }} />
        ))}
      </div>
      <p className="text-[11px] mt-1" style={{ color: s.color }}>
        {s.label === "Weak" ? t("Dhaifu", "Weak") :
         s.label === "Fair" ? t("Wastani", "Fair") :
         s.label === "Good" ? t("Nzuri", "Good") :
                             t("Imara", "Strong")}
        {s.level <= 2 && (
          <span className="ml-2 text-muted">
            {t("Tumia herufi 12+, kubwa na ndogo, namba na alama.",
               "Use 12+ chars, upper+lower, number, symbol.")}
          </span>
        )}
      </p>
    </div>
  );
}
