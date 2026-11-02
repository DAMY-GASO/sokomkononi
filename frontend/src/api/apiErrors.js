// ============================================================
// src/api/apiErrors.js
// Geuza makosa ghafi ya API kuwa maelezo yanayoeleweka:
//   { status, code, title, message, steps[], cta }
//
// Backend ikirudisha `code` (mf. SELLER_NOT_VERIFIED) tunaonyesha maelezo
// mahususi. Bila `code`, tunatumia status (401/403/404/400/413/429/5xx).
// ============================================================

// Misimbo inayopendekezwa kwa backend (ongeza kadri unavyoitekeleza).
// Mfano wa DRF: raise PermissionDenied(detail="...", code="SELLER_NOT_VERIFIED")
// au rudisha {"detail": "...", "code": "SELLER_NOT_VERIFIED"}.
const CODE_MESSAGES = {
  SELLER_NOT_VERIFIED: {
    en: {
      title: "Seller verification needed",
      message: "You need an approved Seller verification before you can post listings.",
      steps: [
        "Open My Verification and submit your Seller request with your ID documents.",
        "Wait for admin approval (you will be notified).",
        "Come back and post your listing.",
      ],
    },
    sw: {
      title: "Unahitaji uthibitisho wa Muuzaji",
      message: "Unahitaji kuthibitishwa kama Muuzaji kabla ya kuweka tangazo.",
      steps: [
        "Fungua Uthibitisho Wangu na utume ombi la Muuzaji pamoja na kitambulisho.",
        "Subiri admin akuidhinishe (utapata taarifa).",
        "Rudi uweke tangazo lako.",
      ],
    },
    cta: { to: "/dashboard/verification", en: "Go to My Verification", sw: "Nenda Uthibitisho Wangu" },
  },
  EMAIL_NOT_VERIFIED: {
    en: {
      title: "Please verify your email",
      message: "We sent a confirmation link to your email. Verify it, then try again.",
      steps: ["Open your inbox (check Spam too).", "Click the link in the SokoMkononi email.", "Return here and try again."],
    },
    sw: {
      title: "Thibitisha email yako",
      message: "Tulituma kiungo cha uthibitisho kwenye email yako. Kithibitishe kisha ujaribu tena.",
      steps: ["Fungua inbox yako (angalia na Spam).", "Bonyeza kiungo kwenye email ya SokoMkononi.", "Rudi hapa ujaribu tena."],
    },
  },
  ACCOUNT_SUSPENDED: {
    en: {
      title: "Account restricted",
      message: "Your account is currently restricted, so this action is blocked.",
      steps: ["Contact support@sokomkononi.co.tz with your account email so we can review it."],
    },
    sw: {
      title: "Akaunti imezuiwa",
      message: "Akaunti yako imezuiwa kwa sasa, kwa hiyo kitendo hiki hakiruhusiwi.",
      steps: ["Wasiliana na support@sokomkononi.co.tz ukitumia email ya akaunti yako."],
    },
  },
  LISTING_LIMIT_REACHED: {
    en: {
      title: "Listing limit reached",
      message: "You have reached the maximum number of active listings for your account.",
      steps: ["Remove or finish an existing listing, or buy a bundle to post more."],
    },
    sw: {
      title: "Umefikia kikomo cha matangazo",
      message: "Umefikia idadi ya juu ya matangazo yanayoruhusiwa kwenye akaunti yako.",
      steps: ["Futa au maliza tangazo lililopo, au nunua kifurushi ili uweke zaidi."],
    },
    cta: { to: "/dashboard/bundles", en: "View bundles", sw: "Angalia vifurushi" },
  },
  LISTING_UNAVAILABLE: {
    en: {
      title: "This listing is no longer available",
      message: "The listing was sold, reserved by someone else, or removed, so this conversation can't be reopened.",
      steps: ["Your messages are still saved and readable.", "Browse similar listings to continue your search."],
    },
    sw: {
      title: "Mali hii haipatikani tena",
      message: "Mali hii imeuzwa, imewekwa na mtu mwingine, au imeondolewa, kwa hiyo mazungumzo hayawezi kufufuliwa.",
      steps: ["Ujumbe wenu bado umehifadhiwa na unaweza kuusoma.", "Tazama mali nyingine zinazofanana ili uendelee kutafuta."],
    },
    cta: { to: "/mali-zote", en: "Browse listings", sw: "Tazama mali" },
  },
  REOPEN_LIMIT_REACHED: {
    en: {
      title: "Too many reopen attempts",
      message: "This conversation has been reopened too many times. Please wait before trying again or contact support.",
      steps: ["Try again later.", "Need help? Email support@sokomkononi.co.tz."],
    },
    sw: {
      title: "Majaribio mengi ya kufufua",
      message: "Mazungumzo haya yamefufuliwa mara nyingi mno. Subiri kidogo kisha ujaribu tena, au wasiliana na support.",
      steps: ["Jaribu tena baadaye.", "Unahitaji msaada? Andika support@sokomkononi.co.tz."],
    },
  },
  DEAL_HAS_TRANSACTION: {
    en: {
      title: "This deal can't be reopened directly",
      message: "It already reached the reservation or payment stage, so it needs a quick review first.",
      steps: ["Email support@sokomkononi.co.tz with the deal number and we will help you continue."],
    },
    sw: {
      title: "Deal hii haiwezi kufufuliwa moja kwa moja",
      message: "Ilishafika hatua ya reservation au malipo, kwa hiyo inahitaji kukaguliwa kwanza.",
      steps: ["Tuandikie support@sokomkononi.co.tz ukitaja namba ya deal tutakusaidia kuendelea."],
    },
  },
  ACTIVE_DEAL_EXISTS: {
    en: {
      title: "You already have an active conversation",
      message: "There is already an open Deal Room for this listing.",
      steps: ["Open your Deal Rooms and continue from the active one."],
    },
    sw: {
      title: "Tayari una mazungumzo hai",
      message: "Kuna Deal Room iliyo wazi kwa tangazo hili.",
      steps: ["Fungua Deal Rooms zako uendelee na iliyo hai."],
    },
    cta: { to: "/dashboard/buyer/deals", en: "Open Deal Rooms", sw: "Fungua Deal Rooms" },
  },
  DEAL_NOT_REOPENABLE: {
    en: {
      title: "This deal can't be reopened",
      message: "Completed deals and deals under dispute review can't be reopened.",
      steps: ["If you need to continue with this seller, start a new conversation from the listing page."],
    },
    sw: {
      title: "Deal hii haiwezi kufufuliwa",
      message: "Deal zilizokamilika au zilizo kwenye ukaguzi wa mgogoro haziwezi kufufuliwa.",
      steps: ["Ukihitaji kuendelea na muuzaji huyu, anzisha mazungumzo mapya kutoka kwenye ukurasa wa mali."],
    },
  },
  NOT_DEAL_PARTICIPANT: {
    en: {
      title: "You're not part of this conversation",
      message: "Only the buyer and seller in this Deal Room can perform this action.",
      steps: [
        "If you're the buyer or seller, open your Deal Rooms and try again.",
        "If you think this is a mistake, email support@sokomkononi.co.tz with the deal number.",
      ],
    },
    sw: {
      title: "Wewe si sehemu ya mazungumzo haya",
      message: "Ni mnunuzi na muuzaji wa Deal Room hii pekee wanaoweza kufanya kitendo hiki.",
      steps: [
        "Kama wewe ni mnunuzi au muuzaji, fungua Deal Rooms zako kisha ujaribu tena.",
        "Ukiona ni kosa, tuandikie support@sokomkononi.co.tz ukitaja namba ya deal.",
      ],
    },
  },
};

// Maandishi ya kawaida ya DRF/Django ya 403 — hayasaidii mtumiaji, hatuyaonyeshi ghafi.
const GENERIC_PERMISSION = /permission to perform|not have permission|huna ruhusa|ruhusa ya kufanya/i;

const ACTION_403 = {
  post_listing: {
    en: {
      title: "You can't post a listing yet",
      message: "Your account isn't allowed to post listings right now.",
      steps: [
        "Open My Verification and check your Seller request: pending, approved, or rejected.",
        "If it was rejected or more documents were requested, follow the message and submit again.",
        "Still stuck? Email support@sokomkononi.co.tz from your account email and we will help.",
      ],
    },
    sw: {
      title: "Huwezi kuweka tangazo kwa sasa",
      message: "Akaunti yako haijaruhusiwa kuweka matangazo kwa sasa.",
      steps: [
        "Fungua Uthibitisho Wangu uone hali ya ombi lako la Muuzaji: linasubiri, limeidhinishwa, au limekataliwa.",
        "Kama limekataliwa au umeombwa nyaraka zaidi, fuata ujumbe kisha utume tena.",
        "Bado umekwama? Tuandikie support@sokomkononi.co.tz ukitumia email ya akaunti yako.",
      ],
    },
    cta: { to: "/dashboard/verification", en: "Go to My Verification", sw: "Nenda Uthibitisho Wangu" },
  },
};

const GENERIC_403 = {
  en: {
    title: "Action not allowed",
    message: "Your account can't do this right now.",
    steps: [
      "Check My Verification in your dashboard for anything pending.",
      "If you think this is a mistake, email support@sokomkononi.co.tz with what you were trying to do.",
    ],
  },
  sw: {
    title: "Kitendo hakiruhusiwi",
    message: "Akaunti yako haiwezi kufanya hiki kwa sasa.",
    steps: [
      "Angalia Uthibitisho Wangu kwenye dashibodi kama kuna kitu kinasubiri.",
      "Ukiona ni kosa, tuandikie support@sokomkononi.co.tz ukieleza ulichokuwa unajaribu kufanya.",
    ],
  },
};

function pick(obj, lang) {
  return obj?.[lang === "en" ? "en" : "sw"] || obj?.en;
}

function firstString(v) {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    for (const x of v) {
      const s = firstString(x);
      if (s) return s;
    }
    return null;
  }
  if (typeof v === "object") {
    for (const x of Object.values(v)) {
      const s = firstString(x);
      if (s) return s;
    }
  }
  return null;
}

function fieldProblems(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const out = [];
  for (const [k, v] of Object.entries(data)) {
    if (["detail", "code", "message", "error", "error_code"].includes(k)) continue;
    const s = firstString(v);
    if (s) out.push(`${k.replace(/_/g, " ")}: ${s}`);
  }
  return out.slice(0, 4);
}

/**
 * @param {any} err  - ApiError / Error kutoka api client
 * @param {{lang?: "sw"|"en", action?: string, fallback?: string}} opts
 */
export function explainApiError(err, { lang = "sw", action = "generic", fallback } = {}) {
  const L = lang === "en" ? "en" : "sw";
  const status = err?.status ?? err?.response?.status ?? null;
  const data = err?.data ?? err?.response?.data ?? null;
  const code = data?.code || data?.error_code || data?.error?.code || null;
  const detail =
    (typeof data === "string" ? data : null) ||
    (typeof data?.detail === "string" ? data.detail : null) ||
    (typeof data?.message === "string" ? data.message : null);

  const build = (src, extra = {}) => {
    const c = pick(src, L) || {};
    return {
      status,
      code,
      title: c.title || "",
      message: c.message || fallback || "",
      steps: c.steps || [],
      cta: src.cta ? { to: src.cta.to, label: src.cta[L] } : null,
      ...extra,
    };
  };

  // 1) Msimbo mahususi kutoka backend
  if (code && CODE_MESSAGES[code]) return build(CODE_MESSAGES[code]);

  // 2) Mtandao / seva haifikiki
  const msg = String(err?.message || "");
  if (status == null || status === 0 || /failed to fetch|network|timeout/i.test(msg)) {
    if (status == null || status === 0) {
      return {
        status: 0, code: null, steps: [], cta: null,
        title: L === "en" ? "Can't reach the server" : "Seva haifikiki",
        message: L === "en"
          ? "Check your internet connection and try again. Your information has not been lost."
          : "Angalia mtandao wako kisha ujaribu tena. Taarifa zako hazijapotea.",
      };
    }
  }

  // 3) Kwa status
  if (status === 401) {
    return {
      status, code, steps: [],
      title: L === "en" ? "Please log in again" : "Ingia tena",
      message: L === "en" ? "Your session has expired." : "Muda wa kikao chako umeisha.",
      cta: { to: "/login", label: L === "en" ? "Log in" : "Ingia" },
    };
  }
  if (status === 403) {
    // Maelezo maalum ya backend yanaonyeshwa kama si ya kawaida
    if (detail && !GENERIC_PERMISSION.test(detail)) {
      return { status, code, title: "", message: detail, steps: [], cta: null };
    }
    return build(ACTION_403[action] || GENERIC_403);
  }
  if (status === 404) {
    return {
      status, code, steps: [], cta: null,
      title: L === "en" ? "Not found" : "Haipatikani",
      message: detail || (L === "en" ? "We couldn't find that. It may have been removed." : "Hatukuweza kuipata. Huenda imeondolewa."),
    };
  }
  if (status === 413) {
    return {
      status, code, cta: null, steps: [],
      title: L === "en" ? "File too large" : "Faili ni kubwa mno",
      message: L === "en" ? "Use smaller photos and try again." : "Tumia picha ndogo zaidi kisha ujaribu tena.",
    };
  }
  if (status === 429) {
    return {
      status, code, cta: null, steps: [],
      title: L === "en" ? "Too many attempts" : "Majaribio mengi mno",
      message: L === "en" ? "Please wait a minute and try again." : "Subiri dakika moja kisha ujaribu tena.",
    };
  }
  if (status === 400 || status === 422) {
    const problems = fieldProblems(data);
    return {
      status, code, cta: null,
      title: L === "en" ? "Please check your details" : "Tafadhali hakiki taarifa zako",
      message: detail || firstString(data?.non_field_errors) || (problems.length ? "" : fallback || ""),
      steps: problems,
    };
  }
  if (status >= 500) {
    return {
      status, code, cta: null, steps: [],
      title: L === "en" ? "Something went wrong on our side" : "Kuna hitilafu upande wetu",
      message: L === "en"
        ? "This is not your fault. Please try again in a few minutes."
        : "Si kosa lako. Tafadhali jaribu tena baada ya dakika chache.",
    };
  }

  // 4) Chaguo-msingi
  return {
    status, code, title: "", steps: [], cta: null,
    message: detail || fallback || (L === "en" ? "Something went wrong. Please try again." : "Kuna tatizo. Tafadhali jaribu tena."),
  };
}