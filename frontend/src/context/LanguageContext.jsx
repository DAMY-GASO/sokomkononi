import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  sw: {
    // Navbar
    nav_login: "Ingia",
    nav_login_register: "Ingia/Jisajili",
    nav_home: "Nyumbani",
    nav_saved: "Zilizohifadhiwa",
    nav_sell: "Uza",
    nav_messages: "Ujumbe",
    nav_profile: "Wasifu",
    nav_search_placeholder: "Tafuta mali...",
    nav_search_cancel: "Ghairi",
    lang_prompt: "Je, unapendelea lugha gani?",

    // Hero
    hero_headline: "Nunua na Uza Mali kwa Urahisi",
    hero_subtext: "SokoMkononi ni jukwaa salama la kununua na kuuza nyumba, magari, viwanja na mali nyingine.",
    cta_buy: "Nunua Sasa",
    cta_sell: "Uza sas",
    hero_app_teaser: "⬇ Pakua App yetu",

    // Trending Properties
    trending_heading: "Mali Zinazotrendi",
    trending_view_all: "Tazama Zote →",

    // Categories
    categories_heading: "Kategoria Maarufu",
    categories_view_all: "Tazama Yote →",
    cat_nyumba: "Nyumba",
    cat_viwanja: "Viwanja",
    cat_magari: "Magari",
    cat_biashara: "Biashara",
    cat_mashine: "Mashine",
    cat_pikipiki: "Pikipiki",
    cat_mabasi: "Mabasi",
    cat_samani: "Samani",
    cat_electronics: "Vifaa vya Elektroniki",
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

// deal room
deal_room: "Deal Room",
deal_rooms: "Deal Rooms",
deal_active: "Inaendelea",
deal_negotiating: "Inajadiliwa",
deal_inspecting: "Inakaguliwa",
deal_completed: "Imekamilika",
deal_cancelled: "Imefutwa",
deal_negotiation: "Negotiation",
deal_inspection: "Inspection",
deal_messages: "Ujumbe",
deal_offer_price: "Ofa yako",
deal_seller_price: "Bei ya Muuzaji",
deal_counter_offer: "Counter Offer",
deal_accept: "Kubali",
deal_reject: "Kataa",
deal_send: "Tuma",
deal_no_deals: "Hakuna deal rooms",
deal_select_deal: "Chagua Deal Room",
deal_no_messages: "Hakuna ujumbe",


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

    // ============================================================
    // AUTH - REGISTER
    // ============================================================
    // Left Panel (Brand)
    register_panel_heading_buy: "Nunua Mali kwa Urahisi",
    register_panel_heading_sell: "Uza Mali kwa Urahisi",
    register_panel_heading_default: "SokoMkononi",
    register_panel_subtext_buy: "Jisajili na uanze kununua mali yako inayotakiwa leo.",
    register_panel_subtext_sell: "Jisajili na uanze kuuza mali yako kwa wateja wengi.",
    register_panel_subtext_default: "Jisajili sasa na upate fursa za kibiashara.",

    // Right Panel (Form)
    register_form_heading_buy: "Anza Kununua",
    register_form_heading_sell: "Anza Kuuza",
    register_form_heading_default: "Jiunge Nasi",
    register_form_subtext_buy: "Jaza taarifa zako ili uanze safari ya kununua mali.",
    register_form_subtext_sell: "Jaza taarifa zako ili uanze kuuza mali yako.",
    register_form_subtext_default: "Und akaunti yako kwa sekunde chache.",

    // Register Fields
    register_name_placeholder: "Jina lako kamili",
    register_email_placeholder: "Barua pepe",
    register_phone_placeholder: "Namba ya simu",
    register_password_placeholder: "Nenosiri",
    register_confirm_password_placeholder: "Thibitisha nenosiri",
    register_continue: "Endelea",
    register_sending_otp: "Inatuma msimbo...",
    register_error_default: "Hitilafu imetokea. Tafadhali jaribu tena.",
    register_error_name_required: "Tafadhali jaza jina lako.",
    register_error_email_required: "Tafadhali jaza barua pepe yako.",
    register_error_phone_required: "Tafadhali jaza namba yako ya simu.",
    register_error_password_short: "Nenosiri lazima liwe na herufi 6 au zaidi.",
    register_error_password_mismatch: "Nenosiri hazifanani. Tafadhali kagua tena.",
    register_error_terms_required: "Tafadhali kubali Vigezo vya Matumizi na Sera ya Faragha ili kuendelea.",
    register_have_account: "Una akaunti tayari?",
    register_login_link: "Ingia",

    // Register OTP
    register_otp_heading: "Thibitisha Barua Pepe",
    register_otp_subtext: "Tumetuma msimbo wa tarakimu kwenye:",
    register_verifying: "Inathibitisha...",
    register_verify_submit: "Thibitisha na Ujisajili",
    register_resend_otp: "Tuma tena msimbo",
    register_change_email: "Badilisha barua pepe",
    register_error_otp_required: "Tafadhali weka msimbo uliotumwa kwenye barua pepe yako.",
    register_error_otp_invalid: "Msimbo si sahihi au umeisha muda wake. Jaribu tena.",

    // ============================================================
    // AUTH - LOGIN
    // ============================================================
    // Left Panel (Brand)
    login_panel_heading: "Karibu SokoMkononi",
    login_panel_subtext: "Jukwaa lako salama la kununua na kuuza mali nchini Tanzania.",
    login_trust1: "Muamala salama na wa uwazi",
    login_trust2: "Wauzaji na wanunuzi walioidhinishwa",
    login_trust3: "Msaada wa haraka na wa kuaminika",

    // Right Panel (Form)
    login_heading: "Ingia kwenye Akaunti Yako",
    login_subtext: "Ingiza barua pepe na nenosiri lako ili uingie.",
    login_identifier_placeholder: "Barua pepe au namba ya simu",
    login_password_placeholder: "Nenosiri",
    login_forgot_password: "Umesahau nenosiri?",
    login_submitting: "Inaingia...",
    login_submit: "Ingia",
    login_error_required: "Tafadhali jaza sehemu zote.",
    login_error_default: "Barua pepe/namba au nenosiri si sahihi.",
    login_no_account: "Huna akaunti?",
    login_register_link: "Jisajili",

    // ============================================================
    // AUTH - FORGOT PASSWORD
    // ============================================================
    forgot_panel_heading: "Weka Nenosiri Jipya",
    forgot_panel_subtext: "Tunakusaidia kurejesha akaunti yako kwa haraka na kwa usalama.",
    forgot_heading: "Umesahau Nenosiri?",
    forgot_subtext: "Weka barua pepe yako na nenosiri jipya unalotaka kutumia.",
    forgot_email_placeholder: "Barua pepe",
    forgot_new_password_placeholder: "Nenosiri jipya",
    forgot_confirm_password_placeholder: "Thibitisha nenosiri jipya",
    forgot_error_email_required: "Tafadhali jaza barua pepe yako.",
    forgot_error_password_short: "Nenosiri lazima liwe na herufi 6 au zaidi.",
    forgot_error_password_mismatch: "Nenosiri hazifanani. Tafadhali kagua tena.",
    forgot_error_default: "Hitilafu imetokea. Tafadhali jaribu tena.",
    forgot_sending_otp: "Inatuma msimbo...",
    forgot_continue: "Endelea",
    forgot_back_to_login: "← Rudi kwenye Ingia",
    forgot_otp_heading: "Thibitisha Barua Pepe",
    forgot_otp_subtext: "Tumetuma msimbo wa tarakimu kuthibitisha nenosiri jipya kwenye:",
    forgot_verifying: "Inathibitisha...",
    forgot_verify_submit: "Thibitisha Nenosiri Jipya",
    forgot_resend_otp: "Tuma tena msimbo",
    forgot_change_email: "Badilisha barua pepe",
    forgot_error_otp_required: "Tafadhali weka msimbo uliotumwa kwenye barua pepe yako.",
    forgot_error_otp_invalid: "Msimbo si sahihi au umeisha muda wake. Jaribu tena.",
    forgot_success_heading: "Nenosiri Limebadilishwa!",
    forgot_success_subtext: "Nenosiri lako jipya limehifadhiwa kwa mafanikio. Sasa unaweza kuingia kwenye akaunti yako kwa nenosiri hilo jipya.",
    forgot_go_to_login: "Ingia Sasa",

    // ============================================================
    // WAITLIST (APP YA SIMU) - ILIYOSASISHWA KABISA
    // ============================================================
    // Left Panel (Brand)
    waitlist_panel_heading: "App Inakuja Hivi Karibuni",
    waitlist_panel_subtext: "Jiunge na waitlist yetu ili uwe wa kwanza kujua app ya SokoMkononi itakapopatikana.",

    // Right Panel (Form)
    waitlist_form_heading: "Jiunge na Waitlist",
    waitlist_form_subtext: "Weka barua pepe yako ili upate taarifa za app.",
    waitlist_email_placeholder: "Barua pepe yako",
    waitlist_submit: "Jiunge",
    waitlist_submitting: "Inajiunga...",
    waitlist_error_email: "Tafadhali weka barua pepe sahihi.",
    waitlist_error_default: "Hitilafu imetokea. Tafadhali jaribu tena.",
    waitlist_success_heading: "Umejiunga!",
    waitlist_success_subtext: "Tutakutumia ujumbe pindi app itakapokuwa tayari kupakuliwa.",
    waitlist_back_home: "← Rudi Nyumbani",

    // Auth - Legal footnote (Register/Login)
    auth_legal_prefix: "Kwa kuendelea, unakubaliana na",
    auth_legal_and: "na",

    // About Page
    about_heading: "Kuhusu SokoMkononi",
    about_subtext: "Tunaunganisha wanunuzi na wauzaji wa mali kote Tanzania kwa urahisi na uwazi.",
    about_mission: "SokoMkononi ilianzishwa kwa lengo moja: kufanya ununuzi na uuzaji wa mali — nyumba, magari, viwanja na zaidi — kuwa rahisi, salama na wa kuaminika kwa kila Mtanzania, popote alipo.",
    about_value1_title: "Uwazi",
    about_value1_body: "Taarifa zote za mali na bei zinaonyeshwa wazi bila kuficha gharama za ziada.",
    about_value2_title: "Usalama",
    about_value2_body: "Kila muuzaji na mnunuzi anathibitishwa kabla ya kuruhusiwa kufanya muamala.",
    about_value3_title: "Ubunifu",
    about_value3_body: "Tunatumia teknolojia kurahisisha mchakato mzima wa kununua na kuuza mali.",

    // admin login
admin_panel_heading: "Dhibiti SokoMkononi",
admin_panel_subtext: "Ingia kwenye paneli ya msimamizi ili kudhibiti mali, wateja na matangazo.",
admin_feature1: "Dhibiti mali zote",
admin_feature2: "Simamia wateja na wauzaji",
admin_feature3: "Thibitisha matangazo",
admin_feature4: "Angalia taarifa za mauzo",
admin_login_heading: "Ingia kama Msimamizi",
admin_login_subtext: "Ingiza barua pepe na nenosiri lako la msimamizi.",
admin_login_email: "Barua pepe",
admin_login_password: "Nenosiri",
admin_login_submit: "Ingia kama Msimamizi",
admin_login_submitting: "Inaingia...",
admin_login_error_required: "Tafadhali jaza sehemu zote.",
admin_login_error_default: "Barua pepe au nenosiri si sahihi.",
admin_secure_access: "Mwamini Msimamizi tu ndiye anayepata mamlaka ya kuingia.",
admin_back_to_user_login: "← Rudi kwenye Ingia la Mtumiaji",

    
    // Safety Page
    safety_heading: "Usalama Wako ni Kipaumbele Chetu",
    safety_subtext: "Vidokezo na hatua tunazochukua kuhakikisha muamala wako ni salama.",
    safety_tip1_title: "Thibitisha Akaunti Kabla ya Kuendelea",
    safety_tip1_body: "Kila mtumiaji anapitia uthibitishaji wa OTP kabla ya kuruhusiwa kuchapisha au kuwasiliana.",
    safety_tip2_title: "Kutana Sehemu za Wazi",
    safety_tip2_body: "Panga mikutano ya kuangalia mali sehemu za wazi na wakati wa mchana.",
    safety_tip3_title: "Usilipe Kabla ya Kuona Mali",
    safety_tip3_body: "Kamwe usitume malipo kabla ya kuthibitisha mali na hati zake halisi.",
    safety_tip4_title: "Tumia 'Deal Room' Yetu",
    safety_tip4_body: "Wasiliana na muuzaji ndani ya jukwaa letu ili mazungumzo yote yawe na kumbukumbu.",
    safety_report_note: "Ukiona tangazo la udanganyifu au tabia ya kutiliwa shaka, ripoti mara moja kupitia ukurasa wa Mawasiliano ili timu yetu ichukue hatua.",

    // Contact Page
    contact_heading: "Wasiliana Nasi",
    contact_subtext: "Una swali au changamoto? Timu yetu iko tayari kukusaidia.",
    contact_email_label: "Barua Pepe",
    contact_phone_label: "Simu",
    contact_office_label: "Ofisi",
    contact_name_placeholder: "Jina lako",
    contact_email_placeholder: "Barua pepe yako",
    contact_message_placeholder: "Andika ujumbe wako...",
    contact_submit: "Tuma Ujumbe",
    contact_success_heading: "Ujumbe Umetumwa!",
    contact_success_subtext: "Asante kwa kuwasiliana nasi. Tutakujibu haraka iwezekanavyo.",
  },
  en: {
    // Navbar
    nav_login: "Login",
    nav_login_register: "Login/Register",
    nav_post_ad: "Post Ad",
    nav_home: "Home",
    nav_saved: "Saved",
    nav_sell: "Sell",
    nav_messages: "Messages",
    nav_profile: "Profile",
    nav_search_placeholder: "Search properties...",
    nav_search_cancel: "Cancel",
    lang_prompt: "Which language do you prefer?",

    // Hero
    hero_eyebrow: "Digital Property Marketplace",
    hero_headline: "Buy and Sell Property Easily",
    hero_subtext: "SokoMkononi is a safe platform to buy and sell houses, cars, land and other properties.",
    cta_buy: "Buy Now",
    cta_sell: "Sell Item",
    hero_app_teaser: "⬇ Download Our App",

    // Trending Properties
    trending_heading: "Trending Properties",
    trending_view_all: "View All →",

    // Categories
    categories_heading: "Popular Categories",
    categories_view_all: "View All →",
    cat_nyumba: "Houses",
    cat_viwanja: "Land",
    cat_magari: "Cars",
    cat_biashara: "Business",
    cat_mashine: "Machinery",
    cat_pikipiki: "Motorcycles",
    cat_mabasi: "Buses",
    cat_samani: "Furniture",
    cat_electronics: "Electronics",
    cat_count_suffix: "+",

    // Stats
    stats_sellers: "Sellers",
    stats_properties: "Properties",
    stats_deals: "Deals",

    // Why Section
    why_heading: "Why SokoMkononi?",
    why_subtext: "We've built a platform that gives buyers and sellers confidence and convenience.",
    why_point1_title: "Safe & Trusted",
    why_point1_body: "Every transaction is verified by our team to ensure safety for all parties.",
    why_point2_title: "Easy Access",
    why_point2_body: "Use our app to find any property anywhere in Tanzania.",
    why_point3_title: "Competitive Prices",
    why_point3_body: "Get great prices and negotiate directly with sellers.",


    // deal room
deal_room: "Deal Room",
deal_rooms: "Deal Rooms",
deal_active: "Active",
deal_negotiating: "Negotiating",
deal_inspecting: "Inspection",
deal_completed: "Completed",
deal_cancelled: "Cancelled",
deal_negotiation: "Negotiation",
deal_inspection: "Inspection",
deal_messages: "Messages",
deal_offer_price: "Your Offer",
deal_seller_price: "Seller's Price",
deal_counter_offer: "Counter Offer",
deal_accept: "Accept",
deal_reject: "Reject",
deal_send: "Send",
deal_no_deals: "No deal rooms",
deal_select_deal: "Select a Deal Room",
deal_no_messages: "No messages",
    
    // Testimonials
    testimonials_heading: "What Our Customers Say",
    testimonial1_quote: "I bought my house easily through SokoMkononi. The whole process was simple and secure.",
    testimonial1_name: "— Mary, Dar es Salaam",
    testimonial2_quote: "I've sold three cars in just one month! This platform has transformed my business.",
    testimonial2_name: "— Juma, Arusha",
    testimonial3_quote: "I found a great plot at a good price. Thank you SokoMkononi for your transparency.",
    testimonial3_name: "— Fatima, Mwanza",

    // App Download
    appsec_eyebrow: "Download Our App",
    appsec_heading: "Enjoy SokoMkononi Anywhere",
    appsec_body: "Download our app and buy or sell any property easily on your phone.",
    badge_get_it_on: "Get it on",
    badge_google_play: "Google Play",
    badge_download_on: "Download on",
    badge_app_store: "App Store",

// admin login
admin_panel_heading: "Manage SokoMkononi",
admin_panel_subtext: "Login to the admin panel to manage properties, customers and ads.",
admin_feature1: "Manage all properties",
admin_feature2: "Manage customers and sellers",
admin_feature3: "Verify listings",
admin_feature4: "View sales reports",
admin_login_heading: "Admin Login",
admin_login_subtext: "Enter your admin email and password.",
admin_login_email: "Email",
admin_login_password: "Password",
admin_login_submit: "Login as Admin",
admin_login_submitting: "Logging in...",
admin_login_error_required: "Please fill in all fields.",
admin_login_error_default: "Incorrect email or password.",
admin_secure_access: "Only authorized admins can access this panel.",
admin_back_to_user_login: "← Back to User Login",
    
    // FAQ
    faq_heading: "Frequently Asked Questions",
    faq_q1: "Is SokoMkononi safe?",
    faq_a1: "Yes, SokoMkononi has a verification system for sellers and buyers, plus a secure payment system.",
    faq_q2: "How can I sell my property?",
    faq_a2: "Click the 'Sell' button and fill in your property details. Our team will review and list it.",
    faq_q3: "Are there any fees?",
    faq_a3: "SokoMkononi charges a small fee after a sale is completed. No upfront payments.",
    faq_q4: "How can I contact a seller?",
    faq_a4: "After expressing interest to buy, you can communicate directly in our 'Deal Room'.",

    // Final CTA
    finalcta_heading: "Start Your Property Journey Today",
    finalcta_subtext: "Join thousands of buyers and sellers on our platform.",

    // Footer
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

    // ============================================================
    // AUTH - REGISTER
    // ============================================================
    // Left Panel (Brand)
    register_panel_heading_buy: "Buy Property Easily",
    register_panel_heading_sell: "Sell Property Easily",
    register_panel_heading_default: "SokoMkononi",
    register_panel_subtext_buy: "Sign up and start buying your desired property today.",
    register_panel_subtext_sell: "Sign up and start selling your property to many customers.",
    register_panel_subtext_default: "Sign up now and get business opportunities.",

    // Right Panel (Form)
    register_form_heading_buy: "Start Buying",
    register_form_heading_sell: "Start Selling",
    register_form_heading_default: "Join Us",
    register_form_subtext_buy: "Fill in your details to start your property buying journey.",
    register_form_subtext_sell: "Fill in your details to start selling your property.",
    register_form_subtext_default: "Create your account in a few seconds.",

    // Register Fields
    register_name_placeholder: "Full name",
    register_email_placeholder: "Email address",
    register_phone_placeholder: "Phone number",
    register_password_placeholder: "Password",
    register_confirm_password_placeholder: "Confirm password",
    register_continue: "Continue",
    register_sending_otp: "Sending code...",
    register_error_default: "Something went wrong. Please try again.",
    register_error_name_required: "Please enter your name.",
    register_error_email_required: "Please enter your email.",
    register_error_phone_required: "Please enter your phone number.",
    register_error_password_short: "Password must be at least 6 characters.",
    register_error_password_mismatch: "Passwords don't match. Please check again.",
    register_error_terms_required: "Please agree to the Terms of Use and Privacy Policy to continue.",
    register_have_account: "Already have an account?",
    register_login_link: "Login",

    // Register OTP
    register_otp_heading: "Verify Your Email",
    register_otp_subtext: "We've sent a verification code to:",
    register_verifying: "Verifying...",
    register_verify_submit: "Verify & Create Account",
    register_resend_otp: "Resend code",
    register_change_email: "Change email",
    register_error_otp_required: "Please enter the code sent to your email.",
    register_error_otp_invalid: "Invalid or expired code. Please try again.",

    // ============================================================
    // AUTH - LOGIN
    // ============================================================
    // Left Panel (Brand)
    login_panel_heading: "Welcome to SokoMkononi",
    login_panel_subtext: "Your safe platform to buy and sell property in Tanzania.",
    login_trust1: "Safe and transparent transactions",
    login_trust2: "Verified sellers and buyers",
    login_trust3: "Fast and reliable support",

    // Right Panel (Form)
    login_heading: "Login to Your Account",
    login_subtext: "Enter your email and password to sign in.",
    login_identifier_placeholder: "Email or phone number",
    login_password_placeholder: "Password",
    login_forgot_password: "Forgot password?",
    login_submitting: "Logging in...",
    login_submit: "Login",
    login_error_required: "Please fill in all fields.",
    login_error_default: "Incorrect email/phone or password.",
    login_no_account: "Don't have an account?",
    login_register_link: "Register",

    // ============================================================
    // AUTH - FORGOT PASSWORD
    // ============================================================
    forgot_panel_heading: "Set a New Password",
    forgot_panel_subtext: "We'll help you get back into your account quickly and safely.",
    forgot_heading: "Forgot Password?",
    forgot_subtext: "Enter your email and the new password you'd like to use.",
    forgot_email_placeholder: "Email address",
    forgot_new_password_placeholder: "New password",
    forgot_confirm_password_placeholder: "Confirm new password",
    forgot_error_email_required: "Please enter your email.",
    forgot_error_password_short: "Password must be at least 6 characters.",
    forgot_error_password_mismatch: "Passwords don't match. Please check again.",
    forgot_error_default: "Something went wrong. Please try again.",
    forgot_sending_otp: "Sending code...",
    forgot_continue: "Continue",
    forgot_back_to_login: "← Back to Login",
    forgot_otp_heading: "Verify Your Email",
    forgot_otp_subtext: "We've sent a verification code to confirm your new password to:",
    forgot_verifying: "Verifying...",
    forgot_verify_submit: "Confirm New Password",
    forgot_resend_otp: "Resend code",
    forgot_change_email: "Change email",
    forgot_error_otp_required: "Please enter the code sent to your email.",
    forgot_error_otp_invalid: "Invalid or expired code. Please try again.",
    forgot_success_heading: "Password Changed!",
    forgot_success_subtext: "Your new password has been saved successfully. You can now log in to your account using your new password.",
    forgot_go_to_login: "Login Now",

    // ============================================================
    // WAITLIST (MOBILE APP) - FULLY UPDATED
    // ============================================================
    // Left Panel (Brand)
    waitlist_panel_heading: "The App Is Coming Soon",
    waitlist_panel_subtext: "Join our waitlist to be the first to know when the SokoMkononi app is available.",

    // Right Panel (Form)
    waitlist_form_heading: "Join the Waitlist",
    waitlist_form_subtext: "Enter your email to get notified about the app.",
    waitlist_email_placeholder: "Your email",
    waitlist_submit: "Join",
    waitlist_submitting: "Joining...",
    waitlist_error_email: "Please enter a valid email.",
    waitlist_error_default: "Something went wrong. Please try again.",
    waitlist_success_heading: "You're In!",
    waitlist_success_subtext: "We'll notify you as soon as the app is ready to download.",
    waitlist_back_home: "← Back to Home",

    // Auth - Legal footnote (Register/Login)
    auth_legal_prefix: "By continuing, you agree to our",
    auth_legal_and: "and",

    // About Page
    about_heading: "About SokoMkononi",
    about_subtext: "We connect property buyers and sellers across Tanzania with ease and transparency.",
    about_mission: "SokoMkononi was founded with one goal: to make buying and selling property — houses, cars, land and more — simple, safe, and trustworthy for every Tanzanian, wherever they are.",
    about_value1_title: "Transparency",
    about_value1_body: "All property details and prices are shown clearly with no hidden extra costs.",
    about_value2_title: "Safety",
    about_value2_body: "Every seller and buyer is verified before being allowed to complete a transaction.",
    about_value3_title: "Innovation",
    about_value3_body: "We use technology to simplify the entire process of buying and selling property.",

    // Safety Page
    safety_heading: "Your Safety Is Our Priority",
    safety_subtext: "Tips and measures we take to make sure your transaction is secure.",
    safety_tip1_title: "Verify Your Account First",
    safety_tip1_body: "Every user goes through OTP verification before they can post or contact others.",
    safety_tip2_title: "Meet in Open Places",
    safety_tip2_body: "Schedule property viewings in public places and during daylight hours.",
    safety_tip3_title: "Never Pay Before Viewing",
    safety_tip3_body: "Never send payment before verifying the property and its official documents.",
    safety_tip4_title: "Use Our 'Deal Room'",
    safety_tip4_body: "Communicate with sellers inside our platform so every conversation is recorded.",
    safety_report_note: "If you see a fraudulent listing or suspicious behavior, report it immediately via our Contact page so our team can take action.",

    // Contact Page
    contact_heading: "Contact Us",
    contact_subtext: "Have a question or an issue? Our team is here to help.",
    contact_email_label: "Email",
    contact_phone_label: "Phone",
    contact_office_label: "Office",
    contact_name_placeholder: "Your name",
    contact_email_placeholder: "Your email",
    contact_message_placeholder: "Write your message...",
    contact_submit: "Send Message",
    contact_success_heading: "Message Sent!",
    contact_success_subtext: "Thanks for reaching out. We'll get back to you as soon as possible.",
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem("preferred_language");
    return saved || "sw";
  });

  const t = (key, params = {}) => {
    let text = translations[lang]?.[key] || translations.sw[key] || key;
    Object.keys(params).forEach((k) => {
      text = text.replace(`{${k}}`, params[k]);
    });
    return text;
  };

  useEffect(() => {
    localStorage.setItem("preferred_language", lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
