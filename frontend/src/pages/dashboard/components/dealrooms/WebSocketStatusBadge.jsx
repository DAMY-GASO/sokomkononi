import React from "react";

const CONFIG = {
  idle:       { label: "Haijaunganishwa", color: "bg-muted",  text: "text-primary" },
  connecting: { label: "Inaunganisha…",   color: "bg-yellow-400", text: "text-yellow-800" },
  open:       { label: "Imeunganishwa",   color: "bg-green-500",  text: "text-green-800" },
  closed:     { label: "Imefungwa",       color: "bg-muted",  text: "text-primary" },
  error:      { label: "Hitilafu",         color: "bg-rust",    text: "text-red-800" },
  failed:     { label: "Imeshindikana",    color: "bg-red-600",    text: "text-red-900" },
};

export default function WebSocketStatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.text} bg-card border border-hairline`}>
      <span className={`h-2 w-2 rounded-full ${cfg.color}`} />
      {cfg.label}
    </span>
  );
}