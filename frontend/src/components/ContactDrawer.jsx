// ============================================================
// ContactDrawer.jsx
// Drawer ya mawasiliano ya upande wa pili (buyer au seller)
// wakati wa inspection. Inaonyesha jina, simu, email, button
// za "Piga Simu" / "Tuma Email", na "Pakua Mazungumzo".
// Inatumika kwenye DealRoom (baada ya reservation kulipwa).
// ============================================================
import React, { useState } from "react";
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  Download,
  Loader2,
} from "lucide-react";
import { COLORS } from "./constants.js";
import { getDealTranscript } from "../config/dealsStore.js";

export default function ContactDrawer({
  open,
  onClose,
  contact,          // { name, phone, email, role, userId }
  dealId,           // kwa download transcript
  currentUserId,    // kwa download transcript
  lang = "sw",
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  if (!open) return null;

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const roleLabel =
    contact?.role === "seller"
      ? t("Muuzaji", "Seller")
      : contact?.role === "buyer"
        ? t("Mnunuzi", "Buyer")
        : t("Mtu", "Person");

  const initial = (contact?.name || "?").charAt(0).toUpperCase();

  // ── Download transcript ─────────────────────────────────
  const handleDownload = async (format) => {
    if (!dealId) return;
    setDownloadError("");
    setDownloading(format);

    try {
      const transcript = getDealTranscript(dealId, currentUserId, lang);
      if (!transcript) {
        throw new Error(t("Deal haipatikani.", "Deal not found."));
      }

      const { exportTranscript } = await import(
        "../utils/exportDealTranscript.js"
      );
      await exportTranscript(transcript, format);

      setDownloading(null);
    } catch (err) {
      console.error("[ContactDrawer] download failed:", err);
      setDownloadError(
        err?.message ||
          t("Imeshindwa kupakua.", "Failed to download.")
      );
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div
        className="w-full sm:w-96 sm:max-w-md h-full bg-white shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 p-4 flex items-center justify-between border-b"
          style={{ borderColor: COLORS.sandLine, background: "white" }}
        >
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base flex items-center gap-2">
            <MessageSquare size={16} color={COLORS.green} />
            {t("Wasiliana", "Contact")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
            aria-label={t("Funga", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile */}
        <div
          className="p-4 sm:p-5 border-b"
          style={{ borderColor: COLORS.sandLine }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
              style={{ background: `${COLORS.gold}25`, color: "#8A5A16" }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800 truncate">
                {contact?.name || "—"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ShieldCheck size={12} color={COLORS.green} />
                <span className="text-xs text-gray-500">{roleLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 sm:p-5 flex-1 space-y-3">
          <p
            className="text-xs rounded-lg px-3 py-2"
            style={{
              background: "rgba(47,109,79,0.08)",
              color: COLORS.green,
            }}
          >
            {t(
              "Mawasiliano yamefunguliwa kwa sababu reservation imelipwa. Tafadhali wasiliana kwa heshima na kwa lengo la ukaguzi.",
              "Contact unlocked because the reservation has been paid. Please communicate respectfully and for inspection purposes."
            )}
          </p>

          {contact?.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors"
              style={{ borderColor: COLORS.sandLine }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(47,109,79,0.12)" }}
              >
                <Phone size={16} color={COLORS.green} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted uppercase font-semibold">
                  {t("Simu", "Phone")}
                </p>
                <p className="text-sm font-semibold text-primary font-mono truncate">
                  {contact.phone}
                </p>
              </div>
            </a>
          ) : (
            <div
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ borderColor: COLORS.sandLine, opacity: 0.6 }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(16,26,46,0.05)" }}
              >
                <Phone size={16} color={COLORS.night} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted uppercase font-semibold">
                  {t("Simu", "Phone")}
                </p>
                <p className="text-xs text-muted italic">
                  {t("Hapatikani", "Not available")}
                </p>
              </div>
            </div>
          )}

          {contact?.email ? (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors"
              style={{ borderColor: COLORS.sandLine }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(232,163,61,0.15)" }}
              >
                <Mail size={16} color="#8A5A16" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted uppercase font-semibold">
                  {t("Barua Pepe", "Email")}
                </p>
                <p className="text-sm font-semibold text-primary truncate">
                  {contact.email}
                </p>
              </div>
            </a>
          ) : (
            <div
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ borderColor: COLORS.sandLine, opacity: 0.6 }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(16,26,46,0.05)" }}
              >
                <Mail size={16} color={COLORS.night} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted uppercase font-semibold">
                  {t("Barua Pepe", "Email")}
                </p>
                <p className="text-xs text-muted italic">
                  {t("Hapatikani", "Not available")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Download Transcript */}
        <div
          className="p-4 border-t"
          style={{ borderColor: COLORS.sandLine }}
        >
          <p className="text-[10px] text-muted uppercase font-semibold mb-2 flex items-center gap-1.5">
            <Download size={11} />
            {t("Pakua Mazungumzo", "Download Transcript")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {["TXT", "PDF", "CSV"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleDownload(fmt)}
                disabled={!!downloading}
                style={{
                  borderColor: COLORS.sandLine,
                  color: COLORS.night,
                }}
                className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {downloading === fmt ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Download size={12} />
                )}
                {fmt}
              </button>
            ))}
          </div>
          {downloadError && (
            <p
              className="text-[11px] mt-2"
              style={{ color: COLORS.rust }}
            >
              {downloadError}
            </p>
          )}
        </div>

        {/* Actions */}
        {(contact?.phone || contact?.email) && (
          <div
            className="p-4 border-t flex gap-2"
            style={{ borderColor: COLORS.sandLine }}
          >
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                style={{ background: COLORS.green, color: "white" }}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg"
              >
                <Phone size={14} /> {t("Piga Simu", "Call")}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border bg-white"
              >
                <Mail size={14} /> {t("Tuma Email", "Send Email")}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}