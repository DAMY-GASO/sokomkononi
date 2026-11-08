import React from "react";
import { Shield } from "lucide-react";
import { COLORS, formatTZS, resolveSender, toneText } from "./constants.js";

function textOf(message, lang) {
  if (!message.text) return "";
  if (typeof message.text === "string") return message.text;
  return message.text?.[lang] || message.text?.sw || "";
}

// Ujumbe wa mfumo una maandishi ya akiba ya lugha mbili: "Kiswahili / English"
function systemTextOf(message, lang) {
  const raw = textOf(message, lang);
  const parts = raw.split(" / ");
  if (parts.length === 2) return lang === "sw" ? parts[0] : parts[1];
  return raw;
}

export default function MessageBubble({ message, deal, lang = "sw" }) {
  if (message.kind === "SYSTEM" || message.sender === "system") {
    return (
      <div className="flex justify-center my-0.5">
        <div className="max-w-[90%] rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card px-2.5 py-1.5 text-center text-[11px] font-medium text-primary">
          {systemTextOf(message, lang)}
        </div>
      </div>
    );
  }

  // Ujumbe ghafi wa seva hauna `sender` ya maandishi: tumia kind na senderId
  const sid = message.senderId ?? message.sender_id;
  const sameId = (a, b) => a != null && b != null && String(a) === String(b);
  const who =
    message.kind === "ADMIN" || message.sender === "admin"
      ? "admin"
      : sameId(sid, deal?.sellerId)
        ? "seller"
        : sameId(sid, deal?.buyerId)
          ? "buyer"
          : resolveSender(message.sender, deal);
  const imageUrl = message.imageUrl || message.attachment_url || message.attachmentUrl || null;
  const isAdmin = who === "admin";
  const isSeller = who === "seller";
  const isOffer = Boolean(message.offerAmount);
  const roleLabel = isAdmin ? "Admin" : isSeller ? (lang === "sw" ? "Muuzaji" : "Seller") : (lang === "sw" ? "Mnunuzi" : "Buyer");
  const tone = isAdmin ? COLORS.rust : isSeller ? COLORS.gold : COLORS.green;
  const toneInk = toneText(tone); // toleo la maandishi linalosomeka light/dark
  const body = textOf(message, lang) || (message.offerAmount ? (lang === "sw" ? `Ofa ya ${formatTZS(message.offerAmount)}` : `Offer of ${formatTZS(message.offerAmount)}`) : "");
  const when = message.at ? new Date(message.at).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : null;

  return (
    <div className={`flex gap-2 ${isSeller ? "flex-row-reverse" : ""}`}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold" style={{ background: `${tone}22`, color: toneInk }}>
        {isAdmin ? <Shield size={11} /> : roleLabel.charAt(0).toUpperCase()}
      </span>
      <div className={`min-w-0 max-w-[85%] flex-1 rounded-xl border px-2.5 py-1.5 ${isSeller ? "ml-auto" : ""}`}
           style={{ background: isAdmin ? `${COLORS.rust}0D` : isOffer ? `${COLORS.gold}14` : "rgb(var(--c-card))",
                    borderColor: isAdmin ? `${COLORS.rust}30` : isOffer ? `${COLORS.gold}40` : "rgb(var(--c-hairline))" }}>
        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: toneInk }}>{roleLabel}</span>
          {isOffer && <span className="text-[9px] font-bold uppercase text-danger">• {lang === "sw" ? "Ofa" : "Offer"}</span>}
          {when && <span className="ml-auto text-[9px] text-muted">{when}</span>}
        </div>
        {imageUrl && (
          <a href={imageUrl} target="_blank" rel="noreferrer" className="mb-1 block">
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              className="max-h-48 w-auto max-w-full rounded-lg border border-[color:rgb(var(--c-hairline))] object-cover"
            />
          </a>
        )}
        {body && <p className="break-words text-xs leading-snug text-primary">{body}</p>}
      </div>
    </div>
  );
}