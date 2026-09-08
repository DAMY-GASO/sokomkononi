import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

const translations = {
  sw: {
    // Hero
    hero_eyebrow: "Soko la Kidijitali la Mali",
    hero_headline: "Nunua na Uza Mali kwa Urahisi",
    hero_subtext: "SokoMkononi ni jukwaa salama la kununua na kuuza nyumba, magari, viwanja na mali nyingine.",
    cta_buy: "Nunua Sasa",
    cta_sell: "Uza Bidhaa",
    hero_app_teaser: "⬇ Pakua App yetu",

    // Categories
    categories_heading: "Kategoria Maarufu",
    cat_nyumba: "Nyumba",
    cat_viwanja: "Viwanja",
    cat_magari: "Magari",
    cat_biashara: "Biashara",
    cat_mashine: "Mashine",
    cat_count_suffix: "+",

    // Stats
    stats_sellers: "Wauzaji",
    stats_properties: "Mali",
    stats_deals: "Mikataba",

    // Why Section
    why_heading: "Kwa nini SokoMkononi?",
    why_subtext: "Tumeunda jukwaa ambalo linawapa wanunuzi na wauzaji uhakika wa usalama na urahisi.",
    why_point1_title: "Salama na Inaaminika",
    why_point1_body: "Kila muamala unathibitishwa na timu yetu ili kuhakikisha usalama wa pande zote.",
    why_point2_title: "Upatikanaji Rahisi",
    why_point2_body: "Tumia app yetu kupata mali yoyote popote ulipo nchini Tanzania.",
    why_point3_title: "Bei za Ushindani",
    why_point3_body: "Pata bei nzuri na uwezo wa kujadili moja kwa moja na wauzaji.",

    // Testimonials
    testimonials_heading: "Wanachosema Wateja Wetu",
    testimonial1_quote: "Nilinunua nyumba yangu kwa urahisi kupitia SokoMkononi. Mchakato wote ulikuwa rahisi na salama.",
    testimonial1_name: "— Mary, Dar es Salaam",
    testimonial2_quote: "Nimeuza magari matatu kwa mwezi mmoja pekee! Jukwaa hili limebadilisha biashara yangu.",
    testimonial2_name: "— Juma, Arusha",
    testimonial3_quote: "Nilipata kiwanja bora kwa bei nzuri. Nashukuru SokoMkononi kwa uwazi wao.",
    testimonial3_name: "— Fatima, Mwanza",

    // App Download
    appsec_eyebrow: "Pakua App Yetu",
    appsec_heading: "Furahia SokoMkononi Popote",
    appsec_body: "Pakua app yetu na uweze kununua na kuuza mali yoyote kwa urahisi kwenye simu yako.",
    badge_get_it_on: "Pata kwenye",
    badge_google_play: "Google Play",
    badge_download_on: "Pakua kwenye",
    badge_app_store: "App Store",

    // FAQ
    faq_heading: "Maswali Yanayoulizwa Sana",
    faq_q1: "Je, SokoMkononi ni salama?",
    faq_a1: "Ndio, SokoMkononi ina mfumo wa uthibitishaji wa wauzaji na wanunuzi, pamoja na mfumo wa malipo salama.",
    faq_q2: "Ninawezaje kuuza mali yangu?",
    faq_a2: "Bonyeza kitufe cha 'Uza' na ujaze maelezo ya mali yako. Timu yetu itaipitia na kuiweka kwenye soko.",
    faq_q3: "Je, kuna ada ya matumizi?",
    faq_a3: "SokoMkononi inatoza ada ndogo baada ya mauzo kukamilika. Hakuna malipo ya awali.",
    faq_q4: "Ninawezaje kuwasiliana na muuzaji?",
    faq_a4: "Baada ya kuonyesha nia ya kununua, unaweza kuwasiliana moja kwa moja kwenye 'Deal Room' yetu.",

    // Final CTA
    finalcta_heading: "Anza Safari Yako ya Mali Leo",
    finalcta_subtext: "Jiunge na maelfu ya wanunuzi na wauzaji kwenye jukwaa letu.",

    // Footer
    footer_company_heading: "Kampuni",
    footer_about: "Kuhusu Sisi",
    footer_contact: "Wasiliana Nasi",
    footer_careers: "Kazi Kwetu",
    footer_categories_heading: "Kategoria",
    footer_support_heading: "Msaada",
    footer_faq: "Maswali",
    footer_safety: "Usalama",
    footer_terms: "Vigezo vya Matumizi",
    footer_privacy: "Sera ya Faragha",
    footer_tagline: "Jukwaa la kuaminika la kununua na kuuza mali nchini Tanzania.",
    footer_rights: "Haki zote zimehifadhiwa.",
    footer_payments_label: "Malipo yanakubaliwa:",

    // Navbar
    nav_login: "Ingia",
    nav_post_ad: "Weka Tangazo",
    nav_dashboard: "Dashibodi",
    nav_logout: "Toka",
    nav_menu: "Menyu",

    // Coming Soon
    comingsoon_eyebrow: "Karibuni",
    comingsoon_heading: "App Inakuja Hivi Karibuni",
    comingsoon_body: "Tunatengeneza app ya simu ili kukurahisishia zaidi. Jiandikisha ili upate taarifa za kwanza.",
    comingsoon_email_placeholder: "Barua pepe yako",
    comingsoon_submit: "Jiandikisha",
    comingsoon_success: "Asante! Tutakujulisha app inapotoka.",
    comingsoon_android_soon: "Android inakuja",
    comingsoon_ios_soon: "iOS inakuja",

    // Dashboard
    dash_buy_tab: "Ninunue",
    dash_sell_tab: "Niuze",

    // Deal Room
    dealroom_loading: "Inapakia...",
    dealroom_not_found: "Deal Room haikupatikana",
    dealroom_product_label: "BIDHAA",
    dealroom_seller_label: "MUZAJI",
    dealroom_buyer_label: "MNUUNUZI",
    dealroom_you_suffix: "(Wewe)",
    dealroom_agreed_banner: "Bei Imekubaliwa: TZS {price}",
    dealroom_create_transaction: "Anzisha Muamala",
    dealroom_creating_transaction: "Inaanzisha...",
    dealroom_transaction_pending_note: "Muamala utathibitishwa ndani ya saa 48.",
    dealroom_negotiation_heading: "MAJADILIANO",
    dealroom_empty_thread: "Hakuna ujumbe bado. Anza majadiliano!",
    dealroom_agree_button: "Kubali Bei",
    dealroom_agreeing: "Inakubali...",
    dealroom_agreed_locked: "Bei imekubaliwa. Majadiliano yamefungwa.",
    dealroom_message_placeholder: "Andika ujumbe...",
    dealroom_offer_placeholder: "Bei (TZS)",
    dealroom_send: "Tuma",
    dealroom_sending: "Inatuma...",
    dealroom_send_error: "Imeshindikana kutuma ujumbe.",
    dealroom_agree_error: "Imeshindikana kukubali bei.",
    dealroom_join_waiting: "Jiunge na Orodha ya Kusubiri",

    // Property Detail
    seller_label: "Muuzaji",
    buy_now: "Nunua Sasa",
    join_waiting_list: "Jiunge na Orodha ya Kusubiri",
  },
  en: {
    hero_eyebrow: "Digital Property Marketplace",
    hero_headline: "Buy and Sell Property Easily",
    hero_subtext: "SokoMkononi is a safe platform to buy and sell houses, cars, land and other properties.",
    cta_buy: "Buy Now",
    cta_sell: "Sell Item",
    hero_app_teaser: "⬇ Download Our App",

    categories_heading: "Popular Categories",
    cat_nyumba: "Houses",
    cat_viwanja: "Land",
    cat_magari: "Cars",
    cat_biashara: "Business",
    cat_mashine: "Machinery",
    cat_count_suffix: "+",

    stats_sellers: "Sellers",
    stats_properties: "Properties",
    stats_deals: "Deals",

    why_heading: "Why SokoMkononi?",
    why_subtext: "We've built a platform that gives buyers and sellers confidence and convenience.",
    why_point1_title: "Safe & Trusted",
    why_point1_body: "Every transaction is verified by our team to ensure safety for all parties.",
    why_point2_title: "Easy Access",
    why_point2_body: "Use our app to find any property anywhere in Tanzania.",
    why_point3_title: "Competitive Prices",
    why_point3_body: "Get great prices and negotiate directly with sellers.",

    testimonials_heading: "What Our Customers Say",
    testimonial1_quote: "I bought my house easily through SokoMkononi. The whole process was simple and secure.",
    testimonial1_name: "— Mary, Dar es Salaam",
    testimonial2_quote: "I've sold three cars in just one month! This platform has transformed my business.",
    testimonial2_name: "— Juma, Arusha",
    testimonial3_quote: "I found a great plot at a good price. Thank you SokoMkononi for your transparency.",
    testimonial3_name: "— Fatima, Mwanza",

    appsec_eyebrow: "Download Our App",
    appsec_heading: "Enjoy SokoMkononi Anywhere",
    appsec_body: "Download our app and buy or sell any property easily on your phone.",
    badge_get_it_on: "Get it on",
    badge_google_play: "Google Play",
    badge_download_on: "Download on",
    badge_app_store: "App Store",

    faq_heading: "Frequently Asked Questions",
    faq_q1: "Is SokoMkononi safe?",
    faq_a1: "Yes, SokoMkononi has a verification system for sellers and buyers, plus a secure payment system.",
    faq_q2: "How can I sell my property?",
    faq_a2: "Click the 'Sell' button and fill in your property details. Our team will review and list it.",
    faq_q3: "Are there any fees?",
    faq_a3: "SokoMkononi charges a small fee after a sale is completed. No upfront payments.",
    faq_q4: "How can I contact a seller?",
    faq_a4: "After expressing interest to buy, you can communicate directly in our 'Deal Room'.",

    finalcta_heading: "Start Your Property Journey Today",
    finalcta_subtext: "Join thousands of buyers and sellers on our platform.",

    footer_company_heading: "Company",
    footer_about: "About Us",
    footer_contact: "Contact Us",
    footer_careers: "Careers",
    footer_categories_heading: "Categories",
    footer_support_heading: "Support",
    footer_faq: "FAQ",
    footer_safety: "Safety",
    footer_terms: "Terms of Use",
    footer_privacy: "Privacy Policy",
    footer_tagline: "A trusted platform for buying and selling property in Tanzania.",
    footer_rights: "All rights reserved.",
    footer_payments_label: "Payments accepted:",

    nav_login: "Login",
    nav_post_ad: "Post Ad",
    nav_dashboard: "Dashboard",
    nav_logout: "Logout",
    nav_menu: "Menu",

    comingsoon_eyebrow: "Coming Soon",
    comingsoon_heading: "App Coming Soon",
    comingsoon_body: "We're building a mobile app to make things even easier. Sign up to be the first to know.",
    comingsoon_email_placeholder: "Your email",
    comingsoon_submit: "Sign Up",
    comingsoon_success: "Thank you! We'll let you know when the app launches.",
    comingsoon_android_soon: "Android coming",
    comingsoon_ios_soon: "iOS coming",

    dash_buy_tab: "Buy",
    dash_sell_tab: "Sell",

    dealroom_loading: "Loading...",
    dealroom_not_found: "Deal Room not found",
    dealroom_product_label: "PRODUCT",
    dealroom_seller_label: "SELLER",
    dealroom_buyer_label: "BUYER",
    dealroom_you_suffix: "(You)",
    dealroom_agreed_banner: "Price Agreed: TZS {price}",
    dealroom_create_transaction: "Create Transaction",
    dealroom_creating_transaction: "Creating...",
    dealroom_transaction_pending_note: "Transaction will be confirmed within 48 hours.",
    dealroom_negotiation_heading: "NEGOTIATION",
    dealroom_empty_thread: "No messages yet. Start negotiating!",
    dealroom_agree_button: "Agree to Price",
    dealroom_agreeing: "Agreeing...",
    dealroom_agreed_locked: "Price agreed. Negotiation closed.",
    dealroom_message_placeholder: "Type a message...",
    dealroom_offer_placeholder: "Price (TZS)",
    dealroom_send: "Send",
    dealroom_sending: "Sending...",
    dealroom_send_error: "Failed to send message.",
    dealroom_agree_error: "Failed to agree on price.",
    dealroom_join_waiting: "Join Waiting List",

    seller_label: "Seller",
    buy_now: "Buy Now",
    join_waiting_list: "Join Waiting List",
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("sw");

  const t = (key, params = {}) => {
    let text = translations[lang]?.[key] || translations.sw[key] || key;
    Object.keys(params).forEach((k) => {
      text = text.replace(`{${k}}`, params[k]);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
