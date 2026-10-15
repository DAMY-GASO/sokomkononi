// ============================================================
// SkylineDecoration.jsx — shared skyline SVG for auth pages.
// ============================================================
import React from "react";

export default function SkylineDecoration({ fill = "#FEA406" }) {
  return (
    <svg
      viewBox="0 0 400 200"
      className="absolute bottom-0 left-0 w-full h-40 opacity-[0.18]"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect x="0" y="120" width="46" height="80" fill={fill} />
      <rect x="52" y="80" width="34" height="120" fill={fill} />
      <rect x="92" y="140" width="52" height="60" fill={fill} />
      <polygon points="150,100 178,60 206,100" fill={fill} />
      <rect x="150" y="100" width="56" height="100" fill={fill} />
      <rect x="214" y="70" width="30" height="130" fill={fill} />
      <rect x="250" y="130" width="60" height="70" fill={fill} />
      <rect x="316" y="95" width="40" height="105" fill={fill} />
      <rect x="362" y="150" width="38" height="50" fill={fill} />
    </svg>
  );
}
