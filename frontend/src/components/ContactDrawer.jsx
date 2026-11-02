// ============================================================
// ContactDrawer.jsx
// Drawer ya mawasiliano ya upande wa pili (buyer au seller)
// wakati wa inspection. Inaonyesha public profile info.
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
  User as UserIcon,
} from "lucide-react";
import { COLORS } from "../pages/dashboard/components/shared.js";
import { getDealTranscript } from "../config/dealsStore.js";

// ── WhatsApp Icon halisi ──
function WhatsAppIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function ContactDrawer({
  open,
  onClose,
  contact,
  dealId,
  currentUserId,
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
  const avatar = contact?.avatar || contact?.avatarUrl || null;
  const whatsappNumber = contact?.whatsapp || (contact?.phone ? String(contact.phone).replace(/\D/g, "") : "");

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
      <div className="flex-1 bg-black/40" onClick={onClose} />

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
            <UserIcon size={16} color={COLORS.green} />
            {t("Wasifu wa Mtumiaji", "User Profile")}
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
            {avatar ? (
              <img
                src={avatar}
                alt={contact?.name || ""}
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ background: `${COLORS.gold}25`, color: "#8A5A16" }}
              >
                {initial}
              </div>
            )}
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
              "Wasiliana moja kwa moja kwa heshima.",
              "Communicate directly and respectfully."
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
                  {t("Hapotikani", "Not available")}
                </p>
              </div>
            </div>
          )}

          {/* ✅ WhatsApp */}
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors"
              style={{ borderColor: COLORS.sandLine }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#25D366]"
              >
                <WhatsAppIcon size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted uppercase font-semibold">
                  WhatsApp
                </p>
                <p className="text-sm font-semibold text-primary truncate">
                  {contact.phone || whatsappNumber}
                </p>
              </div>
            </a>
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
        {(contact?.phone || contact?.email || whatsappNumber) && (
          <div
            className="p-4 border-t flex gap-2 flex-wrap"
            style={{ borderColor: COLORS.sandLine }}
          >
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                style={{ background: COLORS.green, color: "white" }}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg min-w-[100px]"
              >
                <Phone size={14} /> {t("Piga Simu", "Call")}
              </a>
            )}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "#25D366", color: "white" }}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg min-w-[100px]"
              >
                <WhatsAppIcon size={14} /> WhatsApp
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border bg-white min-w-[100px]"
              >
                <Mail size={14} /> {t("Tuma Email", "Email")}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}