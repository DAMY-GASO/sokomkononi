import React, { useState } from "react";
import {
  ArrowLeft,
  Send,
  Check,
  X,
  HandCoins,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { COLORS, FONTS, getCategory, formatTZS, timeAgo } from "./shared";

const DEAL_STATUS = {
  negotiating: { label: "Inaendelea", bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  offer_sent: { label: "Ofa Imetumwa", bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
  accepted: { label: "Imekubaliwa", bg: "rgba(47,109,79,0.16)", fg: COLORS.green },
  declined: { label: "Imekataliwa", bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
  reserved: { label: "Reservation Imewekwa", bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
};

// Mock deal rooms. In a wired-up app these would come from the same
// listings the seller has posted, matched with buyer inquiries.
const SEED_DEALS = [
  {
    id: "d1",
    listingTitle: "Nyumba ya Ghorofa Mbezi Beach",
    category: "nyumba",
    askingPrice: 85000000,
    counterpartyName: "Fatma Juma",
    status: "negotiating",
    currentOffer: 78000000,
    offerFrom: "them",
    messages: [
      { id: "m1", sender: "them", text: "Habari, nyumba bado ipo? Ninavutiwa sana.", at: "2026-09-08T09:00:00.000Z" },
      { id: "m2", sender: "me", text: "Habari Fatma, ndiyo bado ipo. Karibu kwa maelezo zaidi.", at: "2026-09-08T09:05:00.000Z" },
      { id: "m3", sender: "them", text: "Naomba nitoe ofa ya TZS 78,000,000.", at: "2026-09-08T09:07:00.000Z", offerAmount: 78000000 },
    ],
  },
  {
    id: "d2",
    listingTitle: "Toyota Harrier 2016",
    category: "magari",
    askingPrice: 42000000,
    counterpartyName: "Hamisi Rajabu",
    status: "offer_sent",
    currentOffer: 39500000,
    offerFrom: "me",
    messages: [
      { id: "m1", sender: "them", text: "Gari hii mileage ni kiasi gani hasa?", at: "2026-09-06T14:00:00.000Z" },
      { id: "m2", sender: "me", text: "85,000 km, single owner, huduma zote zipo kwenye vitabu.", at: "2026-09-06T14:10:00.000Z" },
      { id: "m3", sender: "me", text: "Nimetuma ofa ya TZS 39,500,000 kama punguzo dogo.", at: "2026-09-06T14:12:00.000Z", offerAmount: 39500000 },
    ],
  },
  {
    id: "d3",
    listingTitle: "Duka la Vifaa vya Ujenzi — Kariakoo",
    category: "biashara",
    askingPrice: 15000000,
    counterpartyName: "Neema Mushi",
    status: "accepted",
    currentOffer: 14200000,
    offerFrom: "them",
    messages: [
      { id: "m1", sender: "them", text: "Tumekubaliana kwenye bei TZS 14,200,000, sahihi?", at: "2026-09-02T11:00:00.000Z", offerAmount: 14200000 },
      { id: "m2", sender: "me", text: "Sahihi kabisa, tunaendelea na hatua inayofuata.", at: "2026-09-02T11:03:00.000Z" },
    ],
  },
];

function DealListItem({ deal, active, onSelect }) {
  const category = getCategory(deal.category);
  const Icon = category?.icon;
  const status = DEAL_STATUS[deal.status];
  const lastMessage = deal.messages[deal.messages.length - 1];

  return (
    <button
      onClick={() => onSelect(deal.id)}
      style={{
        background: active ? "white" : "transparent",
        borderColor: COLORS.sandLine,
      }}
      className="w-full flex items-start gap-3 p-3 rounded-xl border text-left"
    >
      <div
        style={{ background: COLORS.night }}
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
      >
        {Icon && <Icon size={16} color={COLORS.gold} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p style={{ color: COLORS.night }} className="text-sm font-semibold truncate">
            {deal.counterpartyName}
          </p>
          <span style={{ color: "rgba(16,26,46,0.4)" }} className="text-[10px] shrink-0">
            {timeAgo(lastMessage.at)}
          </span>
        </div>
        <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs truncate mb-1.5">
          {deal.listingTitle}
        </p>
        <span
          style={{ background: status.bg, color: status.fg }}
          className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
        >
          {status.label}
        </span>
      </div>
    </button>
  );
}

function OfferBubble({ amount, mine }) {
  return (
    <div
      style={{
        background: mine ? COLORS.gold : "white",
        borderColor: COLORS.sandLine,
      }}
      className="border rounded-2xl px-4 py-3 max-w-[75%] flex items-center gap-2"
    >
      <HandCoins size={16} color={mine ? COLORS.night : COLORS.rust} />
      <div>
        <p style={{ color: mine ? COLORS.night : "rgba(16,26,46,0.55)" }} className="text-[11px]">
          Ofa
        </p>
        <p style={{ color: mine ? COLORS.night : COLORS.rust }} className="text-sm font-bold">
          {formatTZS(amount)}
        </p>
      </div>
    </div>
  );
}

function DealDetail({ deal, side, onBack, onSendMessage, onSendOffer, onRespond }) {
  const [text, setText] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const category = getCategory(deal.category);
  const status = DEAL_STATUS[deal.status];
  const counterpartyLabel = side === "seller" ? "Mnunuzi" : "Muuzaji";

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(deal.id, text.trim());
    setText("");
  };

  const handleOffer = () => {
    const value = parseInt(offerAmount.replace(/\D/g, ""), 10);
    if (!value) return;
    onSendOffer(deal.id, value);
    setOfferAmount("");
    setOfferOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="flex items-center gap-3 border-b p-3 sm:p-4"
      >
        <button onClick={onBack} className="md:hidden shrink-0" aria-label="Rudi">
          <ArrowLeft size={18} color={COLORS.night} />
        </button>
        <div
          style={{ background: COLORS.night }}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        >
          {category?.icon && <category.icon size={15} color={COLORS.gold} />}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: COLORS.night }} className="text-sm font-semibold truncate">
            {deal.counterpartyName}{" "}
            <span style={{ color: "rgba(16,26,46,0.4)" }} className="font-normal">
              · {counterpartyLabel}
            </span>
          </p>
          <p style={{ color: "rgba(16,26,46,0.5)" }} className="text-xs truncate flex items-center gap-1">
            <MapPin size={10} /> {deal.listingTitle}
          </p>
        </div>
        <span
          style={{ background: status.bg, color: status.fg }}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
        >
          {status.label}
        </span>
      </div>

      {/* Price strip */}
      <div
        style={{ background: COLORS.sandLine }}
        className="flex items-center justify-between px-4 py-2 text-xs"
      >
        <span style={{ color: "rgba(16,26,46,0.6)" }}>Bei Iliyowekwa: {formatTZS(deal.askingPrice)}</span>
        <span style={{ color: COLORS.rust }} className="font-semibold">
          Ofa ya Sasa: {formatTZS(deal.currentOffer)}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-2.5" style={{ background: COLORS.sand }}>
        {deal.messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
            {m.offerAmount ? (
              <OfferBubble amount={m.offerAmount} mine={m.sender === "me"} />
            ) : (
              <div
                style={{
                  background: m.sender === "me" ? COLORS.night : "white",
                  color: m.sender === "me" ? COLORS.sand : COLORS.night,
                  borderColor: COLORS.sandLine,
                }}
                className="border rounded-2xl px-4 py-2.5 max-w-[75%] text-sm"
              >
                {m.text}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Accept / decline row, only while negotiating */}
      {(deal.status === "negotiating" || deal.status === "offer_sent") && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t"
        >
          <button
            onClick={() => onRespond(deal.id, "accepted")}
            style={{ background: COLORS.green, color: "white" }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
          >
            <Check size={13} /> Kubali Ofa ya {formatTZS(deal.currentOffer)}
          </button>
          <button
            onClick={() => onRespond(deal.id, "declined")}
            style={{ borderColor: "rgba(193,80,46,0.35)", color: COLORS.rust }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border"
          >
            <X size={13} /> Kataa
          </button>
          <button
            onClick={() => setOfferOpen((v) => !v)}
            style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border ml-auto"
          >
            <HandCoins size={13} /> Toa Ofa Nyingine
            <ChevronDown size={12} style={{ transform: offerOpen ? "rotate(180deg)" : "none" }} />
          </button>
        </div>
      )}

      {offerOpen && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t"
        >
          <input
            style={{ background: COLORS.sand, borderColor: COLORS.sandLine, color: COLORS.night }}
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
            placeholder="Kiasi cha ofa (TZS)"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
          />
          <button
            onClick={handleOffer}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0"
          >
            Tuma Ofa
          </button>
        </div>
      )}

      {deal.status === "accepted" && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "rgba(47,109,79,0.08)" }}
          className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <span style={{ color: COLORS.green }} className="text-xs font-medium">
            Mmekubaliana kwenye {formatTZS(deal.currentOffer)}. Hatua inayofuata ni reservation.
          </span>
          <button
            onClick={() => onRespond(deal.id, "reserved")}
            style={{ background: COLORS.green, color: "white" }}
            className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0"
          >
            Weka Reservation
          </button>
        </div>
      )}

      {/* Composer */}
      {deal.status !== "reserved" && deal.status !== "declined" && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex items-center gap-2 p-3 border-t"
        >
          <input
            style={{ background: COLORS.sand, borderColor: COLORS.sandLine, color: COLORS.night }}
            className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none"
            placeholder="Andika ujumbe..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            aria-label="Tuma"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function DealRooms({ side = "seller" }) {
  const [deals, setDeals] = useState(SEED_DEALS);
  const [selectedId, setSelectedId] = useState(SEED_DEALS[0]?.id ?? null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const selectedDeal = deals.find((d) => d.id === selectedId);

  const updateDeal = (id, patch) =>
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const handleSelect = (id) => {
    setSelectedId(id);
    setMobileShowDetail(true);
  };

  const handleSendMessage = (id, text) => {
    const deal = deals.find((d) => d.id === id);
    updateDeal(id, {
      messages: [...deal.messages, { id: `m_${Date.now()}`, sender: "me", text, at: new Date().toISOString() }],
    });
  };

  const handleSendOffer = (id, amount) => {
    const deal = deals.find((d) => d.id === id);
    updateDeal(id, {
      currentOffer: amount,
      offerFrom: "me",
      status: "offer_sent",
      messages: [
        ...deal.messages,
        { id: `m_${Date.now()}`, sender: "me", text: "", at: new Date().toISOString(), offerAmount: amount },
      ],
    });
  };

  const handleRespond = (id, newStatus) => {
    const deal = deals.find((d) => d.id === id);
    const note =
      newStatus === "accepted"
        ? `Ofa ya ${formatTZS(deal.currentOffer)} imekubaliwa.`
        : newStatus === "declined"
        ? "Ofa imekataliwa."
        : "Reservation imewekwa — angalia My Transactions kwa hatua inayofuata.";
    updateDeal(id, {
      status: newStatus,
      messages: [...deal.messages, { id: `m_${Date.now()}`, sender: "me", text: note, at: new Date().toISOString() }],
    });
  };

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }} className="w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="p-4 sm:p-6 pb-0">
        <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold mb-1">
          Deal Rooms
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-4">
          {side === "seller"
            ? "Negotiate moja kwa moja na wanunuzi wenye nia ya mali yako."
            : "Negotiate moja kwa moja na wauzaji wa mali unazovutiwa nazo."}
        </p>
      </div>

      <div className="flex" style={{ height: "560px" }}>
        {/* List pane */}
        <div
          style={{ borderColor: COLORS.sandLine }}
          className={`${mobileShowDetail ? "hidden" : "flex"} md:flex flex-col w-full md:w-80 shrink-0 border-r px-3 sm:px-4 pb-4 gap-2 overflow-y-auto`}
        >
          {deals.map((d) => (
            <DealListItem key={d.id} deal={d} active={d.id === selectedId} onSelect={handleSelect} />
          ))}
        </div>

        {/* Detail pane */}
        <div className={`${mobileShowDetail ? "flex" : "hidden"} md:flex flex-1 min-w-0 flex-col`}>
          {selectedDeal ? (
            <DealDetail
              deal={selectedDeal}
              side={side}
              onBack={() => setMobileShowDetail(false)}
              onSendMessage={handleSendMessage}
              onSendOffer={handleSendOffer}
              onRespond={handleRespond}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-sm">
                Chagua deal room kuanza mazungumzo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
