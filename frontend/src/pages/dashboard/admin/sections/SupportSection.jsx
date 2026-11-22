// ============================================================
// SupportSection.jsx
// Admin — Customer Care (tickets + feedback).
// Bilingual + mobile-responsive + Async actions na rollback.
//
// ✅ MPYA:
//   - Inasoma ?ticket={id} kutoka URL (kutoka notification)
//   - Inafungua ticket husika + ina-scroll
//   - Inahydrate tickets kwenye mount (na refresh kila 30s kama ipo wazi)
//   - Badge ya "NEW" kwa tickets zisizo na assignment na zilizo OPEN
// ============================================================

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Trash2, Clock, User, Send, CheckCircle,
  ChevronDown, ChevronUp, Paperclip, Headphones, Inbox,
  UserCheck, Loader2, MessageSquare, AlertTriangle,
  Lightbulb, Star, RefreshCw, Zap, Reply,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useTickets,
  addTicketMessageAsync,
  updateTicketStatusAsync,
  updateTicketPriorityAsync,
  removeTicketAsync,
  hydrateTicketsFromApi,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../../../../config/ticketsStore.js";
import {
  useFeedback,
  respondToFeedbackAsync,
  removeFeedbackAsync,
  FEEDBACK_TYPES,
} from "../../../../config/feedbackStore.js";

// ============================================================
// COLOR MAPS
// ============================================================
const COLOR_MAP = {
  gray: { bg: "rgba(1,25,87,0.08)", fg: COLORS.night },
  gold: { bg: "rgba(254,164,6,0.16)", fg: COLORS.goldText },
  rust: { bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
  green: { bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  blue: { bg: "rgba(0,98,253,0.12)", fg: COLORS.royal },
  night: { bg: "rgba(1,25,87,0.08)", fg: COLORS.night },
};

const FEEDBACK_ICONS = { MessageSquare, AlertTriangle, Lightbulb, Star };

const FEEDBACK_STATUS_META = {
  new: { label: { sw: "Mpya", en: "New" }, bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
  read: { label: { sw: "Imesomwa", en: "Read" }, bg: "rgba(254,164,6,0.16)", fg: COLORS.goldText },
  answered: { label: { sw: "Imejibiwa", en: "Answered" }, bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  archived: { label: { sw: "Imewekwa kwenye kumbukumbu", en: "Archived" }, bg: "rgba(1,25,87,0.08)", fg: COLORS.night },
};

// ============================================================
// ATTACHMENT PREVIEW
// ============================================================
function AttachmentPreview({ att }) {
  if (!att?.url) return null;
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-xs text-primary bg-card rounded-lg px-2.5 py-1.5 hover:bg-page transition-colors w-full min-w-0"
    >
      {att.isImage ? (
        <img src={att.url} alt={att.name} className="w-9 h-9 rounded object-cover shrink-0" />
      ) : (
        <Paperclip size={12} className="text-muted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-xs">{att.name}</p>
        {att.uploadedByName && (
          <p className="text-xs text-muted truncate">{att.uploadedByName}</p>
        )}
      </div>
    </a>
  );
}


// ============================================================
// CANNED RESPONSES (templates za majibu)
// - Defaults zimejengwa ndani (SW/EN)
// - Custom templates zinahifadhiwa kwenye localStorage ya browser hii
//   (si za pamoja kati ya staff — zikihitajika kushirikiwa, backend
//   endpoint inahitajika).
// ============================================================
const CANNED_STORAGE_KEY = "smk_admin_canned_responses_v1";

const DEFAULT_CANNED = [
  {
    id: "d-received",
    label: { sw: "Tumepokea ombi", en: "Request received" },
    text: {
      sw: "Habari, asante kwa kuwasiliana nasi. Tumepokea ombi lako na tunalifanyia kazi. Tutakujulisha hivi karibuni.",
      en: "Hello, thank you for contacting us. We have received your request and are working on it. We will update you shortly.",
    },
  },
  {
    id: "d-more-info",
    label: { sw: "Tunahitaji taarifa zaidi", en: "Need more info" },
    text: {
      sw: "Ili tukusaidie vizuri, tafadhali tuma taarifa zaidi kuhusu tatizo lako (picha/skrini, namba ya muamala, au maelezo ya kina).",
      en: "To help you better, please send more details about your issue (screenshots, transaction number, or a detailed description).",
    },
  },
  {
    id: "d-refund",
    label: { sw: "Refund inashughulikiwa", en: "Refund in progress" },
    text: {
      sw: "Ombi lako la refund linashughulikiwa. Utapokea taarifa pindi malipo yatakapokamilika.",
      en: "Your refund request is being processed. You will be notified once the payment is completed.",
    },
  },
  {
    id: "d-resolved",
    label: { sw: "Tatizo limetatuliwa", en: "Issue resolved" },
    text: {
      sw: "Tatizo lako limetatuliwa. Tafadhali tujulishe kama bado unahitaji msaada wowote.",
      en: "Your issue has been resolved. Please let us know if you need any further help.",
    },
  },
];

function loadCustomCanned() {
  try {
    const raw = localStorage.getItem(CANNED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((c) => c && typeof c.text === "string" && c.text.trim())
      : [];
  } catch {
    return [];
  }
}

function saveCustomCanned(list) {
  try {
    localStorage.setItem(CANNED_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage haipatikani — templates zitadumu kwa session hii tu */
  }
}

function useCannedResponses() {
  const [custom, setCustom] = useState(loadCustomCanned);

  // Sawazisha kati ya TicketCard nyingi / tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CANNED_STORAGE_KEY) setCustom(loadCustomCanned());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = (label, text) => {
    const item = {
      id: `c-${Date.now()}`,
      label: label.trim() || text.trim().slice(0, 30),
      text: text.trim(),
    };
    setCustom((prev) => {
      const next = [...prev, item];
      saveCustomCanned(next);
      return next;
    });
  };

  const remove = (id) => {
    setCustom((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveCustomCanned(next);
      return next;
    });
  };

  return { custom, add, remove };
}

function CannedPicker({ lang, currentText = "", onPick, disabled = false }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const { custom, add, remove } = useCannedResponses();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 8, bottom: 8 });
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  // Popover inatumia position: fixed ili isikatwe na `overflow-hidden`
  // ya kadi ya ticket.
  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const width = 256; // w-64
      setPos({
        left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
        bottom: window.innerHeight - r.top + 8,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const items = [
    ...DEFAULT_CANNED.map((d) => ({
      id: d.id,
      label: d.label[lang] || d.label.sw,
      text: d.text[lang] || d.text.sw,
      removable: false,
    })),
    ...custom.map((c) => ({
      id: c.id,
      label: c.label,
      text: c.text,
      removable: true,
    })),
  ];

  const handleSaveCurrent = () => {
    const text = currentText.trim();
    if (!text) return;
    const label = window.prompt(
      t("Jina la template:", "Template name:"),
      text.slice(0, 30)
    );
    if (label === null) return;
    add(label, text);
  };

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        disabled={disabled}
        title={t("Majibu ya haraka", "Canned responses")}
        aria-label={t("Majibu ya haraka", "Canned responses")}
        className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-secondary border disabled:opacity-50"
        style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
      >
        <Zap size={14} />
      </button>

      {open && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: "rgb(var(--c-card))",
            position: "fixed",
            left: pos.left,
            bottom: pos.bottom,
          }}
          className="z-50 w-64 max-w-[calc(100vw-16px)] rounded-xl border shadow-lg p-1.5"
        >
          <p className="text-xs font-semibold text-secondary uppercase px-2 py-1">
            {t("Majibu ya haraka", "Canned responses")}
          </p>
          <div className="max-h-56 overflow-y-auto">
            {items.map((it) => (
              <div
                key={it.id}
                className="group flex items-center gap-1 rounded-lg hover:bg-page"
              >
                <button
                  type="button"
                  onClick={() => {
                    onPick(it.text);
                    setOpen(false);
                  }}
                  className="flex-1 min-w-0 text-left px-2 py-1.5"
                >
                  <p className="text-xs font-semibold text-primary truncate">
                    {it.label}
                  </p>
                  <p className="text-xs text-muted line-clamp-2 break-words">
                    {it.text}
                  </p>
                </button>
                {it.removable && (
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    aria-label={t("Ondoa template", "Remove template")}
                    className="p-1.5 text-muted hover:text-rust shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSaveCurrent}
            disabled={!currentText.trim()}
            className="w-full mt-1 text-xs font-semibold px-2 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
          >
            {t("Hifadhi andiko la sasa kama template", "Save current text as template")}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FEEDBACK ANALYTICS — rating trend (miezi 6) + mgawanyo wa nyota
// Inahesabiwa kwenye client kutoka kwa feedback iliyopo (createdAt + rating).
// ============================================================
function FeedbackAnalytics({ feedback, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [open, setOpen] = useState(true);

  const { months, dist, ratedCount, overall } = useMemo(() => {
    const rated = feedback.filter(
      (f) => f.rating != null && f.createdAt && !Number.isNaN(new Date(f.createdAt).getTime())
    );

    // miezi 6 ya mwisho (ikiwemo huu)
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-US", {
          month: "short",
        }),
        sum: 0,
        count: 0,
      });
    }
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    rated.forEach((f) => {
      const d = new Date(f.createdAt);
      const b = byKey[`${d.getFullYear()}-${d.getMonth()}`];
      if (b) {
        b.sum += f.rating;
        b.count += 1;
      }
      const r = Math.round(Number(f.rating));
      if (distribution[r] != null) distribution[r] += 1;
      total += Number(f.rating);
    });

    return {
      months: buckets.map((b) => ({
        ...b,
        avg: b.count ? b.sum / b.count : null,
      })),
      dist: distribution,
      ratedCount: rated.length,
      overall: rated.length ? total / rated.length : null,
    };
  }, [feedback, lang]);

  if (ratedCount === 0) return null;

  // Mwelekeo: mwezi wa mwisho wenye data vs ule uliotangulia wenye data
  const withData = months.filter((m) => m.avg != null);
  const last = withData[withData.length - 1];
  const prev = withData[withData.length - 2];
  const delta = last && prev ? last.avg - prev.avg : null;
  const maxDist = Math.max(...Object.values(dist), 1);
  const BAR_H = 72;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
      className="rounded-xl border p-3 sm:p-4 mb-5 w-full min-w-0"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">
            {t("Uchambuzi wa Rating", "Rating Analytics")}
          </p>
          <p className="text-xs text-muted">
            {t(
              `Wastani ${overall.toFixed(1)}/5 kutoka maoni ${ratedCount}`,
              `Average ${overall.toFixed(1)}/5 from ${ratedCount} ratings`
            )}
            {delta != null && (
              <span
                style={{ color: delta >= 0 ? COLORS.green : COLORS.rust }}
                className="font-semibold ml-1"
              >
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}{" "}
                {t("dhidi ya mwezi uliopita", "vs previous month")}
              </span>
            )}
          </p>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-muted shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-muted shrink-0" />
        )}
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
          {/* Trend */}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-secondary uppercase mb-2">
              {t("Mwelekeo (miezi 6)", "Trend (6 months)")}
            </p>
            <div className="flex items-end justify-between gap-1.5" style={{ height: BAR_H + 34 }}>
              {months.map((m) => (
                <div key={m.key} className="flex-1 min-w-0 flex flex-col items-center justify-end">
                  <span className="text-xs font-bold text-primary mb-0.5">
                    {m.avg != null ? m.avg.toFixed(1) : "—"}
                  </span>
                  <div
                    title={
                      m.avg != null
                        ? `${m.label}: ${m.avg.toFixed(2)} (${m.count})`
                        : m.label
                    }
                    style={{
                      height: m.avg != null ? Math.max(3, (m.avg / 5) * BAR_H) : 3,
                      background: m.avg != null ? COLORS.gold : COLORS.sandLine,
                    }}
                    className="w-full max-w-[28px] rounded-t"
                  />
                  <span className="text-xs text-muted mt-1 truncate w-full text-center">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution */}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-secondary uppercase mb-2">
              {t("Mgawanyo wa nyota", "Star distribution")}
            </p>
            <div className="flex flex-col gap-1.5">
              {[5, 4, 3, 2, 1].map((n) => (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-6 flex items-center gap-0.5 text-secondary shrink-0">
                    {n}
                    <Star size={10} fill={COLORS.gold} color={COLORS.gold} />
                  </span>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ background: COLORS.sandLine }}
                  >
                    <div
                      style={{
                        width: `${(dist[n] / maxDist) * 100}%`,
                        background: COLORS.gold,
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                  <span className="w-6 text-right text-muted shrink-0">
                    {dist[n]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TICKET CARD
// ============================================================
function TicketCard({
  ticket,
  lang,
  defaultExpanded = false,
  highlight = false,
  selectable = false,
  selected = false,
  onToggleSelect,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (defaultExpanded) setExpanded(true);
  }, [defaultExpanded]);

  const category = TICKET_CATEGORIES.find((c) => c.key === ticket.category);
  const priority = TICKET_PRIORITIES.find((p) => p.key === ticket.priority);
  const status = TICKET_STATUSES.find((s) => s.key === ticket.status);

  const catColors = COLOR_MAP[category?.color] || COLOR_MAP.night;
  const priColors = COLOR_MAP[priority?.color] || COLOR_MAP.gold;
  const statusColors = COLOR_MAP[status?.color] || COLOR_MAP.rust;

  const isBusy = (key) => !!busy[key];

  // ✅ Badge ya NEW kwa ticket OPEN bila assignment
  const isNew = ticket.status === "open" && !ticket.assignedTo;

  const handleSendReply = async () => {
    const hasText = replyText.trim().length > 0;
    const hasFiles = replyFiles.length > 0;
    if ((!hasText && !hasFiles) || isBusy("reply")) return;
    setBusy((b) => ({ ...b, reply: true }));
    setError("");

    const res = await addTicketMessageAsync(ticket.id, {
      text: replyText.trim(),
      files: replyFiles.map((f) => f.file || f),
    });

    setBusy((b) => {
      const next = { ...b };
      delete next.reply;
      return next;
    });

    if (res.ok) {
      setReplyText("");
      setReplyFiles([]);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kutuma jibu.", "Failed to send reply.")
      );
    }
  };

  const handleFilesPicked = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";

    const wrapped = await Promise.all(
      picked.map(async (f) => {
        let preview = null;
        if (f.type?.startsWith("image/")) {
          preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(f);
          });
        }
        return { file: f, name: f.name, type: f.type, preview };
      })
    );

    setReplyFiles((prev) => [...prev, ...wrapped].slice(0, 5));
  };

  const removeReplyFile = (i) => {
    setReplyFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleStatusChange = async (newStatus) => {
    if (isBusy(`status-${newStatus}`)) return;
    setBusy((b) => ({ ...b, [`status-${newStatus}`]: true }));
    setError("");
    const res = await updateTicketStatusAsync(ticket.id, newStatus);
    setBusy((b) => {
      const next = { ...b };
      delete next[`status-${newStatus}`];
      return next;
    });
    if (!res.ok)
      setError(
        res.error?.message ||
          t("Imeshindwa kubadilisha hali.", "Failed to change status.")
      );
  };

  const handlePriorityChange = async (newPriority) => {
    if (isBusy("priority")) return;
    setBusy((b) => ({ ...b, priority: true }));
    setError("");
    const res = await updateTicketPriorityAsync(ticket.id, newPriority);
    setBusy((b) => {
      const next = { ...b };
      delete next.priority;
      return next;
    });
    if (!res.ok)
      setError(
        res.error?.message ||
          t("Imeshindwa kubadilisha kipaumbele.", "Failed to change priority.")
      );
  };

  const handleRemove = async () => {
    if (!window.confirm(t("Ondoa ticket hii?", "Remove this ticket?"))) return;
    if (isBusy("remove")) return;
    setBusy((b) => ({ ...b, remove: true }));
    setError("");
    const res = await removeTicketAsync(ticket.id);
    setBusy((b) => {
      const next = { ...b };
      delete next.remove;
      return next;
    });
    if (!res.ok)
      setError(res.error?.message || t("Imeshindwa kuondoa.", "Failed to remove."));
  };

  const handleResolve = () => handleStatusChange("resolved");
  const handleClose = () => handleStatusChange("closed");
  const handleReopen = () => handleStatusChange("open");

  return (
    <div
      id={`ticket-${ticket.id}`}
      style={{
        borderColor: highlight ? COLORS.gold : COLORS.sandLine,
        background: "rgb(var(--c-card))",
        boxShadow: highlight ? `0 0 0 2px ${COLORS.gold}40` : "none",
      }}
      className="rounded-xl border overflow-hidden w-full max-w-full min-w-0 transition-shadow"
    >
      <div className="p-3 sm:p-4 w-full min-w-0">
        <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect?.(ticket.id)}
              disabled={ticket.status === "closed"}
              aria-label={t("Chagua ticket", "Select ticket")}
              className="w-4 h-4 mt-2.5 rounded shrink-0 disabled:opacity-40"
            />
          )}
          <div
            style={{ background: catColors?.bg || COLORS.sand }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <Headphones size={16} color={catColors.fg} />
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {/* ✅ Badge ya NEW */}
              {isNew && (
                <span
                  style={{ background: COLORS.rust, color: "white" }}
                  className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                >
                  NEW
                </span>
              )}
              <span className="text-xs font-bold text-muted shrink-0 whitespace-nowrap">
                {ticket.code || ticket.id}
              </span>
              <span
                style={{ background: catColors?.bg, color: catColors?.fg }}
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {category?.label?.[lang] || ticket.category}
              </span>
              <span
                style={{ background: priColors?.bg, color: priColors?.fg }}
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {priority?.label?.[lang] || ticket.priority}
              </span>
              <span
                style={{ background: statusColors?.bg, color: statusColors?.fg }}
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {status?.label?.[lang] || ticket.status}
              </span>
              {ticket.slaOverdue && (
                <span
                  style={{ background: "rgba(193,80,46,0.2)", color: COLORS.rust }}
                  className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                >
                  ⏰ {t("SLA IMEPITA", "SLA OVERDUE")}
                </span>
              )}
            </div>

            <p className="text-sm font-semibold truncate w-full">
              {ticket.subject}
            </p>

            <div className="flex items-center gap-2 mt-1 text-xs text-secondary flex-wrap">
              <span className="flex items-center gap-1 min-w-0">
                <User size={12} className="shrink-0" />
                <span className="truncate">{ticket.userName}</span>
              </span>
              <span className="text-muted shrink-0">•</span>
              <span className="flex items-center gap-1 shrink-0">
                <Clock size={12} />
                {timeAgo(ticket.createdAt, lang)}
              </span>
              {ticket.assignedToName && (
                <>
                  <span className="text-muted shrink-0">•</span>
                  <span className="flex items-center gap-1 min-w-0">
                    <UserCheck size={12} className="shrink-0" />
                    <span className="truncate">{ticket.assignedToName}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-muted hover:text-secondary shrink-0"
            aria-label={expanded ? "Funga" : "Fungua"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="border-t p-3 sm:p-4 flex flex-col gap-3 w-full max-w-full min-w-0 overflow-hidden"
        >
          {error && (
            <div
              style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
            >
              {error}
            </div>
          )}

          {/* Conversation */}
          <div className="min-w-0 w-full">
            <p className="text-xs font-semibold text-secondary uppercase mb-2">
              {t("Mazungumzo", "Conversation")}
            </p>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {ticket.messages?.map((msg) => {
                const isAdmin = msg.from === "admin";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      style={{
                        background: isAdmin ? COLORS.night : "rgb(var(--c-card))",
                        color: isAdmin ? COLORS.sand : "var(--text-primary)",
                        borderColor: COLORS.sandLine,
                      }}
                      className="border rounded-2xl px-3 py-2 max-w-[85%] text-xs min-w-0"
                    >
                      <p
                        className="font-semibold mb-0.5 text-xs uppercase"
                        style={{
                          color: isAdmin ? "rgba(244,247,252,0.6)" : "var(--text-muted)",
                        }}
                      >
                        {msg.senderName}
                      </p>
                      {msg.text && msg.text !== "[attachment]" && (
                        <p className="leading-relaxed break-words" style={{ color: "inherit" }}>
                          {msg.text}
                        </p>
                      )}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-1.5 flex flex-col gap-1">
                          {msg.attachments.map((att) => (
                            <AttachmentPreview key={att.id} att={att} />
                          ))}
                        </div>
                      )}
                      <p
                        className="text-xs mt-1"
                        style={{
                          color: isAdmin ? "rgba(244,247,252,0.5)" : "var(--text-muted)",
                        }}
                      >
                        {timeAgo(msg.at, lang)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          {ticket.status !== "closed" && (
            <>
              <div className="flex items-center gap-2 min-w-0 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFilesPicked}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy("reply")}
                  title={t("Ambatisha faili", "Attach files")}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-muted hover:text-secondary border"
                  style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
                >
                  <Paperclip size={14} />
                </button>
                <CannedPicker
                  lang={lang}
                  currentText={replyText}
                  disabled={isBusy("reply")}
                  onPick={(text) =>
                    setReplyText((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
                  }
                />
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder={t("Andika jibu...", "Type a reply...")}
                  disabled={isBusy("reply")}
                  style={{ borderColor: COLORS.sandLine }}
                  className="flex-1 min-w-0 rounded-full border px-3 py-2 text-xs outline-none bg-card disabled:opacity-50"
                />
                <button
                  onClick={handleSendReply}
                  disabled={
                    (!replyText.trim() && replyFiles.length === 0) ||
                    isBusy("reply")
                  }
                  style={{
                    background:
                      (replyText.trim() || replyFiles.length > 0) && !isBusy("reply")
                        ? COLORS.gold
                        : COLORS.sandLine,
                    color:
                      (replyText.trim() || replyFiles.length > 0) && !isBusy("reply")
                        ? COLORS.night
                        : "var(--text-muted)",
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:cursor-not-allowed"
                  aria-label={t("Tuma", "Send")}
                >
                  {isBusy("reply") ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>

              {replyFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {replyFiles.map((f, i) => (
                    <div
                      key={i}
                      className="relative flex items-center gap-1.5 text-xs bg-card border rounded-lg px-2 py-1.5"
                      style={{ borderColor: COLORS.sandLine }}
                    >
                      {f.preview ? (
                        <img src={f.preview} alt={f.name} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <Paperclip size={12} className="text-muted" />
                      )}
                      <span className="truncate max-w-[100px]">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeReplyFile(i)}
                        className="text-muted hover:text-rust"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
                {ticket.status === "open" && (
                  <button
                    onClick={() => handleStatusChange("in_progress")}
                    disabled={isBusy("status-in_progress")}
                    style={{ background: COLORS.gold, color: COLORS.night }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBusy("status-in_progress") && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    {t("Anza Kushughulikia", "Start Working")}
                  </button>
                )}

                {ticket.status !== "resolved" && (
                  <button
                    onClick={handleResolve}
                    disabled={isBusy("status-resolved")}
                    style={{ background: COLORS.green, color: "white" }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBusy("status-resolved") ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CheckCircle size={12} />
                    )}
                    {t("Tatua", "Resolve")}
                  </button>
                )}

                {ticket.status === "resolved" && (
                  <button
                    onClick={handleClose}
                    disabled={isBusy("status-closed")}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: "var(--text-primary)", borderColor: COLORS.sandLine }}
                  >
                    {isBusy("status-closed") && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    {t("Funga", "Close")}
                  </button>
                )}

                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  disabled={isBusy("priority")}
                  style={{ borderColor: COLORS.sandLine }}
                  className="text-xs font-semibold px-2 py-2 rounded-lg border bg-card outline-none w-full sm:w-auto sm:ml-auto disabled:opacity-50"
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label?.[lang] || p.label?.sw}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleRemove}
                  disabled={isBusy("remove")}
                  className="p-2 text-muted hover:text-rust transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t("Ondoa", "Remove")}
                >
                  {isBusy("remove") ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </>
          )}

          {ticket.status === "closed" && (
            <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
              <button
                onClick={handleReopen}
                disabled={isBusy("status-open")}
                style={{ background: COLORS.gold, color: COLORS.night }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBusy("status-open") && (
                  <Loader2 size={12} className="animate-spin" />
                )}
                {t("Fungua Tena", "Reopen")}
              </button>
              <button
                onClick={handleRemove}
                disabled={isBusy("remove")}
                className="ml-auto p-2 text-muted hover:text-rust transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t("Ondoa", "Remove")}
              >
                {isBusy("remove") ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// FEEDBACK CARD (haijabadilishwa — nakupa kwa ukamilifu)
// ============================================================
function FeedbackCard({ item, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(false);

  const ft = FEEDBACK_TYPES.find((x) => x.key === item.type) || FEEDBACK_TYPES[0];
  const Icon = FEEDBACK_ICONS[ft.icon] || MessageSquare;
  const status = FEEDBACK_STATUS_META[item.status] || FEEDBACK_STATUS_META.new;

  const handleSendReply = async () => {
    if (!replyText.trim() || busy) return;
    setBusy(true);
    setError("");
    const res = await respondToFeedbackAsync(item.id, replyText.trim());
    setBusy(false);
    if (res.ok) setReplyText("");
    else
      setError(
        res.error?.message ||
          t("Imeshindwa kutuma jibu.", "Failed to send reply.")
      );
  };

  const handleRemove = async () => {
    if (!window.confirm(t("Ondoa feedback hii?", "Remove this feedback?"))) return;
    setRemoving(true);
    setError("");
    const res = await removeFeedbackAsync(item.id);
    setRemoving(false);
    if (!res.ok)
      setError(res.error?.message || t("Imeshindwa kuondoa.", "Failed to remove."));
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
      className="rounded-xl border overflow-hidden w-full max-w-full min-w-0"
    >
      <div className="p-3 sm:p-4 w-full min-w-0">
        <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
          <div
            style={{ background: `${COLORS.night}0D` }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <Icon size={16} color={COLORS.night} />
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                style={{ background: `${COLORS.gold}20`, color: COLORS.goldText }}
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {ft.label?.[lang] || ft.label?.sw}
              </span>
              <span
                style={{ background: status.bg, color: status.fg }}
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {status.label?.[lang] || status.label?.sw}
              </span>
              {item.rating != null && (
                <span className="flex items-center gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={12}
                      fill={n <= item.rating ? COLORS.gold : "none"}
                      color={n <= item.rating ? COLORS.gold : COLORS.sandLine}
                    />
                  ))}
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-primary truncate w-full">
              {item.subject}
            </p>

            <div className="flex items-center gap-2 mt-1 text-xs text-secondary flex-wrap">
              <span className="flex items-center gap-1 min-w-0">
                <User size={12} className="shrink-0" />
                <span className="truncate">{item.userName || "—"}</span>
              </span>
              {item.userEmail && (
                <>
                  <span className="text-muted shrink-0">•</span>
                  <span className="truncate">{item.userEmail}</span>
                </>
              )}
              <span className="text-muted shrink-0">•</span>
              <span className="flex items-center gap-1 shrink-0">
                <Clock size={12} />
                {timeAgo(item.createdAt, lang)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-muted hover:text-secondary shrink-0"
            aria-label={expanded ? "Funga" : "Fungua"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="border-t p-3 sm:p-4 flex flex-col gap-3 w-full max-w-full min-w-0 overflow-hidden"
        >
          {error && (
            <div
              style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
            >
              {error}
            </div>
          )}

          <div className="min-w-0 w-full">
            <p className="text-xs font-semibold text-secondary uppercase mb-1">
              {t("Ujumbe", "Message")}
            </p>
            <div
              style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
              className="rounded-lg border px-3 py-2.5 text-xs text-primary leading-relaxed whitespace-pre-wrap break-words w-full min-w-0"
            >
              {item.message || "—"}
            </div>
          </div>

          {item.adminReply && (
            <div className="min-w-0 w-full">
              <p className="text-xs font-semibold text-secondary uppercase mb-1">
                {t("Jibu la Admin", "Admin Reply")}
                {item.repliedAt && (
                  <span className="text-muted font-normal ml-2">
                    · {timeAgo(item.repliedAt, lang)}
                  </span>
                )}
              </p>
              <div
                style={{ background: "rgba(47,109,79,0.08)", color: COLORS.green }}
                className="rounded-lg px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words w-full min-w-0"
              >
                {item.adminReply}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 min-w-0 w-full">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !busy && handleSendReply()}
              placeholder={t("Andika jibu lako...", "Type your reply...")}
              disabled={busy}
              style={{ borderColor: COLORS.sandLine }}
              className="flex-1 min-w-0 rounded-full border px-3 py-2 text-xs outline-none bg-card disabled:opacity-50"
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim() || busy}
              style={{
                background: replyText.trim() && !busy ? COLORS.gold : COLORS.sandLine,
                color: replyText.trim() && !busy ? COLORS.night : "var(--text-muted)",
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:cursor-not-allowed"
              aria-label={t("Tuma", "Send")}
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
            <button
              onClick={handleRemove}
              disabled={removing}
              className="p-2 text-muted hover:text-rust transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t("Ondoa", "Remove")}
            >
              {removing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN SECTION
// ============================================================
export default function SupportSection() {
  const { lang } = useLanguage();
  const tickets = useTickets();
  const feedback = useFeedback();
  const [searchParams] = useSearchParams();

  // ✅ Ticket focus kutoka URL
  const focusedTicketId = (() => {
    const raw = searchParams.get("ticket");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  })();

  const [tab, setTab] = useState("tickets");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ticketQuery, setTicketQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState("all");
  const [feedbackQuery, setFeedbackQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ── Bulk reply ──
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState(null); // { ok, failed }

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ✅ Hydrate tickets kwenye mount + auto-refresh kila 30s
  useEffect(() => {
    hydrateTicketsFromApi();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        hydrateTicketsFromApi();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Kama kuna `?ticket=`, nenda kwenye tab ya tickets
  useEffect(() => {
    if (focusedTicketId) setTab("tickets");
  }, [focusedTicketId]);

  // ✅ Scroll kwenda ticket iliyochaguliwa
  useEffect(() => {
    if (!focusedTicketId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`ticket-${focusedTicketId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [focusedTicketId, tickets.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await hydrateTicketsFromApi();
    setRefreshing(false);
  };

  // ── Bulk reply handlers ──
  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
    setBulkText("");
    setBulkResult(null);
  };

  const handleBulkSend = async () => {
    const text = bulkText.trim();
    const ids = [...selectedIds];
    if (!text || ids.length === 0 || bulkBusy) return;
    if (
      !window.confirm(
        t(
          `Tuma jibu hili kwa tickets ${ids.length}?`,
          `Send this reply to ${ids.length} tickets?`
        )
      )
    )
      return;

    setBulkBusy(true);
    setBulkResult(null);
    const failed = [];
    let okCount = 0;
    // Mfuatano (si sambamba) ili kuepuka rate-limit na kuhifadhi mpangilio
    for (const id of ids) {
      try {
        const res = await addTicketMessageAsync(id, { text, files: [] });
        if (res?.ok) okCount += 1;
        else failed.push(id);
      } catch {
        failed.push(id);
      }
    }
    setBulkBusy(false);
    setBulkResult({ ok: okCount, failed: failed.length });
    // Zilizofanikiwa ziondolewe; zilizoshindwa zibaki zimechaguliwa ili kujaribu tena
    setSelectedIds(new Set(failed));
    if (failed.length === 0) setBulkText("");
  };

  // ── Ticket counts ──
  const ticketCounts = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const closed = tickets.filter((t) => t.status === "closed").length;
    const overdue = tickets.filter((t) => t.slaOverdue).length;
    return { total, open, inProgress, resolved, closed, overdue };
  }, [tickets]);

  const ticketCategoryCounts = useMemo(() => {
    const counts = { all: tickets.length };
    TICKET_CATEGORIES.forEach((c) => {
      counts[c.key] = tickets.filter((t) => t.category === c.key).length;
    });
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let result = [...tickets];
    if (statusFilter !== "all")
      result = result.filter((t) => t.status === statusFilter);
    if (categoryFilter !== "all")
      result = result.filter((t) => t.category === categoryFilter);
    if (ticketQuery.trim()) {
      const q = ticketQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject?.toLowerCase().includes(q) ||
          t.userName?.toLowerCase().includes(q) ||
          t.userEmail?.toLowerCase().includes(q) ||
          t.code?.toLowerCase().includes(q) ||
          String(t.id).includes(q)
      );
    }

    // ✅ Ticket iliyochaguliwa iwe juu
    if (focusedTicketId) {
      result.sort((a, b) => {
        if (a.id === focusedTicketId) return -1;
        if (b.id === focusedTicketId) return 1;
        return 0;
      });
    } else {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      result.sort((a, b) => {
        if (a.slaOverdue && !b.slaOverdue) return -1;
        if (!a.slaOverdue && b.slaOverdue) return 1;
        const aPrio = priorityOrder[a.priority] ?? 99;
        const bPrio = priorityOrder[b.priority] ?? 99;
        if (aPrio !== bPrio) return aPrio - bPrio;
        return (
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
        );
      });
    }
    return result;
  }, [tickets, statusFilter, categoryFilter, ticketQuery, focusedTicketId]);

  // ── Feedback counts ──
  const feedbackCounts = useMemo(() => {
    const total = feedback.length;
    const byType = {};
    FEEDBACK_TYPES.forEach((ft) => {
      byType[ft.key] = feedback.filter((f) => f.type === ft.key).length;
    });
    const byStatus = {
      new: feedback.filter((f) => f.status === "new").length,
      answered: feedback.filter((f) => f.status === "answered").length,
    };
    return { total, byType, byStatus };
  }, [feedback]);

  const filteredFeedback = useMemo(() => {
    let result = [...feedback];
    if (typeFilter !== "all") result = result.filter((f) => f.type === typeFilter);
    if (feedbackStatusFilter !== "all")
      result = result.filter((f) => f.status === feedbackStatusFilter);
    if (feedbackQuery.trim()) {
      const q = feedbackQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.subject?.toLowerCase().includes(q) ||
          f.message?.toLowerCase().includes(q) ||
          f.userName?.toLowerCase().includes(q) ||
          f.userEmail?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (a.status === "new" && b.status !== "new") return -1;
      if (a.status !== "new" && b.status === "new") return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return result;
  }, [feedback, typeFilter, feedbackStatusFilter, feedbackQuery]);

  const avgRating = useMemo(() => {
    const rated = feedback.filter((f) => f.rating != null);
    if (!rated.length) return "—";
    const avg = rated.reduce((s, f) => s + f.rating, 0) / rated.length;
    return avg.toFixed(1);
  }, [feedback]);

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Huduma kwa Wateja", "Customer Care")}
        subtitle={t(
          "Simamia tickets, malalamiko, maoni, na ujumbe wa watumiaji.",
          "Manage tickets, complaints, feedback, and user messages."
        )}
      />

      {/* Refresh button */}
      <div className="flex justify-center mb-3">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors disabled:opacity-60"
          style={{
            borderColor: "rgb(var(--c-hairline))",
            color: COLORS.ink,
            background: "rgb(var(--c-card))",
          }}
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing
            ? t("Inasasisha...", "Refreshing...")
            : t("Sasisha", "Refresh")}
        </button>
      </div>

      {/* TABS */}
      <div className="flex justify-center mb-5 w-full min-w-0">
        <div
          style={{ background: "rgb(var(--c-card))", borderColor: COLORS.sandLine }}
          className="flex rounded-full border p-1 w-full sm:w-auto"
        >
          <button
            onClick={() => setTab("tickets")}
            style={{
              background: tab === "tickets" ? COLORS.night : "transparent",
              color: tab === "tickets" ? COLORS.sand : "var(--text-primary)",
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <Headphones size={14} />
            {t("Tickets", "Tickets")}
            {ticketCounts.total > 0 && (
              <span
                style={{
                  background: tab === "tickets" ? "rgba(244,247,252,0.18)" : COLORS.sandLine,
                  color: tab === "tickets" ? COLORS.sand : "var(--text-primary)",
                }}
                className="text-xs font-bold px-1.5 py-0.5 rounded-full ml-1"
              >
                {ticketCounts.total}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("feedback")}
            style={{
              background: tab === "feedback" ? COLORS.night : "transparent",
              color: tab === "feedback" ? COLORS.sand : "var(--text-primary)",
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <MessageSquare size={14} />
            {t("Maoni", "Feedback")}
            {feedbackCounts.total > 0 && (
              <span
                style={{
                  background: tab === "feedback" ? "rgba(244,247,252,0.18)" : COLORS.sandLine,
                  color: tab === "feedback" ? COLORS.sand : "var(--text-primary)",
                }}
                className="text-xs font-bold px-1.5 py-0.5 rounded-full ml-1"
              >
                {feedbackCounts.total}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB: TICKETS */}
      {tab === "tickets" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-5 w-full">
            <div style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }} className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full">
              <p className="text-xs font-semibold text-secondary uppercase truncate">{t("Zote", "Total")}</p>
              <p style={{ color: "var(--text-primary)" }} className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words">{ticketCounts.total}</p>
            </div>
            <div style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }} className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full">
              <p className="text-xs font-semibold text-secondary uppercase truncate">{t("Wazi", "Open")}</p>
              <p className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words" style={{ color: COLORS.rust }}>{ticketCounts.open}</p>
            </div>
            <div style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }} className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full">
              <p className="text-xs font-semibold text-secondary uppercase truncate">{t("Inaendelea", "In Progress")}</p>
              <p className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words" style={{ color: COLORS.goldText }}>{ticketCounts.inProgress}</p>
            </div>
            <div style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }} className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full">
              <p className="text-xs font-semibold text-secondary uppercase truncate">{t("Zimetatuliwa", "Resolved")}</p>
              <p className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words" style={{ color: COLORS.green }}>{ticketCounts.resolved}</p>
            </div>
            <div style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }} className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold text-secondary uppercase truncate">{t("SLA Imepita", "SLA Overdue")}</p>
              <p className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words" style={{ color: ticketCounts.overdue > 0 ? COLORS.rust : COLORS.green }}>{ticketCounts.overdue}</p>
            </div>
          </div>

          {tickets.length > 0 && (
            <div className="flex justify-center gap-2 mb-3 overflow-x-auto pb-2 w-full min-w-0">
              <button
                onClick={() => setStatusFilter("all")}
                style={{
                  background: statusFilter === "all" ? COLORS.night : "rgb(var(--c-card))",
                  color: statusFilter === "all" ? COLORS.sand : "var(--text-primary)",
                  borderColor: COLORS.sandLine,
                }}
                className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
              >
                {t("Zote", "All")} ({ticketCounts.total})
              </button>
              {TICKET_STATUSES.map((s) => {
                const countKey =
                  s.key === "open" ? "open"
                  : s.key === "in_progress" ? "inProgress"
                  : s.key === "closed" ? "closed"
                  : s.key;
                const count = ticketCounts[countKey] || 0;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    style={{
                      background: statusFilter === s.key ? COLORS.night : "rgb(var(--c-card))",
                      color: statusFilter === s.key ? COLORS.sand : "var(--text-primary)",
                      borderColor: COLORS.sandLine,
                    }}
                    className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
                  >
                    {s.label?.[lang] || s.label?.sw} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {tickets.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full min-w-0">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ borderColor: COLORS.sandLine }}
                className="text-xs font-semibold px-3 py-2 rounded-lg border bg-card outline-none shrink-0 w-full sm:w-auto"
              >
                <option value="all">{t("Kategoria Zote", "All Categories")} ({ticketCategoryCounts.all})</option>
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label?.[lang] || c.label?.sw} ({ticketCategoryCounts[c.key]})
                  </option>
                ))}
              </select>

              <div className="relative flex-1 min-w-0">
                <input
                  value={ticketQuery}
                  onChange={(e) => setTicketQuery(e.target.value)}
                  placeholder={t("Tafuta kwa ID, mada, mtumiaji...", "Search by ID, subject, user...")}
                  className="smk-inline-search w-full rounded-lg border border-hairline bg-card pl-3 pr-10 py-2 text-xs outline-none focus:outline-none focus-visible:outline-none"
                  style={{ WebkitAppearance: "none" }}
                />
                <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            </div>
          )}

          {tickets.length > 0 && (
            <div className="mb-4 w-full min-w-0">
              {!bulkMode ? (
                <button
                  onClick={() => setBulkMode(true)}
                  style={{ borderColor: COLORS.sandLine, color: "var(--text-primary)" }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border bg-card"
                >
                  <Reply size={14} />
                  {t("Jibu kwa Wingi", "Bulk Reply")}
                </button>
              ) : (
                <div
                  style={{ borderColor: COLORS.gold, background: "rgb(var(--c-card))" }}
                  className="rounded-xl border-2 p-3 sm:p-4 flex flex-col gap-2.5 w-full min-w-0"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-primary">
                      {t("Jibu kwa Wingi", "Bulk Reply")} · {selectedIds.size}{" "}
                      {t("zimechaguliwa", "selected")}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setSelectedIds(
                            new Set(
                              filteredTickets
                                .filter((tk) => tk.status !== "closed")
                                .map((tk) => tk.id)
                            )
                          )
                        }
                        disabled={bulkBusy}
                        style={{ borderColor: COLORS.sandLine }}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border disabled:opacity-50"
                      >
                        {t("Chagua zote zilizoonyeshwa", "Select all shown")}
                      </button>
                      <button
                        onClick={() => setSelectedIds(new Set())}
                        disabled={bulkBusy || selectedIds.size === 0}
                        style={{ borderColor: COLORS.sandLine }}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border disabled:opacity-50"
                      >
                        {t("Ondoa", "Clear")}
                      </button>
                      <button
                        onClick={exitBulkMode}
                        disabled={bulkBusy}
                        style={{ borderColor: COLORS.sandLine, color: COLORS.rust }}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border disabled:opacity-50"
                      >
                        {t("Funga", "Exit")}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end gap-2 min-w-0">
                    <CannedPicker
                      lang={lang}
                      currentText={bulkText}
                      disabled={bulkBusy}
                      onPick={(text) =>
                        setBulkText((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
                      }
                    />
                    <textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      rows={2}
                      disabled={bulkBusy}
                      placeholder={t(
                        "Andika jibu litakalotumwa kwa tickets zote zilizochaguliwa...",
                        "Write the reply to send to all selected tickets..."
                      )}
                      style={{ borderColor: COLORS.sandLine }}
                      className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-xs outline-none bg-card resize-none disabled:opacity-50"
                    />
                    <button
                      onClick={handleBulkSend}
                      disabled={bulkBusy || !bulkText.trim() || selectedIds.size === 0}
                      style={{ background: COLORS.gold, color: COLORS.night }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bulkBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      {t("Tuma", "Send")}
                    </button>
                  </div>

                  {bulkResult && (
                    <p
                      style={{
                        background:
                          bulkResult.failed > 0
                            ? "rgba(193,80,46,0.1)"
                            : "rgba(47,109,79,0.1)",
                        color: bulkResult.failed > 0 ? COLORS.rust : COLORS.green,
                      }}
                      className="text-xs font-semibold px-3 py-2 rounded-lg"
                    >
                      {t(
                        `Imetumwa: ${bulkResult.ok}. Imeshindwa: ${bulkResult.failed}.`,
                        `Sent: ${bulkResult.ok}. Failed: ${bulkResult.failed}.`
                      )}
                      {bulkResult.failed > 0 &&
                        " " +
                          t(
                            "Zilizoshindwa zimebaki zimechaguliwa — jaribu tena.",
                            "Failed ones remain selected — try again."
                          )}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {filteredTickets.length === 0 ? (
            <div
              style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
              className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
            >
              <Inbox size={40} className="mx-auto text-muted mb-3" />
              <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-1">
                {ticketQuery || statusFilter !== "all" || categoryFilter !== "all"
                  ? t("Hakuna matokeo", "No results")
                  : t("Hakuna tickets", "No tickets")}
              </h3>
              <p className="text-sm text-secondary">
                {ticketQuery || statusFilter !== "all" || categoryFilter !== "all"
                  ? t("Jaribu kubadilisha vichujio au utafutaji wako.", "Try changing your filters or search.")
                  : t("Tickets za watumiaji zitaonekana hapa.", "User tickets will appear here.")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full min-w-0">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  lang={lang}
                  defaultExpanded={ticket.id === focusedTicketId}
                  highlight={ticket.id === focusedTicketId}
                  selectable={bulkMode}
                  selected={selectedIds.has(ticket.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB: FEEDBACK */}
      {tab === "feedback" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 w-full">
            <div style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }} className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full">
              <p className="text-xs font-semibold text-secondary uppercase truncate">{t("Zote", "Total")}</p>
              <p style={{ color: "var(--text-primary)" }} className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words">{feedbackCounts.total}</p>
            </div>
            <div style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }} className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full">
              <p className="text-xs font-semibold text-secondary uppercase truncate">{t("Mpya", "New")}</p>
              <p className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words" style={{ color: COLORS.rust }}>{feedbackCounts.byStatus.new}</p>
            </div>
            <div style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }} className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full">
              <p className="text-xs font-semibold text-secondary uppercase truncate">{t("Zimejibiwa", "Answered")}</p>
              <p className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words" style={{ color: COLORS.green }}>{feedbackCounts.byStatus.answered}</p>
            </div>
            <div style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }} className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full">
              <p className="text-xs font-semibold text-secondary uppercase truncate">{t("Wastani wa Rating", "Avg Rating")}</p>
              <p className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words" style={{ color: COLORS.gold }}>{avgRating}</p>
            </div>
          </div>

          <FeedbackAnalytics feedback={feedback} lang={lang} />

          {feedback.length > 0 && (
            <div className="flex justify-center gap-2 mb-3 overflow-x-auto pb-2 w-full min-w-0">
              <button
                onClick={() => setTypeFilter("all")}
                style={{
                  background: typeFilter === "all" ? COLORS.night : "rgb(var(--c-card))",
                  color: typeFilter === "all" ? COLORS.sand : "var(--text-primary)",
                  borderColor: COLORS.sandLine,
                }}
                className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
              >
                {t("Zote", "All")} ({feedbackCounts.total})
              </button>
              {FEEDBACK_TYPES.map((ft) => (
                <button
                  key={ft.key}
                  onClick={() => setTypeFilter(ft.key)}
                  style={{
                    background: typeFilter === ft.key ? COLORS.night : "rgb(var(--c-card))",
                    color: typeFilter === ft.key ? COLORS.sand : "var(--text-primary)",
                    borderColor: COLORS.sandLine,
                  }}
                  className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
                >
                  {ft.label?.[lang] || ft.label?.sw} ({feedbackCounts.byType[ft.key] || 0})
                </button>
              ))}
            </div>
          )}

          {feedback.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full min-w-0">
              <select
                value={feedbackStatusFilter}
                onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                style={{ borderColor: COLORS.sandLine }}
                className="text-xs font-semibold px-3 py-2 rounded-lg border bg-card outline-none shrink-0 w-full sm:w-auto"
              >
                <option value="all">{t("Hali Zote", "All Statuses")}</option>
                <option value="new">{t("Mpya", "New")} ({feedbackCounts.byStatus.new})</option>
                <option value="answered">{t("Zimejibiwa", "Answered")} ({feedbackCounts.byStatus.answered})</option>
              </select>

              <div className="relative flex-1 min-w-0">
                <input
                  value={feedbackQuery}
                  onChange={(e) => setFeedbackQuery(e.target.value)}
                  placeholder={t("Tafuta kwa kichwa, ujumbe, mtumiaji...", "Search by subject, message, user...")}
                  className="smk-inline-search w-full rounded-lg border border-hairline bg-card pl-3 pr-10 py-2 text-xs outline-none focus:outline-none focus-visible:outline-none"
                  style={{ WebkitAppearance: "none" }}
                />
                <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            </div>
          )}

          {filteredFeedback.length === 0 ? (
            <div
              style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
              className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
            >
              <Inbox size={40} className="mx-auto text-muted mb-3" />
              <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-1">
                {feedbackQuery || typeFilter !== "all" || feedbackStatusFilter !== "all"
                  ? t("Hakuna matokeo", "No results")
                  : t("Hakuna maoni bado", "No feedback yet")}
              </h3>
              <p className="text-sm text-secondary">
                {feedbackQuery || typeFilter !== "all" || feedbackStatusFilter !== "all"
                  ? t("Jaribu kubadilisha vichujio au utafutaji wako.", "Try changing your filters or search.")
                  : t("Maoni ya watumiaji yataonekana hapa.", "User feedback will appear here.")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full min-w-0">
              {filteredFeedback.map((item) => (
                <FeedbackCard key={item.id} item={item} lang={lang} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}