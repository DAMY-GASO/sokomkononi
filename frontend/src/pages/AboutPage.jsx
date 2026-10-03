// ============================================================
// AboutPage.jsx
// Kuhusu Sisi — bilingual kamili + PageLoader.
// Inasoma kutoka contentStore (backend) kwa fallback kwenye code.
// ============================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  Info,
  Target,
  Eye,
  Heart,
  Users,
  Award,
  TrendingUp,
  Shield,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Building2,
  Handshake,
} from "lucide-react";

import PageLoader from "../components/PageLoader.jsx";
import { useAbout } from "../config/contentStore.js";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  sandLine: "#E6E2D6",
};

// ============================================================
// ICON MAP — jina la icon (string) → lucide component
// ============================================================
const ICON_MAP = {
  Info,
  Target,
  Eye,
  Heart,
  Users,
  Award,
  TrendingUp,
  Shield,
  CheckCircle,
  Sparkles,
  Building2,
  Handshake,
  // Fallbacks
  Home: Building2,
  TreePine: Shield,
  FileText: Info,
};

// ============================================================
// FALLBACK CONTENT (kama backend haipo)
// ============================================================
const ABOUT_CONTENT = {
  sw: {
    heading: "Kuhusu SokoMkononi",
    subtext:
      "Jukwaa la kidijitali linalowaunganisha wanunuzi na wauzaji wa mali Tanzania.",
    mission:
      "Kurahisisha ununuzi na uuzaji wa mali Tanzania kwa kutumia teknolojia ya kisasa, kwa uwazi na uaminifu.",
    vision:
      "Kuwa jukwaa #1 la mali Tanzania na Afrika Mashariki, likisaidia mamilioni ya watu kupata mali zao kwa urahisi.",
    values: [
      {
        icon: "Shield",
        title: "Uaminifu",
        content: "Tunahakikisha kila muamala unafanyika kwa uwazi na uaminifu.",
      },
      {
        icon: "Users",
        title: "Wateja Kwanza",
        content: "Wateja wetu ni kipaumbele chetu cha kwanza katika kila uamuzi.",
      },
      {
        icon: "TrendingUp",
        title: "Ubunifu",
        content: "Tunatumia teknolojia za kisasa kuboresha huduma zetu kila siku.",
      },
      {
        icon: "Heart",
        title: "Mapenzi kwa Kazi",
        content: "Tunafanya kazi kwa mapenzi na kujitolea kwa mafanikio ya wateja wetu.",
      },
    ],
    team: [
      {
        name: "Misso Madirisha",
        role: "Mwanzilishi & CEO",
        bio: "Mtaalamu wa teknolojia na biashara mwenye uzoefu wa miaka 10.",
      },
      {
        name: "Timu ya Uhandisi",
        role: "Wahandisi wa Programu",
        bio: "Timu ya wabunifu wanaojenga jukwaa letu kwa teknolojia ya kisasa.",
      },
      {
        name: "Timu ya Huduma",
        role: "Wateja Wetu",
        bio: "Tunahakikisha kila mteja anapata msaada wa haraka na wa kutosha.",
      },
    ],
  },
  en: {
    heading: "About SokoMkononi",
    subtext:
      "A digital platform connecting property buyers and sellers across Tanzania.",
    mission:
      "To simplify buying and selling of properties in Tanzania using modern technology, with transparency and integrity.",
    vision:
      "To become the #1 property platform in Tanzania and East Africa, helping millions of people find their properties easily.",
    values: [
      {
        icon: "Shield",
        title: "Integrity",
        content: "We ensure every transaction is done with transparency and integrity.",
      },
      {
        icon: "Users",
        title: "Customers First",
        content: "Our customers are our top priority in every decision we make.",
      },
      {
        icon: "TrendingUp",
        title: "Innovation",
        content: "We use modern technologies to improve our services every day.",
      },
      {
        icon: "Heart",
        title: "Passion",
        content: "We work with passion and dedication for our customers' success.",
      },
    ],
    team: [
      {
        name: "Misso Madirisha",
        role: "Founder & CEO",
        bio: "Technology and business expert with 10+ years of experience.",
      },
      {
        name: "Engineering Team",
        role: "Software Engineers",
        bio: "A creative team building our platform with modern technology.",
      },
      {
        name: "Support Team",
        role: "Customer Support",
        bio: "We ensure every customer gets fast and adequate support.",
      },
    ],
  },
};

// ============================================================
// VALUE CARD
// ============================================================
function ValueCard({ value, lang }) {
  const Icon = value.icon || CheckCircle;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-[#E8A33D]/10 flex items-center justify-center flex-shrink-0">
        <Icon size={22} color={COLORS.gold} />
      </div>
      <h3 className="font-bold text-primary text-base">{value.title}</h3>
      <p className="text-sm text-secondary leading-relaxed">{value.content}</p>
    </div>
  );
}

// ============================================================
// TEAM CARD
// ============================================================
function TeamCard({ member, lang }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-center text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-[#2F6D4F]/10 flex items-center justify-center flex-shrink-0">
        <Users size={26} color={COLORS.green} />
      </div>
      <div>
        <h3 className="font-bold text-primary text-base">{member.name}</h3>
        <p className="text-xs font-medium text-[#2F6D4F] mt-0.5">{member.role}</p>
      </div>
      <p className="text-sm text-secondary leading-relaxed">{member.bio}</p>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AboutPage() {
  const { lang } = useLanguage();
  const storeAbout = useAbout();

  // ============================================================
  // CHAGUA CONTENT: store kwanza, kisha fallback
  // ============================================================
  const hasStoreContent =
    storeAbout?.heading?.sw ||
    storeAbout?.heading?.en ||
    (storeAbout?.values && storeAbout.values.length > 0);

  const codeContent = ABOUT_CONTENT[lang] || ABOUT_CONTENT.sw;

  const content = hasStoreContent
    ? {
        heading:
          storeAbout.heading?.[lang] ||
          storeAbout.heading?.sw ||
          codeContent.heading,
        subtext:
          storeAbout.subtext?.[lang] ||
          storeAbout.subtext?.sw ||
          codeContent.subtext,
        mission:
          storeAbout.mission?.[lang] ||
          storeAbout.mission?.sw ||
          codeContent.mission,
        vision:
          storeAbout.vision?.[lang] ||
          storeAbout.vision?.sw ||
          codeContent.vision,
        values:
          storeAbout.values && storeAbout.values.length > 0
            ? storeAbout.values.map((v) => ({
                icon: ICON_MAP[v.icon] || CheckCircle,
                title: v.title?.[lang] || v.title?.sw || "",
                content: v.content?.[lang] || v.content?.sw || "",
              }))
            : codeContent.values.map((v) => ({
                ...v,
                icon: ICON_MAP[v.icon] || CheckCircle,
              })),
        team:
          storeAbout.team && storeAbout.team.length > 0
            ? storeAbout.team.map((m) => ({
                name: m.name || m.title?.[lang] || m.title?.sw || "",
                role: m.role || m.subtitle?.[lang] || m.subtitle?.sw || "",
                bio: m.bio || m.content?.[lang] || m.content?.sw || "",
              }))
            : codeContent.team,
      }
    : {
        ...codeContent,
        values: codeContent.values.map((v) => ({
          ...v,
          icon: ICON_MAP[v.icon] || CheckCircle,
        })),
      };

  // ============================================================
  // LOADER
  // ============================================================
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(id);
  }, []);

  if (!ready) return <PageLoader lang={lang} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ============================================================ */}
      {/* HERO — CENTERED */}
      {/* ============================================================ */}
      <section className="dark-surface bg-[#101A2E] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            {lang === "sw" ? "Rudi Nyumbani" : "Back to Home"}
          </Link>

          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#E8A33D]/20 flex items-center justify-center flex-shrink-0">
              <Info size={28} color={COLORS.gold} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                {content.heading}
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-2xl mx-auto">
                {content.subtext}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MISSION & VISION */}
      {/* ============================================================ */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mission */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#E8A33D]/10 flex items-center justify-center flex-shrink-0">
                <Target size={22} color={COLORS.gold} />
              </div>
              <h2 className="font-bold text-primary text-lg">
                {lang === "sw" ? "Dhamira Yetu" : "Our Mission"}
              </h2>
            </div>
            <p className="text-sm text-secondary leading-relaxed">
              {content.mission}
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#2F6D4F]/10 flex items-center justify-center flex-shrink-0">
                <Eye size={22} color={COLORS.green} />
              </div>
              <h2 className="font-bold text-primary text-lg">
                {lang === "sw" ? "Maono Yetu" : "Our Vision"}
              </h2>
            </div>
            <p className="text-sm text-secondary leading-relaxed">
              {content.vision}
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* VALUES */}
      {/* ============================================================ */}
      {content.values.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-primary">
              {lang === "sw" ? "Thamani Zetu" : "Our Values"}
            </h2>
            <p className="text-sm text-secondary mt-2 max-w-xl mx-auto">
              {lang === "sw"
                ? "Misingi inayotuongoza katika kila tunachofanya."
                : "The principles that guide us in everything we do."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {content.values.map((value, idx) => (
              <ValueCard key={idx} value={value} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* TEAM */}
      {/* ============================================================ */}
      {content.team.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-primary">
              {lang === "sw" ? "Timu Yetu" : "Our Team"}
            </h2>
            <p className="text-sm text-secondary mt-2 max-w-xl mx-auto">
              {lang === "sw"
                ? "Watu wanaofanya kazi kwa bidii kukuletea huduma bora."
                : "People working hard to bring you the best service."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.team.map((member, idx) => (
              <TeamCard key={idx} member={member} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* CTA — CONTACT */}
      {/* ============================================================ */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-[#E8A33D]/5 border border-[#E8A33D]/20 rounded-xl p-6 text-center">
          <h3 className="font-bold text-primary text-lg mb-2">
            {lang === "sw" ? "Unahitaji Msaada Zaidi?" : "Need More Help?"}
          </h3>
          <p className="text-sm text-secondary max-w-xl mx-auto mb-4">
            {lang === "sw"
              ? "Tuko hapa kukusaidia. Wasiliana nasi kwa swali lolote."
              : "We're here to help. Contact us for any question."}
          </p>
          <Link
            to="/mawasiliano"
            className="inline-block bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            {lang === "sw" ? "Wasiliana Nasi" : "Contact Us"}
          </Link>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
