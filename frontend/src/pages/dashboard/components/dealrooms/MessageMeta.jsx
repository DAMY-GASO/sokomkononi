import React from "react";
import { AlertCircle, Check, CheckCheck, Clock, RotateCcw } from "lucide-react";
import { COLORS } from "../shared";
import { formatMsgTime } from "./messageHelpers.js";

// Muda + alama ya hali chini ya kila ujumbe
export default function MessageMeta({ m, mine, lang, onRetry }) {
  const time = formatMsgTime(m.at);
  const sendStatus = m.sendStatus || "sent";
  const isRead = !!(m.readAt || m.read_at || m.isRead || m.read || m.seenAt);
  const isDelivered = !!(m.deliveredAt || m.delivered_at);

  if (mine && sendStatus === "failed") {
    return (
      <div
        className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium"
        style={{ color: COLORS.rust }}
      >
        <AlertCircle size={12} />
        <span>{lang === "sw" ? "Haikutumwa" : "Not sent"}</span>
        <button
          type="button"
          onClick={() => onRetry?.(m.id)}
          className="underline font-semibold inline-flex items-center gap-0.5"
        >
          <RotateCcw size={10} />
          {lang === "sw" ? "Jaribu tena" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 mt-0.5 text-[11px]"
      style={{ color: "rgba(16,26,46,0.5)" }}
    >
      {time && <span>{time}</span>}
      {mine && sendStatus === "sending" && (
        <>
          <Clock size={11} />
          <span>{lang === "sw" ? "Inatuma..." : "Sending..."}</span>
        </>
      )}
      {mine && sendStatus !== "sending" && (
        isRead ? (
          <CheckCheck
            size={13}
            color={COLORS.green}
            aria-label={lang === "sw" ? "Imesomwa" : "Read"}
          />
        ) : isDelivered ? (
          <CheckCheck
            size={13}
            aria-label={lang === "sw" ? "Imefika" : "Delivered"}
          />
        ) : (
          <Check
            size={13}
            aria-label={lang === "sw" ? "Imetumwa" : "Sent"}
          />
        )
      )}
    </div>
  );
}
