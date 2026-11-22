import React from "react";

export default function TypingIndicator({ active, name = "Mtu" }) {
  if (!active) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 text-xs text-gray-500 italic">
      <span>{name} anaandika</span>
      <span className="flex gap-0.5">
        <span className="h-1 w-1 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1 w-1 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1 w-1 rounded-full bg-gray-400 animate-bounce" />
      </span>
    </div>
  );
}