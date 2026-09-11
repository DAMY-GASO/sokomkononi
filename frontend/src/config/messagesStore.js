// ============================================================
// messagesStore.js
// CHANZO KIMOJA CHA UKWELI kwa mazungumzo/ujumbe (Messages), kwa
// mtindo uleule wa dealsStore.js / notificationsStore.js.
//
// Kabla ya hii, MessagesPage.jsx ilikuwa na SEED_CONVERSATIONS + useState
// ya ndani — hivyo ujumbe mpya haukuweza kuzalisha notification (bell ya
// DashboardShell) wala kuonekana sehemu nyingine yoyote nje ya
// MessagesPage yenyewe. Sasa conversations zinahifadhiwa hapa
// (localStorage + custom event), na kila ujumbe unaoongezwa kwa
// sender:"them" (yaani mwenzake ndiye ametuma) huita moja kwa moja
// notifyNewMessage() kwenye notificationsStore.js.
//
// Backend halisi ikiwepo: badilisha readFromStorage/saveAll ziite API
// (na incoming messages zije kupitia websocket/polling badala ya
// simulateIncomingMessage), bila kugusa UI ya MessagesPage.jsx.
// ============================================================

import { useEffect, useState } from "react";
import { notifyNewMessage } from "./notificationsStore.js";

const STORAGE_KEY = "sokomkononi_messages_v1";
const UPDATE_EVENT = "sokomkononi:messages-updated";

export const SEED_CONVERSATIONS = [
  {
    id: "c1",
    name: "Fatma Juma",
    avatar: "F",
    lastMessage: "Sawa, nitakuja kuona kesho asubuhi.",
    lastAt: "2026-09-13T08:30:00.000Z",
    unread: 2,
    online: true,
    messages: [
      { id: "m1", sender: "them", text: "Habari, nyumba bado ipo?", at: "2026-09-12T10:00:00.000Z", read: true },
      { id: "m2", sender: "me", text: "Habari Fatma, ndiyo bado ipo.", at: "2026-09-12T10:05:00.000Z", read: true },
      { id: "m3", sender: "them", text: "Naomba kuja kuiona kesho.", at: "2026-09-13T08:28:00.000Z", read: false },
      { id: "m4", sender: "them", text: "Sawa, nitakuja kuona kesho asubuhi.", at: "2026-09-13T08:30:00.000Z", read: false },
    ],
  },
  {
    id: "c2",
    name: "Hamisi Rajabu",
    avatar: "H",
    lastMessage: "Asante kwa maelezo, nitafikiria.",
    lastAt: "2026-09-12T16:00:00.000Z",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", sender: "them", text: "Gari hii mileage ni kiasi gani?", at: "2026-09-11T14:00:00.000Z", read: true },
      { id: "m2", sender: "me", text: "85,000 km, single owner.", at: "2026-09-11T14:05:00.000Z", read: true },
      { id: "m3", sender: "them", text: "Asante kwa maelezo, nitafikiria.", at: "2026-09-12T16:00:00.000Z", read: true },
    ],
  },
  {
    id: "c3",
    name: "Neema Mushi",
    avatar: "N",
    lastMessage: "Tumekubaliana kwenye bei.",
    lastAt: "2026-09-10T11:00:00.000Z",
    unread: 0,
    online: true,
    messages: [
      { id: "m1", sender: "them", text: "Tumekubaliana kwenye bei TZS 14,200,000.", at: "2026-09-10T11:00:00.000Z", read: true },
      { id: "m2", sender: "me", text: "Sahihi kabisa.", at: "2026-09-10T11:03:00.000Z", read: true },
    ],
  },
  {
    id: "c4",
    name: "Peter Lema",
    avatar: "P",
    lastMessage: "Je, naweza kuja na mtu wa kuthibitisha hati?",
    lastAt: "2026-09-09T15:30:00.000Z",
    unread: 1,
    online: false,
    messages: [
      { id: "m1", sender: "them", text: "Habari, kiwanja hiki kina hati miliki?", at: "2026-09-09T15:00:00.000Z", read: true },
      { id: "m2", sender: "me", text: "Ndiyo, kina hati miliki kamili.", at: "2026-09-09T15:10:00.000Z", read: true },
      { id: "m3", sender: "them", text: "Je, naweza kuja na mtu wa kuthibitisha hati?", at: "2026-09-09T15:30:00.000Z", read: false },
    ],
  },
];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_CONVERSATIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_CONVERSATIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_CONVERSATIONS;
    return parsed;
  } catch {
    return SEED_CONVERSATIONS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Soma conversations za sasa (snapshot moja, si reactive). */
export function getConversations() {
  return readFromStorage();
}

/**
 * Hook ya React — hutumika kwenye MessagesPage.jsx. Inajisasisha yenyewe
 * papo hapo popote sendMessage()/markConversationRead() zinapoitwa,
 * hivyo bell ya DashboardShell na badge ya "Ujumbe" hazihitaji reload.
 */
export function useConversations() {
  const [conversations, setConversations] = useState(() => getConversations());

  useEffect(() => {
    const sync = () => setConversations(getConversations());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return conversations;
}

/**
 * Tuma ujumbe kwenye mazungumzo. sender ni "me" (mtumiaji wa sasa
 * anatuma) au "them" (mwenzake ndiye ametuma — hii ndiyo huzalisha
 * notification, mfano wa backend kutuma webhook/socket event).
 */
export function sendMessage(conversationId, text, sender = "me") {
  const trimmed = (text || "").trim();
  if (!trimmed) return getConversations();

  const current = getConversations();
  const convo = current.find((c) => c.id === conversationId);
  if (!convo) return current;

  const at = new Date().toISOString();
  const newMessage = { id: `m_${Date.now()}`, sender, text: trimmed, at, read: sender === "me" };

  const next = current.map((c) =>
    c.id === conversationId
      ? {
          ...c,
          lastMessage: trimmed,
          lastAt: at,
          unread: sender === "them" ? (c.unread || 0) + 1 : c.unread,
          messages: [...c.messages, newMessage],
        }
      : c
  );
  saveAll(next);

  if (sender === "them") {
    notifyNewMessage({ conversationId, senderName: convo.name, preview: trimmed });
  }

  return next;
}

/** Weka mazungumzo fulani kama yamesomwa (unread -> 0). */
export function markConversationRead(conversationId) {
  const next = getConversations().map((c) =>
    c.id === conversationId ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, read: true })) } : c
  );
  saveAll(next);
  return next;
}

/**
 * DEMO PEKEE: inaiga mwenzake akituma ujumbe (backend halisi ikiwepo,
 * hii inaondolewa na inabadilishwa na tukio halisi la websocket/polling
 * — sendMessage(id, text, "them") ndiyo itaendelea kuitwa palepale).
 */
export function simulateIncomingMessage(conversationId, text) {
  return sendMessage(conversationId, text, "them");
}
