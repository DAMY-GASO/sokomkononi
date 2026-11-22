import React from "react";
import { COLORS } from "../shared";
import MessageMeta from "./MessageMeta.jsx";
import OfferBubble from "./OfferBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import { formatDayLabel, getMessageText, isSameDay } from "./messageHelpers.js";

export default function DealMessageList({
  acceptedAnchorExists,
  acceptedAnchorId,
  acceptedNotice,
  deal,
  lang,
  onRetryMessage,
  typing,
}) {
  return (
    <>
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-2.5"
        style={{ background: COLORS.sand }}
      >
        {deal.messages.map((m, idx) => {
          const text = getMessageText(m, lang);
          const prevMsg = idx > 0 ? deal.messages[idx - 1] : null;
          const showDaySeparator =
            !!m.at && (!prevMsg || !isSameDay(prevMsg.at, m.at));
          const mine = m.sender === "me";
          const isAdminMessage =
            m.sender === "admin" || m.kind === "ADMIN";
          const isSystemMessage =
            m.sender === "system" || m.kind === "SYSTEM";

          const bubble = isSystemMessage ? (
            <div key={m.id} className="flex justify-center my-1">
              <div className="border border-[color:rgb(var(--c-hairline))] bg-card text-primary rounded-xl px-3.5 py-2 max-w-[90%] text-body-sm text-center font-medium">
                {text}
              </div>
            </div>
          ) : isAdminMessage ? (
            <div key={m.id} className="flex justify-center my-1">
              <div className="border border-[color:rgb(var(--c-hairline))] bg-card text-primary rounded-xl px-3.5 py-2 max-w-[90%] text-body-sm text-center font-medium">
                <span style={{ color: COLORS.rust }} className="font-bold">
                  SokoMkononi Admin:{" "}
                </span>
                {text}
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col max-w-[75%] ${
                  mine ? "items-end" : "items-start"
                }`}
              >
                {m.offerAmount ? (
                  <OfferBubble
                    amount={m.offerAmount}
                    mine={mine}
                    lang={lang}
                  />
                ) : (
                  <div
                    style={{
                      background: mine ? COLORS.night : "white",
                      color: mine ? COLORS.sand : COLORS.night,
                      borderColor: COLORS.sandLine,
                      opacity: m.sendStatus === "sending" ? 0.7 : 1,
                    }}
                    className="border rounded-2xl px-4 py-2.5 text-sm break-words"
                  >
                    {m.imageUrl && (
                      <a
                        href={m.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <img
                          src={m.imageUrl}
                          alt=""
                          className={`rounded-lg max-w-full max-h-64 object-cover ${
                            text ? "mb-2" : ""
                          }`}
                        />
                      </a>
                    )}
                    {text}
                  </div>
                )}
                <MessageMeta
                  m={m}
                  mine={mine}
                  lang={lang}
                  onRetry={(msgId) => onRetryMessage?.(deal.id, msgId)}
                />
              </div>
            </div>
          );

          return (
            <React.Fragment key={m.id}>
              {showDaySeparator && (
                <div className="flex justify-center my-1">
                  <span
                    style={{
                      background: "rgba(16,26,46,0.06)",
                      color: "rgba(16,26,46,0.55)",
                    }}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  >
                    {formatDayLabel(m.at, lang)}
                  </span>
                </div>
              )}
              {bubble}
              {acceptedAnchorExists &&
                String(m.id) === String(acceptedAnchorId) &&
                acceptedNotice}
            </React.Fragment>
          );
        })}

        {/* Fallback: ofa iliyokubaliwa haipo kwenye orodha — weka mwishoni */}
        {!acceptedAnchorExists && acceptedNotice}

        {/* Typing indicator — chini ya ujumbe wote */}
        <TypingIndicator
          active={!!typing?.is_typing}
          name={typing?.user_name}
        />
      </div>
    </>
  );
}