import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  Share2,
  Cookie,
  Mail,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Clock,
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

const PRIVACY_CONTENT = {
  sw: {
    title: "Sera ya Faragha",
    subtitle: "Tunajali faragha yako. Soma jinsi tunakusanya, kutumia, na kulinda taarifa zako.",
    lastUpdated: "Ilisasishwa mwisho: 15 Septemba 2026",
    sections: [
      {
        id: "intro",
        icon: Shield,
        title: "1. Utangulizi",
        content: [
          "SokoMkononi inaheshimu faragha yako na imejitolea kulinda taarifa zako za kibinafsi. Sera hii inaeleza jinsi tunakusanya, kutumia, na kulinda taarifa zako.",
          "Kwa kutumia jukwaa letu, unakubali mkusanyiko na matumizi ya taarifa zako kama ilivyoelezwa katika sera hii.",
        ],
      },
      {
        id: "collection",
        icon: Database,
        title: "2. Taarifa Tunazokusanya",
        content: [
          "Taarifa za Kibinafsi: Tunakusanya jina lako, barua pepe, namba ya simu, na taarifa nyingine unazotoa wakati wa usajili.",
          "Taarifa za Mali: Tunakusanya taarifa kuhusu mali unazoweka, ikiwa ni pamoja na picha, bei, na mahali.",
          "Taarifa za Matumizi: Tunakusanya taarifa kuhusu jinsi unavyotumia jukwaa letu, ikiwa ni pamoja na kurasa unazotembelea na utafutaji wako.",
          "Taarifa za Kifaa: Tunakusanya taarifa kuhusu kifaa unachotumia, ikiwa ni pamoja na aina ya kifaa, browser, na anwani ya IP.",
        ],
      },
      {
        id: "usage",
        icon: Eye,
        title: "3. Jinsi Tunavyotumia Taarifa Zako",
        content: [
          "Kutoa Huduma: Tunatumia taarifa zako kutoa huduma zetu, ikiwa ni pamoja na kuwezesha mawasiliano kati ya wanunuzi na wauzaji.",
          "Kuboresha Huduma: Tunatumia taarifa zako kuboresha jukwaa letu na kukupa uzoefu bora.",
          "Mawasiliano: Tunaweza kukutumia barua pepe au SMS kuhusu akaunti yako, miamala, au matangazo yetu.",
          "Usalama: Tunatumia taarifa zako kulinda jukwaa letu na watumiaji wengine dhidi ya udanganyifu.",
        ],
      },
      {
        id: "sharing",
        icon: Share2,
        title: "4. Kushiriki Taarifa Zako",
        content: [
          "Watumiaji Wengine: Taarifa zako za umma (jina, mali zako) zinaweza kuonekana kwa watumiaji wengine.",
          "Watoa Huduma: Tunaweza kushiriki taarifa zako na watoa huduma wa malipo ili kuwezesha miamala.",
          "Sheria: Tunaweza kushiriki taarifa zako ikiwa inatakiwa na sheria au mamlaka za serikali.",
          "Hatushiriki taarifa zako za kibinafsi na makampuni ya matangazo bila idhini yako.",
        ],
      },
      {
        id: "security",
        icon: Lock,
        title: "5. Usalama wa Taarifa",
        content: [
          "Tunatumia teknolojia za kisasa kulinda taarifa zako, ikiwa ni pamoja na usimbaji fiche (encryption) na HTTPS.",
          "Nenosiri lako limehifadhiwa kwa usalama na haliwezi kuonekana kwa mtu yeyote, ikiwa ni pamoja na timu yetu.",
          "Hata hivyo, hakuna mfumo wa usalama ulio kamili. Tunakushauri kutunza nenosiri lako kwa usalama.",
          "Kama utagundua shida yoyote ya usalama, tafadhali wasiliana nasi mara moja.",
        ],
      },
      {
        id: "rights",
        icon: UserCheck,
        title: "6. Haki Zako",
        content: [
          "Haki ya Kufikia: Una haki ya kuona taarifa zote tunazokusanya kukuhusu.",
          "Haki ya Kurekebisha: Una haki ya kurekebisha taarifa zako zisizo sahihi.",
          "Haki ya Kufuta: Una haki ya kuomba kufutwa kwa akaunti yako na taarifa zako.",
          "Haki ya Kuzuia: Una haki ya kuzuia matumizi ya taarifa zako kwa madhumuni ya matangazo.",
        ],
      },
      {
        id: "cookies",
        icon: Cookie,
        title: "7. Cookies na Teknolojia Zinazofanana",
        content: [
          "Tunatumia cookies kuboresha uzoefu wako kwenye jukwaa letu.",
          "Cookies zinatusaidia kukumbuka mapendeleo yako, kama lugha unayopendelea.",
          "Unaweza kuzima cookies kwenye browser yako, lakini hii inaweza kuathiri utendaji wa jukwaa letu.",
          "Hatumtumii cookies kufuatilia tabia yako kwenye tovuti zingine.",
        ],
      },
      {
        id: "retention",
        icon: Clock,
        title: "8. Kuhifadhi Taarifa Zako",
        content: [
          "Tunahifadhi taarifa zako kwa muda wote ambao akaunti yako ipo hai.",
          "Kama utafuta akaunti yako, tutafuta taarifa zako isipokuwa zile tunazotakiwa kuhifadhi kwa mujibu wa sheria.",
          "Taarifa za miamala zinaweza kuhifadhiwa kwa muda mrefu kwa madhumuni ya ukaguzi.",
        ],
      },
      {
        id: "children",
        icon: Shield,
        title: "9. Watoto",
        content: [
          "Huduma zetu hazilengi kwa watoto chini ya umri wa miaka 18.",
          "Hatukusanyi kwa makusudi taarifa za watoto chini ya miaka 18.",
          "Kama utagundua kwamba mtoto ametusajili, tafadhali wasiliana nasi ili tufute akaunti hiyo.",
        ],
      },
      {
        id: "changes",
        icon: FileText,
        title: "10. Mabadiliko ya Sera Hii",
        content: [
          "Tunaweza kubadilisha sera hii ya faragha wakati wowote.",
          "Mabadiliko yatatangazwa kwenye jukwaa letu na yataanza kutumika mara moja.",
          "Kuendelea kutumia jukwaa letu baada ya mabadiliko kunamaanisha unakubaliana na sera mpya.",
        ],
      },
      {
        id: "contact",
        icon: Mail,
        title: "11. Mawasiliano",
        content: [
          "Kwa maswali yoyote kuhusu sera hii ya faragha, tafadhali wasiliana nasi:",
          "Barua pepe: privacy@sokomkononi.co.tz",
          "Simu: 0743 895 038",
          "Ofisi: Dar es Salaam, Tanzania",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    subtitle: "We care about your privacy. Read how we collect, use, and protect your information.",
    lastUpdated: "Last updated: 15 September 2026",
    sections: [
      {
        id: "intro",
        icon: Shield,
        title: "1. Introduction",
        content: [
          "SokoMkononi respects your privacy and is committed to protecting your personal information. This policy explains how we collect, use, and protect your information.",
          "By using our platform, you agree to the collection and use of your information as described in this policy.",
        ],
      },
      {
        id: "collection",
        icon: Database,
        title: "2. Information We Collect",
        content: [
          "Personal Information: We collect your name, email, phone number, and other information you provide during registration.",
          "Property Information: We collect information about properties you post, including photos, price, and location.",
          "Usage Information: We collect information about how you use our platform, including pages you visit and your searches.",
          "Device Information: We collect information about the device you use, including device type, browser, and IP address.",
        ],
      },
      {
        id: "usage",
        icon: Eye,
        title: "3. How We Use Your Information",
        content: [
          "Providing Services: We use your information to provide our services, including facilitating communication between buyers and sellers.",
          "Improving Services: We use your information to improve our platform and give you a better experience.",
          "Communication: We may send you emails or SMS about your account, transactions, or our promotions.",
          "Security: We use your information to protect our platform and other users against fraud.",
        ],
      },
      {
        id: "sharing",
        icon: Share2,
        title: "4. Sharing Your Information",
        content: [
          "Other Users: Your public information (name, your properties) may be visible to other users.",
          "Service Providers: We may share your information with payment service providers to facilitate transactions.",
          "Legal: We may share your information if required by law or government authorities.",
          "We do not share your personal information with advertising companies without your consent.",
        ],
      },
      {
        id: "security",
        icon: Lock,
        title: "5. Information Security",
        content: [
          "We use modern technologies to protect your information, including encryption and HTTPS.",
          "Your password is stored securely and cannot be seen by anyone, including our team.",
          "However, no security system is perfect. We advise you to keep your password safe.",
          "If you discover any security issue, please contact us immediately.",
        ],
      },
      {
        id: "rights",
        icon: UserCheck,
        title: "6. Your Rights",
        content: [
          "Right to Access: You have the right to see all information we collect about you.",
          "Right to Correct: You have the right to correct inaccurate information.",
          "Right to Delete: You have the right to request deletion of your account and information.",
          "Right to Object: You have the right to object to the use of your information for advertising purposes.",
        ],
      },
      {
        id: "cookies",
        icon: Cookie,
        title: "7. Cookies and Similar Technologies",
        content: [
          "We use cookies to improve your experience on our platform.",
          "Cookies help us remember your preferences, such as your preferred language.",
          "You can disable cookies in your browser, but this may affect the functionality of our platform.",
          "We do not use cookies to track your behavior on other websites.",
        ],
      },
      {
        id: "retention",
        icon: Clock,
        title: "8. Retaining Your Information",
        content: [
          "We retain your information for as long as your account is active.",
          "If you delete your account, we will delete your information except for what we are required to keep by law.",
          "Transaction information may be retained for longer for audit purposes.",
        ],
      },
      {
        id: "children",
        icon: Shield,
        title: "9. Children",
        content: [
          "Our services are not intended for children under the age of 18.",
          "We do not knowingly collect information from children under 18.",
          "If you discover that a child has registered with us, please contact us so we can delete the account.",
        ],
      },
      {
        id: "changes",
        icon: FileText,
        title: "10. Changes to This Policy",
        content: [
          "We may change this privacy policy at any time.",
          "Changes will be announced on our platform and will take effect immediately.",
          "Continuing to use our platform after changes means you agree to the new policy.",
        ],
      },
      {
        id: "contact",
        icon: Mail,
        title: "11. Contact",
        content: [
          "For any questions about this privacy policy, please contact us:",
          "Email: privacy@sokomkononi.co.tz",
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
          <div className="w-10 h-10 rounded-lg bg-[#2F6D4F]/10 flex items-center justify-center flex-shrink-0">
            <Icon size={18} color={COLORS.green} />
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

export default function PrivacyPage() {
  const { lang } = useLanguage();
  const content = PRIVACY_CONTENT[lang] || PRIVACY_CONTENT.sw;

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
            <div className="w-14 h-14 rounded-2xl bg-[#2F6D4F]/20 flex items-center justify-center flex-shrink-0">
              <Shield size={28} color={COLORS.green} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                {content.title}
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-2xl">
                {content.subtitle}
              </p>
              <p className="text-[#2F6D4F] text-xs mt-3 font-medium">
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
        <div className="mt-8 p-5 bg-[#2F6D4F]/5 border border-[#2F6D4F]/20 rounded-xl">
          <p className="text-sm text-gray-700">
            {lang === "sw"
              ? "Kama una wasiwasi kuhusu faragha yako au unataka kufuta taarifa zako, tafadhali wasiliana nasi kupitia ukurasa wa Mawasiliano."
              : "If you have concerns about your privacy or want to delete your information, please contact us via the Contact page."}
          </p>
          <Link
            to="/mawasiliano"
            className="inline-block mt-3 text-sm font-semibold text-[#2F6D4F] hover:underline"
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
