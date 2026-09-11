import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  FileText,
  Shield,
  Users,
  CreditCard,
  AlertTriangle,
  Scale,
  ChevronDown,
  ChevronUp,
  Mail,
  ArrowLeft,
} from "lucide-react";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  sandLine: "#E6E2D6",
};

// ============================================================
// CONTENT
// ============================================================

const TERMS_CONTENT = {
  sw: {
    title: "Sheria na Masharti",
    subtitle: "Tafadhali soma sheria na masharti haya kwa makini kabla ya kutumia SokoMkononi.",
    lastUpdated: "Ilisasishwa mwisho: 15 Septemba 2026",
    sections: [
      {
        id: "intro",
        icon: FileText,
        title: "1. Utangulizi",
        content: [
          "Karibu SokoMkononi. Kwa kutumia jukwaa letu, unakubaliana na sheria na masharti yaliyoelezwa hapa. Tafadhali soma kwa makini.",
          "SokoMkononi ni jukwaa la kidijitali linalowaunganisha wanunuzi na wauzaji wa mali nchini Tanzania. Hatuuzi mali wenyewe, bali tunatoa jukwaa la kuwezesha miamala.",
        ],
      },
      {
        id: "accounts",
        icon: Users,
        title: "2. Akaunti za Watumiaji",
        content: [
          "Ili kutumia huduma zetu, unahitaji kuunda akaunti. Unakubali kutoa taarifa sahihi na za kweli wakati wa usajili.",
          "Wewe ni mwenye jukumu la kulinda nenosiri lako na taarifa zote za akaunti yako. Taarifa yoyote inayofanyika kwa kutumia akaunti yako ni jukumu lako.",
          "SokoMkononi ina haki ya kusimamisha au kufuta akaunti yoyote inayokiuka sheria na masharti haya bila taarifa ya awali.",
        ],
      },
      {
        id: "listings",
        icon: FileText,
        title: "3. Mali na Matangazo",
        content: [
          "Wauzaji wanawajibika kutoa taarifa sahihi kuhusu mali zao, ikiwa ni pamoja na bei, mahali, na hali ya mali.",
          "Ni marufuku kuweka matangazo ya mali ambayo si halali, ya udanganyifu, au yanayokiuka sheria za Tanzania.",
          "SokoMkononi ina haki ya kukagua, kukataa, au kuondoa tangazo lolote linalokiuka sheria na masharti yetu.",
          "Listing Fee inalipwa kabla ya tangazo kuchapishwa. Ada hii hairejeshwi (non-refundable) baada ya tangazo kuchapishwa.",
        ],
      },
      {
        id: "payments",
        icon: CreditCard,
        title: "4. Malipo na Ada",
        content: [
          "SokoMkononi inatoza Listing Fee kwa kila tangazo linalowekwa. Ada inategemea bei ya mali na category yake.",
          "Malipo yote yanafanywa kwa njia salama kupitia watoa huduma wa malipo walioidhinishwa (M-Pesa, Tigo Pesa, Airtel Money, n.k.).",
          "SokoMkononi haihusiki na miamala ya moja kwa moja kati ya mnunuzi na muuzaji. Wote wanawajibika kuhakikisha usalama wa miamala yao.",
          "Kwa huduma za Boost, ada inalipwa kabla ya huduma kuanza. Boost inaongeza mwonekano wa tangazo lako kwa kipindi maalum.",
        ],
      },
      {
        id: "conduct",
        icon: AlertTriangle,
        title: "5. Maadili ya Matumizi",
        content: [
          "Ni marufuku kutumia jukwaa letu kwa shughuli zozote za udanganyifu, utapeli, au ukiukaji wa sheria.",
          "Ni marufuku kuchapisha maudhui ya kashfa, matusi, au yanayochochea chuki.",
          "Ni marufuku kujaribu kuvunja usalama wa jukwaa letu au kuingilia mifumo yetu.",
          "Watumiaji wanaotakiwa kuwasiliana kwa heshima na wauzaji na wanunuzi wengine.",
        ],
      },
      {
        id: "liability",
        icon: Scale,
        title: "6. Dhima na Uwajibikaji",
        content: [
          "SokoMkononi haiwajibikii ubora, usalama, au uhalali wa mali zilizoorodheshwa kwenye jukwaa letu.",
          "SokoMkononi haiwajibikii hasara yoyote inayotokana na miamala kati ya watumiaji.",
          "Watumiaji wanawajibika kufanya uchunguzi wao wenyewe kabla ya kufanya muamala wowote.",
          "SokoMkononi haihusiki na migogoro kati ya wanunuzi na wauzaji, lakini inaweza kutoa msaada wa upatanishi kwa hiari.",
        ],
      },
      {
        id: "safety",
        icon: Shield,
        title: "7. Usalama",
        content: [
          "Tunatoa vidokezo vya usalama ili kukusaidia kufanya miamala salama. Tafadhali zifuate kwa makini.",
          "Kutana na muuzaji sehemu za wazi na wakati wa mchana.",
          "Angalia mali kabla ya kulipa kiasi chochote.",
          "Thibitisha hati za mali kabla ya kukamilisha muamala.",
          "Tumia Deal Room yetu kwa mazungumzo yote ili yawe na kumbukumbu.",
        ],
      },
      {
        id: "changes",
        icon: FileText,
        title: "8. Mabadiliko ya Sheria Hizi",
        content: [
          "SokoMkononi ina haki ya kubadilisha sheria na masharti haya wakati wowote.",
          "Mabadiliko yatatangazwa kwenye jukwaa letu na yataanza kutumika mara moja.",
          "Kuendelea kutumia jukwaa letu baada ya mabadiliko kunamaanisha unakubaliana na sheria mpya.",
        ],
      },
      {
        id: "contact",
        icon: Mail,
        title: "9. Mawasiliano",
        content: [
          "Kwa maswali yoyote kuhusu sheria na masharti haya, tafadhali wasiliana nasi:",
          "Barua pepe: info@sokomkononi.co.tz",
          "Simu: 0743 895 038",
          "Ofisi: Dar es Salaam, Tanzania",
        ],
      },
    ],
  },
  en: {
    title: "Terms & Conditions",
    subtitle: "Please read these terms and conditions carefully before using SokoMkononi.",
    lastUpdated: "Last updated: 15 September 2026",
    sections: [
      {
        id: "intro",
        icon: FileText,
        title: "1. Introduction",
        content: [
          "Welcome to SokoMkononi. By using our platform, you agree to the terms and conditions outlined here. Please read carefully.",
          "SokoMkononi is a digital platform connecting property buyers and sellers in Tanzania. We do not sell properties ourselves; we provide a platform to facilitate transactions.",
        ],
      },
      {
        id: "accounts",
        icon: Users,
        title: "2. User Accounts",
        content: [
          "To use our services, you need to create an account. You agree to provide accurate and truthful information during registration.",
          "You are responsible for protecting your password and all information related to your account. Any activity conducted using your account is your responsibility.",
          "SokoMkononi reserves the right to suspend or delete any account that violates these terms without prior notice.",
        ],
      },
      {
        id: "listings",
        icon: FileText,
        title: "3. Properties and Listings",
        content: [
          "Sellers are responsible for providing accurate information about their properties, including price, location, and condition.",
          "It is prohibited to post listings for illegal, fraudulent, or unlawful properties.",
          "SokoMkononi reserves the right to review, reject, or remove any listing that violates our terms and conditions.",
          "The Listing Fee is paid before a listing is published. This fee is non-refundable after the listing is published.",
        ],
      },
      {
        id: "payments",
        icon: CreditCard,
        title: "4. Payments and Fees",
        content: [
          "SokoMkononi charges a Listing Fee for each listing posted. The fee depends on the property price and its category.",
          "All payments are made securely through authorized payment providers (M-Pesa, Mixx by Yas, Airtel Money, etc.).",
          "SokoMkononi is not involved in direct transactions between buyers and sellers. Both parties are responsible for ensuring the safety of their transactions.",
          "For Boost services, the fee is paid before the service begins. Boost increases the visibility of your listing for a specific period.",
        ],
      },
      {
        id: "conduct",
        icon: AlertTriangle,
        title: "5. Code of Conduct",
        content: [
          "It is prohibited to use our platform for any fraudulent, deceptive, or unlawful activities.",
          "It is prohibited to post defamatory, abusive, or hate-inciting content.",
          "It is prohibited to attempt to breach our platform's security or interfere with our systems.",
          "Users are required to communicate respectfully with other sellers and buyers.",
        ],
      },
      {
        id: "liability",
        icon: Scale,
        title: "6. Liability and Responsibility",
        content: [
          "SokoMkononi is not responsible for the quality, safety, or legality of properties listed on our platform.",
          "SokoMkononi is not liable for any loss resulting from transactions between users.",
          "Users are responsible for conducting their own due diligence before making any transaction.",
          "SokoMkononi is not involved in disputes between buyers and sellers, but may offer mediation assistance voluntarily.",
        ],
      },
      {
        id: "safety",
        icon: Shield,
        title: "7. Safety",
        content: [
          "We provide safety tips to help you conduct safe transactions. Please follow them carefully.",
          "Meet sellers in open places and during daylight hours.",
          "Inspect the property before paying any amount.",
          "Verify property documents before completing a transaction.",
          "Use our Deal Room for all conversations so they are recorded.",
        ],
      },
      {
        id: "changes",
        icon: FileText,
        title: "8. Changes to These Terms",
        content: [
          "SokoMkononi reserves the right to change these terms and conditions at any time.",
          "Changes will be announced on our platform and will take effect immediately.",
          "Continuing to use our platform after changes means you agree to the new terms.",
        ],
      },
      {
        id: "contact",
        icon: Mail,
        title: "9. Contact",
        content: [
          "For any questions about these terms and conditions, please contact us:",
          "Email: info@sokomkononi.co.tz",
          "Phone: 0743 895 038",
          "Office: Dar es Salaam, Tanzania",
        ],
      },
    ],
  },
};

// ============================================================
// ACCORDION SECTION
// ============================================================

function AccordionSection({ section, isOpen, onToggle }) {
  const Icon = section.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#E8A33D]/10 flex items-center justify-center flex-shrink-0">
            <Icon size={18} color={COLORS.gold} />
          </div>
          <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
            {section.title}
          </h2>
        </div>
        <div className="flex-shrink-0 text-gray-400">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        style={{ display: "grid" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pl-[68px] space-y-3">
            {section.content.map((paragraph, idx) => (
              <p key={idx} className="text-sm text-gray-600 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TermsPage() {
  const { lang } = useLanguage();
  const content = TERMS_CONTENT[lang] || TERMS_CONTENT.sw;

  const [openSections, setOpenSections] = useState({});

  const toggleSection = (id) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all = {};
    content.sections.forEach((s) => {
      all[s.id] = true;
    });
    setOpenSections(all);
  };

  const collapseAll = () => {
    setOpenSections({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="bg-[#101A2E] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            {lang === "sw" ? "Rudi Nyumbani" : "Back to Home"}
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E8A33D]/20 flex items-center justify-center flex-shrink-0">
              <FileText size={28} color={COLORS.gold} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                {content.title}
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-2xl">
                {content.subtitle}
              </p>
              <p className="text-[#E8A33D] text-xs mt-3 font-medium">
                {content.lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTENT ================= */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            onClick={expandAll}
            className="text-xs font-medium text-[#2F6D4F] hover:underline"
          >
            {lang === "sw" ? "Fungua Zote" : "Expand All"}
          </button>
          <span className="text-gray-300">•</span>
          <button
            onClick={collapseAll}
            className="text-xs font-medium text-[#C1502E] hover:underline"
          >
            {lang === "sw" ? "Funga Zote" : "Collapse All"}
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {content.sections.map((section) => (
            <AccordionSection
              key={section.id}
              section={section}
              isOpen={!!openSections[section.id]}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-5 bg-[#E8A33D]/5 border border-[#E8A33D]/20 rounded-xl">
          <p className="text-sm text-gray-700">
            {lang === "sw"
              ? "Kwa maswali yoyote kuhusu sheria na masharti haya, tafadhali wasiliana nasi kupitia ukurasa wa Mawasiliano."
              : "For any questions about these terms and conditions, please contact us via the Contact page."}
          </p>
          <Link
            to="/mawasiliano"
            className="inline-block mt-3 text-sm font-semibold text-[#E8A33D] hover:underline"
          >
            {lang === "sw" ? "Wasiliana Nasi →" : "Contact Us →"}
          </Link>
        </div>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
