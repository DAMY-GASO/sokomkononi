import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Navbar from "../components/Navbar.jsx";

function CategoryIcon({ type }) {
  const common = { width: 44, height: 44, viewBox: "0 0 24 24", fill: "none", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "house":
      return (
        <svg {...common} stroke="#E8A33D">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "land":
      return (
        <svg {...common} stroke="#2F6D4F">
          <path d="M12 3v7" />
          <path d="M12 10c-3 0-5-2-5-5" />
          <path d="M12 10c3 0 5-2 5-5" />
          <path d="M6 21h12" />
          <path d="M9 21V13" />
          <path d="M15 21V13" />
        </svg>
      );
    case "car":
      return (
        <svg {...common} stroke="#C1502E">
          <path d="M3 16V12l2.5-5h13L21 12v4" />
          <path d="M3 16h18" />
          <circle cx="7" cy="18" r="1.6" />
          <circle cx="17" cy="18" r="1.6" />
        </svg>
      );
    case "moto":
      return (
        <svg {...common} stroke="#101A2E">
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
          <path d="M6 17h6l3-7h3" />
          <path d="M9 10h4" />
        </svg>
      );
    case "bus":
      return (
        <svg {...common} stroke="#2F6D4F">
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M3 12h18" />
          <circle cx="7.5" cy="19" r="1.4" />
          <circle cx="16.5" cy="19" r="1.4" />
        </svg>
      );
    case "gear":
      return (
        <svg {...common} stroke="#E8A33D">
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.3-2l1.7-1.3-2-3.4-2 .8a7 7 0 0 0-1.7-1l-.3-2.1h-4l-.3 2.1a7 7 0 0 0-1.7 1l-2-.8-2 3.4L6.1 10a7 7 0 0 0 0 4l-1.7 1.3 2 3.4 2-.8a7 7 0 0 0 1.7 1l.3 2.1h4l.3-2.1a7 7 0 0 0 1.7-1l2 .8 2-3.4L18.7 14a7 7 0 0 0 .3-2Z" />
        </svg>
      );
    case "sofa":
      return (
        <svg {...common} stroke="#C1502E">
          <path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
          <path d="M3 12h18v5H3z" />
          <path d="M4 17v2" />
          <path d="M20 17v2" />
        </svg>
      );
    case "electronics":
      return (
        <svg {...common} stroke="#101A2E">
          <rect x="3" y="4" width="18" height="12" rx="1" />
          <path d="M8 20h8" />
          <path d="M12 16v4" />
        </svg>
      );
    case "livestock":
      return (
        <svg {...common} stroke="#8B5E34">
          <path d="M7 9c-1.5-1.5-2-3.5-1.5-5.5C7 4 8.5 5.5 9 7" />
          <path d="M17 9c1.5-1.5 2-3.5 1.5-5.5C17 4 15.5 5.5 15 7" />
          <ellipse cx="12" cy="13" rx="6" ry="5" />
          <circle cx="9.7" cy="12" r="0.8" fill="#8B5E34" stroke="none" />
          <circle cx="14.3" cy="12" r="0.8" fill="#8B5E34" stroke="none" />
          <path d="M10.5 15c.5.5 2.5.5 3 0" />
          <path d="M12 18v2" />
        </svg>
      );
    case "appliance":
      return (
        <svg {...common} stroke="#2F6D4F">
          <path d="M9 3h6l1 4H8l1-4z" />
          <path d="M8 7h8v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7z" />
          <path d="M11 3v-.5" />
          <path d="M13 3v-.5" />
        </svg>
      );
    default:
      return null;
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [appToastShouldRender, setAppToastShouldRender] = useState(false);
  const [appToastVisible, setAppToastVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("app_toast_dismissed")) return;
    const showTimer = setTimeout(() => setAppToastShouldRender(true), 2500);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!appToastShouldRender) return;
    const enterTimer = setTimeout(() => setAppToastVisible(true), 20);
    const autoHideTimer = setTimeout(() => dismissAppToast(), 9000);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(autoHideTimer);
    };
  }, [appToastShouldRender]);

  function dismissAppToast() {
    setAppToastVisible(false);
    sessionStorage.setItem("app_toast_dismissed", "1");
    setTimeout(() => setAppToastShouldRender(false), 300);
  }

  const categories = [
    { name: { sw: "Nyumba", en: "Houses" }, slug: "nyumba", count: "3,200+", icon: "house", img: "/assets/categories/nyumba.jpg" },
    { name: { sw: "Viwanja", en: "Plots & Land" }, slug: "viwanja", count: "2,100+", icon: "land", img: "/assets/categories/viwanja.jpg" },
    { name: { sw: "Magari", en: "Cars" }, slug: "magari", count: "2,800+", icon: "car", img: "/assets/categories/magari.jpg" },
    { name: { sw: "Pikipiki", en: "Motorcycles" }, slug: "pikipiki", count: "1,500+", icon: "moto", img: "/assets/categories/pikipiki.jpg" },
    { name: { sw: "Mabasi", en: "Buses" }, slug: "mabasi", count: "800+", icon: "bus", img: "/assets/categories/mabasi.jpg" },
    { name: { sw: "Mashine", en: "Machinery" }, slug: "mashine", count: "900+", icon: "gear", img: "/assets/categories/mashine.jpg" },
    { name: { sw: "Samani", en: "Furniture" }, slug: "samani", count: "1,200+", icon: "sofa", img: "/assets/categories/samani.jpg" },
    { name: { sw: "Vifaa vya Elektroniki", en: "Electronics" }, slug: "vifaa-vya-elektroniki", count: "2,000+", icon: "electronics", img: "/assets/categories/elektroniki.jpg" },
    { name: { sw: "Mifugo", en: "Livestock" }, slug: "mifugo", count: "1,100+", icon: "livestock", img: "/assets/categories/mifugo.jpg" },
    { name: { sw: "Vifaa vya Nyumbani", en: "Home Appliances" }, slug: "vifaa-vya-nyumbani", count: "1,700+", icon: "appliance", img: "/assets/categories/vifaa-nyumbani.jpg" },
  ];

  // ============================================================
  // FAQ - MASWALI 22 KUTOKA KWA MTEJA
  // ============================================================
  const faqs = [
    {
      q: { sw: "SokoMkononi ni nini?", en: "What is SokoMkononi?" },
      a: {
        sw: "SokoMkononi ni marketplace inayowaunganisha wanunuzi na wauzaji sehemu moja, ili kurahisisha kutafuta, kuuza na kufanya biashara.",
        en: "SokoMkononi is a marketplace that connects buyers and sellers in one place, making it easier to find, sell and do business.",
      },
    },
    {
      q: { sw: "SokoMkononi inafanya kazi vipi?", en: "How does SokoMkononi work?" },
      a: {
        sw: "Muuzaji anaweka bidhaa au mali yake kwenye SokoMkononi, na mnunuzi anatafuta anachohitaji. Wanaweza kuwasiliana, kujadiliana na, inapohitajika, kutumia Deal Room kwa ajili ya mazungumzo na makubaliano ya biashara.",
        en: "A seller lists their product or property on SokoMkononi, and a buyer searches for what they need. They can communicate, negotiate and, when needed, use the Deal Room for discussions and trade agreements.",
      },
    },
    {
      q: { sw: "Je, naweza kutumia akaunti moja kuuza na kununua?", en: "Can I use one account to both buy and sell?" },
      a: {
        sw: "Ndiyo. Akaunti moja inatosha. Unaweza kubadilisha kati ya \"Uza Sasa\" na \"Nunua Sasa\" ndani ya dashboard yako bila kujisajili tena.",
        en: "Yes. One account is enough. You can switch between \"Sell Now\" and \"Buy Now\" within your dashboard without registering again.",
      },
    },
    {
      q: { sw: "Ninawezaje kununua bidhaa au mali?", en: "How can I buy a product or property?" },
      a: {
        sw: "Tafuta bidhaa au mali unayohitaji, angalia taarifa zake na wasiliana na muuzaji. Baada ya kufikia makubaliano, mnaweza kutumia Deal Room kuendelea na hatua za biashara.",
        en: "Search for the product or property you need, review its details and contact the seller. Once you reach an agreement, you can use the Deal Room to continue with the trade steps.",
      },
    },
    {
      q: { sw: "Ninawezaje kuuza kupitia SokoMkononi?", en: "How can I sell through SokoMkononi?" },
      a: {
        sw: "Jisajili, fungua akaunti yako, chagua \"Uza Sasa\", weka taarifa na picha za bidhaa au mali yako, kisha fuata hatua za kulipia Listing Fee na kuchapisha tangazo lako.",
        en: "Register, open your account, select \"Sell Now\", enter details and photos of your product or property, then follow the steps to pay the Listing Fee and publish your listing.",
      },
    },
    {
      q: { sw: "Ninawezaje kuweka tangazo langu?", en: "How can I post my listing?" },
      a: {
        sw: "Ingia kwenye akaunti yako, chagua \"Uza Sasa\", chagua aina ya bidhaa au mali, jaza taarifa zinazohitajika, weka picha nzuri na taarifa sahihi, kisha lipia Listing Fee kabla ya tangazo kuchapishwa.",
        en: "Log into your account, select \"Sell Now\", choose the type of product or property, fill in the required details, add good photos and accurate information, then pay the Listing Fee before the listing is published.",
      },
    },
    {
      q: { sw: "Je, kuweka tangazo ni bure?", en: "Is posting a listing free?" },
      a: {
        sw: "Hapana. Listing Fee inalipwa kabla ya kuchapisha tangazo. Kiasi cha ada kinategemea bei ya bidhaa au mali inayowekwa kwenye listing.",
        en: "No. A Listing Fee is paid before publishing a listing. The fee amount depends on the price of the product or property listed.",
      },
    },
    {
      q: { sw: "SokoMkononi inapataje mapato?", en: "How does SokoMkononi earn revenue?" },
      a: {
        sw: "SokoMkononi ina njia kuu 5 za mapato:\n\n1️⃣ Listing Fee — Muuzaji hulipia kabla ya kuchapisha listing. Ada hupungua kadri bei ya bidhaa/mali inavyokuwa kubwa na huongezeka kadri bei inavyokuwa ndogo.\n\n2️⃣ Reservation Fee — Baada ya mnunuzi na muuzaji kufikia makubaliano kupitia Deal Room, mnunuzi anaweza kulipia reservation ya saa 24, 48, 72 au Custom. Kadri muda wa reservation unavyoongezeka, ada huongezeka.\n\n3️⃣ Boosting Fee — Muuzaji anaweza kubofya \"Boost Sasa\" na kulipia ili tangazo lake lipewe kipaumbele na kuonekana zaidi kwenye listings.\n\n4️⃣ Leading Fee — Muuzaji anaweza kulipia kipaumbele kwenye matokeo ya search ili bidhaa yake ionekane juu zaidi wakati wanunuzi wanatafuta bidhaa zinazofanana.\n\n5️⃣ Ads Fee — Muuzaji au biashara inaweza kulipia kuweka bidhaa au huduma kama tangazo maalum ndani ya mfumo kwa ajili ya kuongeza mwonekano.",
        en: "SokoMkononi has 5 main revenue streams:\n\n1️⃣ Listing Fee — Seller pays before publishing a listing. The fee decreases as the price of the product/property increases and increases as the price decreases.\n\n2️⃣ Reservation Fee — After buyer and seller reach an agreement via Deal Room, the buyer can pay for a reservation of 24, 48, 72 hours or Custom. The longer the reservation period, the higher the fee.\n\n3️⃣ Boosting Fee — A seller can click \"Boost Now\" and pay to give their listing priority and more visibility in listings.\n\n4️⃣ Leading Fee — A seller can pay for priority in search results so their product appears higher when buyers search for similar products.\n\n5️⃣ Ads Fee — A seller or business can pay to place a product or service as a special ad within the system to increase visibility.",
      },
    },
    {
      q: { sw: "Je, kuna app ya simu?", en: "Is there a mobile app?" },
      a: {
        sw: "Ndiyo, app ya Android na iOS inakuja hivi karibuni. Kwa sasa unaweza kutumia tovuti ya SokoMkononi kupitia simu na, ikiwa browser yako inaunga mkono, kutumia kipengele cha \"Install/Add to Home Screen\" ili kuitumia kama app.\n\nUnaweza pia kujiunga na Waitlist ili kupata taarifa app itakapopatikana.",
        en: "Yes, an Android and iOS app is coming soon. For now you can use the SokoMkononi website on your phone and, if your browser supports it, use the \"Install/Add to Home Screen\" feature to use it like an app.\n\nYou can also join the Waitlist to get notified when the app is available.",
      },
    },
    {
      q: { sw: "Je, SokoMkononi ni salama?", en: "Is SokoMkononi safe?" },
      a: {
        sw: "SokoMkononi inalenga kujenga mazingira ya biashara yenye uwazi na uaminifu, pamoja na kusaidia uthibitishaji wa watumiaji. Hata hivyo, kila mnunuzi na muuzaji anapaswa kuthibitisha taarifa za bidhaa, mali na mhusika kabla ya kufanya muamala.",
        en: "SokoMkononi aims to build a transparent and trustworthy trading environment, and supports user verification. However, every buyer and seller should verify product, property and party information before making a transaction.",
      },
    },
    {
      q: { sw: "Ninawezaje kujua muuzaji ni halali?", en: "How can I know if a seller is legitimate?" },
      a: {
        sw: "Angalia taarifa za muuzaji na tangazo lake. Kwa bidhaa au mali zenye thamani kubwa, hakikisha utambulisho, umiliki, nyaraka na taarifa muhimu vimethibitishwa kabla ya kufanya malipo.",
        en: "Review the seller's information and their listing. For high-value products or properties, make sure identity, ownership, documents and important information are verified before making payment.",
      },
    },
    {
      q: { sw: "Deal Room ni nini?", en: "What is a Deal Room?" },
      a: {
        sw: "Deal Room ni sehemu maalum ndani ya SokoMkononi inayosaidia mnunuzi na muuzaji kuwasiliana, kujadiliana na kuweka kumbukumbu ya makubaliano yao wakati wa mchakato wa biashara.",
        en: "A Deal Room is a special section within SokoMkononi that helps buyers and sellers communicate, negotiate and keep a record of their agreement during the trade process.",
      },
    },
    {
      q: { sw: "Reservation Fee ni nini?", en: "What is a Reservation Fee?" },
      a: {
        sw: "Ni ada inayolipwa na mnunuzi baada ya kufikia makubaliano kupitia Deal Room, ili bidhaa iwe reserved kwa muda aliochagua — saa 24, 48, 72 au Custom.\n\nWakati bidhaa ikiwa reserved, itaendelea kuonekana kwenye listings, lakini wanunuzi wengine hawataweza kuwasiliana na muuzaji mpaka muda wa reservation uishe.",
        en: "It is a fee paid by the buyer after reaching an agreement via the Deal Room, to reserve the product for the period they choose — 24, 48, 72 hours or Custom.\n\nWhile the product is reserved, it will still appear in listings, but other buyers cannot contact the seller until the reservation period ends.",
      },
    },
    {
      q: { sw: "Nini kinatokea nikikagua mali na nikakuta si kama ilivyoelezwa?", en: "What happens if I inspect a property and find it's not as described?" },
      a: {
        sw: "Baada ya kipindi cha Inspection, ukigundua kuwa bidhaa au mali si kama ilivyoelezwa kwenye listing, unaweza kuchagua \"Not As Described.\"\n\nHapo mazungumzo yanaweza kurudi kwenye Deal Room kwa ajili ya kuendelea na negotiation au, ikiwa utaamua kutokendelea, unaweza kughairi transaction kwa kufuata masharti ya SokoMkononi.",
        en: "After the Inspection period, if you discover that the product or property is not as described in the listing, you can choose \"Not As Described.\"\n\nThen the conversation can return to the Deal Room for further negotiation or, if you decide not to continue, you can cancel the transaction by following SokoMkononi's terms.",
      },
    },
    {
      q: { sw: "Je, SokoMkononi inashikilia fedha au mali ya muamala?", en: "Does SokoMkononi hold funds or property of the transaction?" },
      a: {
        sw: "Hapana. SokoMkononi ni marketplace inayowaunganisha wanunuzi na wauzaji. Haimiliki wala kushikilia mali ya muamala. Masharti ya huduma yoyote inayohusisha malipo yataonyeshwa wazi kabla ya mtumiaji kuthibitisha.",
        en: "No. SokoMkononi is a marketplace that connects buyers and sellers. It does not own or hold the transaction's property. Terms for any service involving payment will be clearly shown before the user confirms.",
      },
    },
    {
      q: { sw: "Ninawezaje kuwasiliana na muuzaji?", en: "How can I contact a seller?" },
      a: {
        sw: "Fungua listing unayovutiwa nayo na tumia njia ya mawasiliano iliyowekwa. Ikiwa mazungumzo yamefikia hatua ya deal, mnaweza kutumia Deal Room kuendelea na mchakato.",
        en: "Open the listing you're interested in and use the provided contact method. If the conversation reaches a deal stage, you can use the Deal Room to continue the process.",
      },
    },
    {
      q: { sw: "Ninawezaje kuongeza mwonekano wa listing yangu?", en: "How can I increase my listing's visibility?" },
      a: {
        sw: "Unaweza kutumia huduma za Boosting au Leading:\n\n• Boost Sasa — kuongeza mwonekano wa listing kwenye marketplace.\n• Leading — kuipa listing kipaumbele kwenye matokeo ya search.",
        en: "You can use Boosting or Leading services:\n\n• Boost Now — increase listing visibility in the marketplace.\n• Leading — give your listing priority in search results.",
      },
    },
    {
      q: { sw: "Ads Fee ni nini?", en: "What is an Ads Fee?" },
      a: {
        sw: "Ads Fee ni gharama ya kuweka bidhaa au huduma kama tangazo maalum ndani ya mfumo wa SokoMkononi ili kuongeza mwonekano wake kwa watumiaji.",
        en: "An Ads Fee is the cost of placing a product or service as a special ad within SokoMkononi to increase its visibility to users.",
      },
    },
    {
      q: { sw: "Listing Fee na Boosting Fee vina tofauti gani?", en: "What's the difference between Listing Fee and Boosting Fee?" },
      a: {
        sw: "Listing Fee — ada ya kuchapisha listing.\nBoosting Fee — ada ya kuongeza mwonekano na kipaumbele cha listing iliyokwishawekwa.",
        en: "Listing Fee — the fee to publish a listing.\nBoosting Fee — the fee to increase visibility and priority of an already-posted listing.",
      },
    },
    {
      q: { sw: "Ninawezaje kuripoti tangazo la uongo au mtu tapeli?", en: "How can I report a fake listing or scammer?" },
      a: {
        sw: "Usifanye malipo wala kutoa taarifa nyeti. Tumia kitufe cha \"Ripoti\" kuripoti listing au mtumiaji kwa SokoMkononi.",
        en: "Do not make payments or share sensitive information. Use the \"Report\" button to report the listing or user to SokoMkononi.",
      },
    },
    {
      q: { sw: "Ninawezaje kuripoti listing au mtumiaji?", en: "How can I report a listing or user?" },
      a: {
        sw: "Fungua listing au wasifu husika, chagua \"Ripoti\", kisha eleza tatizo. Timu ya SokoMkononi inaweza kukagua taarifa hiyo na kuchukua hatua stahiki.",
        en: "Open the relevant listing or profile, select \"Report\", then describe the issue. SokoMkononi's team can review the report and take appropriate action.",
      },
    },
    {
      q: { sw: "Ni bidhaa/mali gani zinaweza kuwekwa SokoMkononi?", en: "What products/properties can be listed on SokoMkononi?" },
      a: {
        sw: "Kwa sasa SokoMkononi inalenga:\n\n🏠 Nyumba & Majengo\n🌍 Viwanja & Mashamba\n🚗 Magari\n🏢 Biashara Zinazouzwa\n🚜 Mashine / Heavy Equipment\n📦 Mali/Bidhaa Nyinginezo\n\nBidhaa au mali lazima ziwe halali na zifuate masharti ya SokoMkononi.",
        en: "Currently SokoMkononi focuses on:\n\n🏠 Houses & Buildings\n🌍 Plots & Farms\n🚗 Cars\n🏢 Businesses for Sale\n🚜 Machinery / Heavy Equipment\n📦 Other Goods/Products\n\nProducts or properties must be legal and comply with SokoMkononi's terms.",
      },
    },
    {
      q: { sw: "Je, SokoMkononi inahakikisha bidhaa au mali ninayonunua?", en: "Does SokoMkononi guarantee the product or property I'm buying?" },
      a: {
        sw: "SokoMkononi inawaunganisha wanunuzi na wauzaji na kutoa mazingira ya kusaidia biashara kufanyika kwa uwazi. Hata hivyo, mnunuzi anapaswa kukagua na kuthibitisha bidhaa, mali, umiliki na nyaraka kabla ya kufanya muamala.",
        en: "SokoMkononi connects buyers and sellers and provides an environment that helps trade happen transparently. However, the buyer should inspect and verify the product, property, ownership and documents before making a transaction.",
      },
    },
  ];

  const trendingProperties = [
    { id: "n1", title: "Nyumba ya Vyumba 3, Mbezi", region: "Dar es Salaam", price: "TSh 35,000,000", img: "/assets/trendings/dar-es-salaam.jpg" },
    { id: "m1", title: "Gari Ndogo la Mjini, Njiro", region: "Arusha", price: "TSh 12,500,000", img: "/assets/trendings/arusha.jpg" },
    { id: "ma1", title: "Pikipiki ya Boxer, Ilemela", region: "Mwanza", price: "TSh 2,800,000", img: "/assets/trendings/mwanza.jpg" },
    { id: "m2", title: "Basi la Abiria, Area D", region: "Dodoma", price: "TSh 95,000,000", img: "/assets/trendings/dodoma.jpg" },
    { id: "ma2", title: "Trekta la Kilimo, Iyunga", region: "Mbeya", price: "TSh 68,000,000", img: "/assets/trendings/mbeya.jpg" },
    { id: "s1", title: "Kabati la Sebule, Kiembesamaki", region: "Zanzibar", price: "TSh 450,000", img: "/assets/trendings/zanzibar.jpg" },
    { id: "v1", title: "Shamba Tayari kwa Kilimo, Kilosa", region: "Morogoro", price: "TSh 1,500,000", img: "/assets/trendings/morogoro.jpg" },
    { id: "v2", title: "Shamba la Kilimo, Ismani", region: "Iringa", price: "TSh 8,500,000", img: "/assets/trendings/iringa.jpg" },
    { id: "li1", title: "Mbuzi wa Kienyeji, Ilongero", region: "Singida", price: "TSh 120,000", img: "/assets/trendings/singida.jpg" },
  ];

  const testimonials = [
    {
      name: "Mary",
      region: "Dar es Salaam",
      avatar: "/assets/testimonials/marry.jpg",
      quote: {
        sw: "Nilinunua nyumba yangu kwa urahisi kupitia SokoMkononi. Mchakato wote ulikuwa rahisi na salama.",
        en: "I bought my house easily through SokoMkononi. The whole process was simple and secure.",
      },
    },
    {
      name: "Juma",
      region: "Arusha",
      avatar: "/assets/testimonials/juma.jpg",
      quote: {
        sw: "Nimeuza magari matatu kwa mwezi mmoja pekee! Jukwaa hili limebadilisha biashara yangu.",
        en: "I've sold three cars in just one month! This platform has transformed my business.",
      },
    },
    {
      name: "Fatima",
      region: "Mwanza",
      avatar: "/assets/testimonials/fatima.jpg",
      quote: {
        sw: "Nilipata kiwanja bora kwa bei nzuri. Nashukuru SokoMkononi kwa uwazi wao.",
        en: "I found a great plot at a good price. Thank you SokoMkononi for your transparency.",
      },
    },
    {
      name: "David",
      region: "Dodoma",
      avatar: "/assets/testimonials/david.jpg",
      quote: {
        sw: "SokoMkononi imenisaidia kupata wateja wa kuaminika kwa bidhaa zangu za kilimo. Mapato yameongezeka mara mbili!",
        en: "SokoMkononi has helped me find reliable customers for my agricultural products. My income has doubled!",
      },
    },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/tafuta?tafuta=${encodeURIComponent(q)}`);
  };

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================================ */}
      {/* NAVBAR */}
      {/* ============================================================ */}
      <Navbar 
        lang={lang} 
        setLang={setLang} 
        categories={categories}
      />

      {/* ============================================================ */}
      {/* HERO SECTION */}
      {/* ============================================================ */}
      <section className="bg-[#101A2E] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mt-3 leading-tight">
            {lang === "sw" ? "Nunua na Uza Mali kwa Urahisi" : "Buy and Sell Property Easily"}
          </h1>
          <p className="text-white/70 text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            {lang === "sw"
              ? "SokoMkononi ni jukwaa salama la kununua na kuuza nyumba, magari, viwanja na mali nyingine."
              : "SokoMkononi is a safe platform to buy and sell houses, cars, land and other properties."}
          </p>

          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mt-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "sw" ? "Tafuta nyumba, gari, kiwanja..." : "Search houses, cars, land..."}
                className="w-full bg-white/10 border border-white/20 rounded-full pl-6 pr-14 py-3.5 text-white text-base placeholder-white/50 focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/30 transition-all"
              />
              <button 
                type="submit" 
                aria-label={lang === "sw" ? "Tafuta" : "Search"}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] p-2.5 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link to="/register?intent=buy" className="bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold px-6 py-3 rounded-md transition-colors">
              {lang === "sw" ? "Nunua Sasa" : "Buy Now"}
            </Link>
            <Link to="/register?intent=sell" className="bg-[#2F6D4F] hover:bg-[#245a41] text-white font-semibold px-6 py-3 rounded-md transition-colors">
              {lang === "sw" ? "Uza Sasa" : "Sell Now"}
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link to="/waitlist" className="flex items-center gap-2 border border-white/20 rounded-md px-4 py-2 hover:bg-white/5 transition-colors">
              <svg width="20" height="20" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.7,19.2L4.3,35.3c0,0,0,0,0,0c0.5,1.7,2.1,3,4,3c0.8,0,1.5-0.2,2.1-0.6l0,0l17.4-9.9L19.7,19.2z" fill="#EA4335" />
                <path d="M35.3,16.4L35.3,16.4l-7.5-4.3l-8.4,7.4l8.5,8.3l7.5-4.2c1.3-0.7,2.2-2.1,2.2-3.6C37.5,18.5,36.6,17.1,35.3,16.4z" fill="#FBBC04" />
                <path d="M4.3,4.7C4.2,5,4.2,5.4,4.2,5.8v28.5c0,0.4,0,0.7,0.1,1.1l16-15.7L4.3,4.7z" fill="#4285F4" />
                <path d="M19.8,20l8-7.9L10.5,2.3C9.9,1.9,9.1,1.7,8.3,1.7c-1.9,0-3.6,1.3-4,3c0,0,0,0,0,0L19.8,20z" fill="#34A853" />
              </svg>
              <span className="text-xs text-left">
                <span className="block text-white/50 text-[10px]">{lang === "sw" ? "Pata kwenye" : "Get it on"}</span>
                <span className="block font-semibold text-white">Google Play</span>
              </span>
            </Link>
            <Link to="/waitlist" className="flex items-center gap-2 border border-white/20 rounded-md px-4 py-2 hover:bg-white/5 transition-colors">
              <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M16.7 1.3c.1 1-.3 2-.9 2.8-.6.8-1.7 1.4-2.7 1.3-.1-1 .4-2 1-2.7.6-.8 1.7-1.3 2.6-1.4Z" />
                <path d="M20.9 17c-.5 1.1-.7 1.6-1.3 2.6-.9 1.4-2.1 3.1-3.6 3.1-1.3 0-1.7-.9-3.5-.9s-2.2.9-3.5.9c-1.5 0-2.6-1.5-3.5-2.9C3.2 17 2.5 13 3.6 10.5c.7-1.6 2-2.6 3.4-2.6 1.3 0 2.2.9 3.3.9 1.1 0 1.7-.9 3.5-.9 1.3 0 2.7.7 3.7 1.9-3.2 1.8-2.7 6.5.4 7.2Z" />
              </svg>
              <span className="text-xs text-left">
                <span className="block text-white/50 text-[10px]">{lang === "sw" ? "Pata kwenye" : "Get it on"}</span>
                <span className="block font-semibold text-white">App Store</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STATS SECTION */}
      {/* ============================================================ */}
     <section className="bg-[#0D1524] text-white py-8">
  <div className="max-w-3xl mx-auto px-4 grid grid-cols-2 gap-8 text-center">
    <div>
      <p className="text-2xl md:text-3xl font-bold text-[#E8A33D]">5,000+</p>
      <p className="text-white/50 text-xs md:text-sm mt-1">{lang === "sw" ? "Wauzaji" : "Sellers"}</p>
    </div>
    <div>
      <p className="text-2xl md:text-3xl font-bold text-[#E8A33D]">10,000+</p>
      <p className="text-white/50 text-xs md:text-sm mt-1">{lang === "sw" ? "Mali" : "Properties"}</p>
    </div>
  </div>
</section>

      {/* ============================================================ */}
{/* WHY SOKOMKONONI */}
{/* ============================================================ */}
<section className="py-16 px-4 max-w-6xl mx-auto">
  <div className="text-center mb-12">
    <h2 className="text-3xl font-bold text-gray-800">
      {lang === "sw" ? "Kwa Nini SokoMkononi?" : "Why SokoMkononi?"}
    </h2>
    <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
      {lang === "sw"
        ? "Jukwaa la kisasa linalowaunganisha wanunuzi na wauzaji wa mali Tanzania kwa urahisi, uwazi na kuaminiana."
        : "A modern platform connecting property buyers and sellers in Tanzania with ease, transparency and trust."}
    </p>
    
    {/* Tagline */}
    <div className="flex flex-wrap items-center justify-center gap-3 mt-5 text-sm font-medium text-[#E8A33D]">
      <span>🔎 {lang === "sw" ? "Tafuta" : "Search"}</span>
      <span className="text-gray-300">|</span>
      <span>🤝 {lang === "sw" ? "Ungana" : "Connect"}</span>
      <span className="text-gray-300">|</span>
      <span>💬 {lang === "sw" ? "Jadiliana" : "Negotiate"}</span>
    </div>
    
    <p className="text-sm text-gray-500 mt-3 italic">
      {lang === "sw"
        ? "SokoMkononi — Nunua na Uza kwa Kujiamini"
        : "SokoMkononi — Buy and Sell with Confidence"}
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
    {/* Salama na Inaaminika - IMEBADILISHWA */}
    <div className="p-8 bg-[#F5F3EC] rounded-xl text-center flex flex-col items-center">
      <div className="w-16 h-16 bg-[#E8A33D]/20 rounded-full flex items-center justify-center mb-5">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8">
          <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="font-bold text-lg text-gray-800">
        {lang === "sw" ? " Salama na Inaaminika" : " Safe & Trusted"}
      </h3>
      <p className="text-gray-600 text-sm mt-3 leading-relaxed max-w-sm">
        {lang === "sw"
          ? "Tunajenga mazingira ya biashara yenye uwazi na uaminifu, huku watumiaji wakipewa nafasi ya kuthibitisha taarifa kabla ya kufanya muamala."
          : "We build a transparent and trustworthy trading environment, while giving users the opportunity to verify information before making a transaction."}
      </p>
    </div>

    {/* Upatikanaji Rahisi - IMEBADILISHWA */}
    <div className="p-8 bg-[#F5F3EC] rounded-xl text-center flex flex-col items-center">
      <div className="w-16 h-16 bg-[#2F6D4F]/20 rounded-full flex items-center justify-center mb-5">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="1.8">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <h3 className="font-bold text-lg text-gray-800">
        {lang === "sw" ? " Upatikanaji Rahisi" : " Easy Access"}
      </h3>
      <p className="text-gray-600 text-sm mt-3 leading-relaxed max-w-sm">
        {lang === "sw"
          ? "Tafuta na pata mali unayohitaji popote Tanzania, kwa urahisi kupitia SokoMkononi Web Platform na Apps za iOS & Android."
          : "Find and get the property you need anywhere in Tanzania, easily through the SokoMkononi Web Platform and iOS & Android Apps."}
      </p>
    </div>
  </div>
</section>

      {/* ============================================================ */}
      {/* PROPERTY CAROUSEL - ID="matangazo" */}
      {/* ============================================================ */}
      <section id="matangazo" className="py-8 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{lang === "sw" ? "Mali Zinazotrendi" : "Trending Properties"}</h2>
          <Link to="/tafuta?tafuta=trending" className="text-[#E8A33D] text-sm font-semibold hover:underline">
            {lang === "sw" ? "Tazama Zote →" : "View All →"}
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {trendingProperties.map((prop) => (
            <Link 
              key={prop.id} 
              to={`/mali/${prop.id}`}
              className="min-w-[200px] sm:min-w-[240px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-shrink-0 hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-[#F5F3EC] overflow-hidden">
                <img
                  src={prop.img}
                  alt={prop.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-sm truncate">{prop.title}</h3>
                <p className="text-[#E8A33D] font-bold text-lg">{prop.price}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500 text-xs">📍 {prop.region}</span>
                  <span className="text-green-600 text-xs font-medium">● {lang === "sw" ? "Inapatikana" : "Available"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* CATEGORIES - ID="kategoria" */}
      {/* ============================================================ */}
      <section id="kategoria" className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{lang === "sw" ? "Kategoria Maarufu" : "Popular Categories"}</h2>
          <Link to="/kategoria" className="text-[#E8A33D] text-sm font-semibold hover:underline">{lang === "sw" ? "Tazama Yote →" : "View All →"}</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} to={`/kategoria/${cat.slug}`} className="bg-white rounded-lg overflow-hidden text-center border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="h-36 sm:h-40 overflow-hidden bg-[#F5F3EC]">
                <img
                  src={cat.img}
                  alt={lang === "sw" ? cat.name.sw : cat.name.en}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-800 text-sm">{lang === "sw" ? cat.name.sw : cat.name.en}</h3>
                <p className="text-xs text-gray-500">{cat.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================================ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
          {lang === "sw" ? "Wanachosema Wadau Wetu" : "What Our Contributors Say"}
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="min-w-[220px] sm:min-w-[280px] max-w-[240px] sm:max-w-[300px] h-64 sm:h-72 bg-[#F5F3EC] rounded-xl p-5 sm:p-6 flex-shrink-0 snap-center flex flex-col"
            >
              <img
                src={item.avatar}
                alt={item.name}
                loading="lazy"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover mx-auto mb-3 sm:mb-4 border-2 border-white shadow-sm flex-shrink-0"
              />
              <p
                className="text-gray-700 text-sm leading-relaxed text-center overflow-hidden flex-1"
                style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}
              >
                "{lang === "sw" ? item.quote.sw : item.quote.en}"
              </p>
              <p className="text-[#E8A33D] font-semibold mt-3 text-sm text-center flex-shrink-0">— {item.name}, {item.region}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ - ID="faq" - MASWALI 22 KUTOKA KWA MTEJA */}
      {/* ============================================================ */}
      <section id="faq" className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
          {lang === "sw" ? "Maswali Yanayoulizwa Mara kwa Mara" : "Frequently Asked Questions"}
        </h2>
        <p className="text-gray-500 text-sm text-center mb-12">
          {lang === "sw"
            ? "Majibu ya maswali yanayoulizwa sana kuhusu SokoMkononi"
            : "Answers to the most frequently asked questions about SokoMkononi"}
        </p>
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-[#F5F3EC]/60 transition-colors"
                >
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base flex-1">
                    <span className="text-[#E8A33D] mr-2">{index + 1}.</span>
                    {lang === "sw" ? faq.q.sw : faq.q.en}
                  </h3>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 text-[#E8A33D] transition-transform duration-200 mt-0.5 ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  style={{ display: "grid" }}
                >
                  <div className="overflow-hidden">
                    <div className="text-gray-600 text-sm px-4 pb-4 whitespace-pre-line leading-relaxed">
                      {lang === "sw" ? faq.a.sw : faq.a.en}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <Footer selectedLang={lang} />

      {/* ============================================================ */}
      {/* FLOATING APP NOTIFICATION */}
      {/* ============================================================ */}
      {appToastShouldRender && (
        <div
          className={`fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[60] transition-all duration-300 ${
            appToastVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="bg-[#101A2E] text-white rounded-xl shadow-2xl border border-white/10 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8A33D]/15 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {lang === "sw" ? "App ya SokoMkononi inakuja!" : "The SokoMkononi app is coming!"}
              </p>
              <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                {lang === "sw" ? "Jiunge na waitlist ili uwe wa kwanza kujua." : "Join the waitlist to be first to know."}
              </p>
              <Link
                to="/waitlist"
                onClick={dismissAppToast}
                className="inline-block mt-2 text-[#E8A33D] text-xs font-semibold hover:underline"
              >
                {lang === "sw" ? "Jiunge Sasa →" : "Join Now →"}
              </Link>
            </div>
            <button
              onClick={dismissAppToast}
              aria-label={lang === "sw" ? "Funga" : "Close"}
              className="text-white/40 hover:text-white flex-shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
