// ============================================================
// SectionHeader.jsx
// Kichwa cha kila section — kwa title + subtitle.
// Centered kwa muonekano wa kisasa.
// ============================================================

import React from "react";
import { FONTS } from "./constants.js";

export default function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5 text-center">
      <h1
        style={{ fontFamily: FONTS.display }}
        className="text-2xl sm:text-3xl font-semibold text-gray-800"
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-gray-500 text-sm mt-0.5 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
