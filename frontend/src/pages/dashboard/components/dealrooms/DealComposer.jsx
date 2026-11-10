import React from "react";
import { COLORS } from "../shared";
import { Lock, Paperclip, Send, X } from "lucide-react";

export default function DealComposer({ attachInputRef, attachPreview, chatError, clearAttachment, deal, handleAttachChange, handleSend, isLocked, lang, setChatError, setText, text }) {
  return (
    <>
{/* Composer — kuzimwa kama locked au cancelled */}
      {deal.status !== "declined" &&
        deal.status !== "cancelled" &&
        !isLocked && (
          <div
            style={{ borderColor: COLORS.sandLine, background: "white" }}
            className="flex flex-col gap-2 p-3 border-t"
          >
            {attachPreview && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img
                    src={attachPreview}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearAttachment}
                    style={{ background: COLORS.night, color: "white" }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    aria-label={lang === "sw" ? "Ondoa picha" : "Remove image"}
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
            <input
              ref={attachInputRef}
              type="file"
              accept="image/*"
              onChange={handleAttachChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => attachInputRef.current?.click()}
              style={{ color: COLORS.night, borderColor: COLORS.sandLine }}
              className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0"
              aria-label={lang === "sw" ? "Ambatanisha picha" : "Attach image"}
            >
              <Paperclip size={16} />
            </button>
            <input
              style={{
                background: COLORS.sand,
                borderColor: COLORS.sandLine,
                color: COLORS.night,
              }}
              className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none"
              placeholder={
                lang === "sw" ? "Andika ujumbe..." : "Type a message..."
              }
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (chatError) setChatError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
            </div>
          </div>
        )}

      {/* ── MPYA: badala ya composer kama locked ── */}
      {isLocked && deal.status !== "cancelled" && (
        <div
          style={{
            borderColor: "rgba(232,163,61,0.4)",
            background: "rgba(232,163,61,0.08)",
          }}
          className="border-t px-3 sm:px-4 py-3 flex items-center justify-center gap-2 text-xs font-medium"
        >
          <Lock size={13} color="#8A5A16" />
          <span style={{ color: "#8A5A16" }}>
            {lang === "sw"
              ? "Ujumbe umezimwa — room imesimamishwa na msimamizi."
              : "Messaging is disabled — room is suspended by admin."}
          </span>
        </div>
      )}
    </>
  );
}
