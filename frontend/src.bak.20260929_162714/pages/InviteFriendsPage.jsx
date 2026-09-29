// ============================================================
// InviteFriendsPage.jsx  (weka kwenye src/pages/)
// Alika marafiki kupitia Messenger, WhatsApp au Barua pepe.
// Route: /alika-marafiki
//
// Hiari (.env): VITE_FACEBOOK_APP_ID — inawezesha Messenger kufanya kazi
// kwenye desktop pia. Bila hiyo: simu inatumia app ya Messenger moja kwa
// moja; desktop inanakili kiungo na kufungua messenger.com.
// ============================================================
import React, { useState, useEffect } from "react";
import { Copy, Check, Mail } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || "";
const enc = encodeURIComponent;

const isMobileDevice = () =>
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// ── Icons ────────────────────────────────────────────────────
function MessengerIcon({ bg }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#fff"
        d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.19 5.4 3.13 7.13V22l2.86-1.57c.95.26 1.96.4 3.01.4 5.64 0 10-4.13 10-9.7S17.64 2 12 2z"
      />
      <path fill={bg} d="M5.9 14.5l4.4-4.7 2.2 2.3 4.3-2.3-4.4 4.7-2.2-2.3-4.3 2.3z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

function InviteButton({ color, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: color }}
      className="relative w-full h-14 rounded-xl text-white font-semibold text-base flex items-center justify-center hover:brightness-95 active:brightness-90 transition"
    >
      <span className="absolute left-4 flex items-center">{icon}</span>
      {label}
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function InviteFriendsPage() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const link = typeof window !== "undefined" ? window.location.origin : "";
  const message = t(
    "Karibu SokoMkononi! Nunua na uza mali kwa urahisi na usalama. Jiunge hapa:",
    "Join SokoMkononi! Buy and sell property easily and safely. Sign up here:"
  );

  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      setNotice(t("Nakili kiungo kwa mkono.", "Please copy the link manually."));
      return false;
    }
  }

  function inviteWhatsApp() {
    window.open(
      `https://wa.me/?text=${enc(`${message} ${link}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function inviteMessenger() {
    if (FB_APP_ID) {
      window.open(
        `https://www.facebook.com/dialog/send?app_id=${FB_APP_ID}&link=${enc(link)}&redirect_uri=${enc(link)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    if (isMobileDevice()) {
      window.location.href = `fb-messenger://share?link=${enc(link)}`;
      return;
    }
    // Desktop bila App ID: nakili kiungo, kisha fungua Messenger
    const ok = await copyLink();
    if (ok) {
      setNotice(
        t(
          "Kiungo kimenakiliwa. Kibandike kwenye Messenger.",
          "Link copied. Paste it into Messenger."
        )
      );
    }
    window.open("https://www.messenger.com/", "_blank", "noopener,noreferrer");
  }

  function inviteEmail() {
    const subject = t("Karibu SokoMkononi", "Join SokoMkononi");
    window.location.href = `mailto:?subject=${enc(subject)}&body=${enc(`${message}\n\n${link}`)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="dark-surface bg-[#101A2E] text-white py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold">
            {t("Alika Marafiki", "Invite Friends")}
          </h1>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">
            {t(
              "Alika marafiki kupitia Messenger, WhatsApp au Barua pepe.",
              "Invite friends via Messenger, WhatsApp, or Email."
            )}
          </p>
        </div>
      </section>

      <main className="max-w-md mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <InviteButton
            color="#3B5998"
            icon={<MessengerIcon bg="#3B5998" />}
            label={t("Alika kupitia Messenger", "Invite via Messenger")}
            onClick={inviteMessenger}
          />
          <InviteButton
            color="#25D366"
            icon={<WhatsAppIcon />}
            label={t("Alika kupitia WhatsApp", "Invite via WhatsApp")}
            onClick={inviteWhatsApp}
          />
          <InviteButton
            color="#DB4C3F"
            icon={<Mail size={26} color="#fff" strokeWidth={1.8} />}
            label={t("Alika kupitia Barua pepe", "Invite via Email")}
            onClick={inviteEmail}
          />

          {notice && (
            <p className="text-xs text-[#2F6D4F] bg-[#2F6D4F]/10 rounded-lg px-3 py-2">
              {notice}
            </p>
          )}

          <div className="pt-3 mt-1 border-t border-gray-100">
            <p className="text-xs font-semibold text-secondary mb-2">
              {t("Au nakili kiungo", "Or copy the link")}
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-secondary bg-gray-50"
              />
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check size={15} className="text-[#2F6D4F]" /> : <Copy size={15} />}
                {copied ? t("Imenakiliwa", "Copied") : t("Nakili", "Copy")}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
