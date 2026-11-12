import React from "react";

const CONFIG = {
  idle:       { label: "Haijaunganishwa", color: "bg-gray-400",  text: "text-gray-700" },
  connecting: { label: "Inaunganisha…",   color: "bg-yellow-400", text: "text-yellow-800" },
  open:       { label: "Imeunganishwa",   color: "bg-green-500",  text: "text-green-800" },
  closed:     { label: "Imefungwa",       color: "bg-gray-400",  text: "text-gray-700" },
  error:      { label: "Hitilafu",         color: "bg-red-500",    text: "text-red-800" },
  failed:     { label: "Imeshindikana",    color: "bg-red-600",    text: "text-red-900" },
};

export default function WebSocketStatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.text} bg-white border border-gray-200`}>
      <span className={`h-2 w-2 rounded-full ${cfg.color}`} />
      {cfg.label}
    </span>
  );
}