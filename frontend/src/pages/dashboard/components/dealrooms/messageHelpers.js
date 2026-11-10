import { formatTZS } from "../shared";

// ============================================================
// HELPERS
// ============================================================
const fmtDT = (v, lang) =>
  v ? new Date(v).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US") : "";

// Ujumbe wa mfumo (kind === "SYSTEM"): maandishi yanatafsiriwa kwa `systemCode`
function getSystemText(m, lang) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const d = m.systemData || {};
  switch (m.systemCode) {
    case "RESERVATION_PAID":
      return t(
        `Reservation imelipwa. Mali imehifadhiwa${d.expires_at ? ` hadi ${fmtDT(d.expires_at, lang)}` : ""}. Mnunuzi yuko kwenye kipindi cha ukaguzi.`,
        `Reservation paid. The property is held${d.expires_at ? ` until ${fmtDT(d.expires_at, lang)}` : ""}. The buyer is in the inspection period.`
      );
    case "INSPECTION_PASSED":
      return t(
        `Ukaguzi umepita. Mnunuzi anaandaa malipo ya mwisho ya ${formatTZS(Number(d.amount) || 0)} nje ya mfumo na atapakia uthibitisho hapa${d.due_at ? ` kabla ya ${fmtDT(d.due_at, lang)}` : ""}.`,
        `Inspection passed. The buyer is preparing the final payment of ${formatTZS(Number(d.amount) || 0)} outside the platform and will upload proof here${d.due_at ? ` before ${fmtDT(d.due_at, lang)}` : ""}.`
      );
    case "INSPECTION_CANCELLED":
      return t(
        `Mnunuzi ameghairi deal baada ya ukaguzi${d.note ? `. Sababu: ${d.note}` : ""}.`,
        `The buyer cancelled the deal after inspection${d.note ? `. Reason: ${d.note}` : ""}.`
      );
    case "PROOF_SUBMITTED":
      return t(
        `Uthibitisho wa malipo umetumwa${d.reference ? ` (Ref: ${d.reference})` : ""}. Muuzaji ana saa 1 kujibu${d.attempt ? ` (jaribio ${d.attempt}/${d.attempts_max || 3})` : ""}.`,
        `Payment proof submitted${d.reference ? ` (Ref: ${d.reference})` : ""}. The seller has 1 hour to respond${d.attempt ? ` (attempt ${d.attempt}/${d.attempts_max || 3})` : ""}.`
      );
    case "APPEAL_OPENED": {
      const why =
        d.reason === "SELLER_NO_RESPONSE"
          ? t("Muuzaji hakujibu kwa wakati.", "The seller did not respond in time.")
          : d.reason === "PROOF_REJECTED_MAX"
            ? t("Majaribio ya kupakia uthibitisho yameisha.", "All proof upload attempts were used.")
            : d.by === "seller"
              ? t("Muuzaji ameomba msaada.", "The seller asked for help.")
              : t("Mnunuzi ameomba msaada.", "The buyer asked for help.");
      return t(
        `Rufaa imefunguliwa. ${why}${d.note ? ` "${d.note}".` : ""} Timu ya SokoMkononi itaingilia kati.`,
        `An appeal was opened. ${why}${d.note ? ` "${d.note}".` : ""} The SokoMkononi team will step in.`
      );
    }
    case "DISPUTE_RESOLVED":
      return d.resolution === "COMPLETED"
        ? t(
            `Admin ametatua mgogoro: muamala umekamilika.${d.note ? ` ${d.note}` : ""}`,
            `The admin resolved the dispute: the transaction is completed.${d.note ? ` ${d.note}` : ""}`
          )
        : t(
            `Admin ametatua mgogoro: muamala umeghairiwa.${d.note ? ` ${d.note}` : ""}`,
            `The admin resolved the dispute: the transaction is cancelled.${d.note ? ` ${d.note}` : ""}`
          );
    case "PAYMENT_WINDOW_EXPIRED":
      return t(
        `Muda wa kulipa (saa ${d.window_hours || 72}) umeisha. Deal imeghairiwa na mali imerudi sokoni.`,
        `The payment window (${d.window_hours || 72}h) expired. The deal was cancelled and the listing is back on the market.`
      );
    case "PROOF_REJECTED":
      return t(
        `Muuzaji bado hajapokea malipo${d.reason ? `. Sababu: ${d.reason}` : ""}. Tafadhali pakia uthibitisho tena${d.attempts_left != null ? ` (majaribio yaliyobaki: ${d.attempts_left})` : ""}.`,
        `The seller has not received payment yet${d.reason ? `. Reason: ${d.reason}` : ""}. Please re-upload proof${d.attempts_left != null ? ` (attempts left: ${d.attempts_left})` : ""}.`
      );
    case "COMPLETED":
      return t(
        "Muamala umekamilika! Malipo yamethibitishwa. Angalia My Transactions kwa risiti.",
        "Transaction completed! Payment confirmed. Check My Transactions for the receipt."
      );
    case "DISPUTED": {
      const base =
        d.decision === "REQUEST_NEGOTIATION"
          ? t("Mnunuzi ameomba kujadiliana tena baada ya ukaguzi.", "The buyer asked to renegotiate after inspection.")
          : d.decision === "NOT_AS_DESCRIBED"
            ? t("Mnunuzi ameripoti kuwa mali si kama ilivyoelezwa.", "The buyer reported the property is not as described.")
            : t("Mgogoro umeripotiwa.", "A dispute has been reported.");
      const tail = t(
        " Timu ya SokoMkononi itaingilia kati kusaidia kutatua.",
        " The SokoMkononi team will step in to help resolve it."
      );
      return `${base}${d.note ? ` ${t("Sababu", "Reason")}: ${d.note}.` : ""}${tail}`;
    }
    default:
      return typeof m.text === "string" ? m.text : m.text?.[lang] || m.text?.sw || "";
  }
}

export function getMessageText(m, lang) {
  if (m.kind === "SYSTEM") return getSystemText(m, lang);
  if (!m.text) return "";
  if (typeof m.text === "string") return m.text;
  return m.text?.[lang] || m.text?.sw || "";
}

// Saa ya kutumwa (mf. 14:05) — kwa saa za kifaa cha mtumiaji
export function formatMsgTime(at) {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return da.toDateString() === db.toDateString();
}

export function formatDayLabel(at, lang) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())
    return lang === "sw" ? "Leo" : "Today";
  if (d.toDateString() === yesterday.toDateString())
    return lang === "sw" ? "Jana" : "Yesterday";
  return d.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-GB", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

// Inaunganisha data ya seva na ujumbe wa ndani ambao bado haujafika
// (unatumwa / umeshindwa) ili polling isiufute.
export function mergeServerDeal(prev, serverDeal) {
  if (!serverDeal) return prev;
  if (!Array.isArray(serverDeal.messages)) return { ...prev, ...serverDeal };
  const serverMsgs = serverDeal.messages;
  const pendingLocal = (prev?.messages || []).filter(
    (m) =>
      (m.sendStatus === "failed" || m.sendStatus === "sending") &&
      !serverMsgs.some((s) => String(s.id) === String(m.id))
  );
  return { ...prev, ...serverDeal, messages: [...serverMsgs, ...pendingLocal] };
}
