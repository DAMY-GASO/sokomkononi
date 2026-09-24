// ============================================================
// socialAuth.js  (weka kwenye src/config/)
// Google + Apple sign-in upande wa browser. Inapata ID token tu;
// kuthibitisha token na kutoa JWT ya SokoMkononi ni kazi ya backend
// (authStore.socialLoginAsync -> POST /api/auth/social/).
//
// .env (Vite):
//   VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
//   VITE_APPLE_CLIENT_ID=com.sokomkononi.web        (Services ID)
//   VITE_APPLE_REDIRECT_URI=https://sokomkononi.com/auth/apple/callback
//
// Provider ambaye env yake haipo hafichwi kwenye UI (button haionekani).
// ============================================================

// LoginPage inaiagiza kutoka hapa; ipo kwenye authStore.js
// (tazama socialLogin_patch.js).
export { socialLoginAsync } from "./authStore.js";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || "";
const APPLE_REDIRECT_URI =
  import.meta.env.VITE_APPLE_REDIRECT_URI ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const isGoogleEnabled = Boolean(GOOGLE_CLIENT_ID);
export const isAppleEnabled = Boolean(APPLE_CLIENT_ID);

// ── Script loader (mara moja kwa URL) ───────────────────────
const scriptCache = {};
function loadScript(src) {
  if (scriptCache[src]) return scriptCache[src];
  scriptCache[src] = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      delete scriptCache[src];
      reject(new Error("Imeshindwa kupakia huduma ya kuingia. Angalia mtandao."));
    };
    document.head.appendChild(s);
  });
  return scriptCache[src];
}

// ── Google ──────────────────────────────────────────────────
let googleInited = false;
let googleHandler = null; // inasasishwa kila render, ili closure isiwe stale

/**
 * Inachora button rasmi ya Google ndani ya `el`.
 * onCredential(idToken) inaitwa mtumiaji akikubali.
 */
export async function renderGoogleButton(el, { onCredential, onError, locale = "en" }) {
  if (!isGoogleEnabled || !el) return;
  await loadScript("https://accounts.google.com/gsi/client");

  googleHandler = { onCredential, onError };

  if (!googleInited) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => {
        if (resp?.credential) googleHandler?.onCredential?.(resp.credential);
        else googleHandler?.onError?.(new Error("Google haikurudisha token."));
      },
    });
    googleInited = true;
  }

  const width = Math.min(400, Math.max(200, Math.round(el.offsetWidth || 320)));
  el.innerHTML = "";
  window.google.accounts.id.renderButton(el, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    logo_alignment: "left",
    width,
    locale,
  });
}

// ── Apple ───────────────────────────────────────────────────
let appleInited = false;

/**
 * Inafungua popup ya Apple. Inarudisha { idToken, code, user }.
 * `user` (jina/barua) Apple inaitoa mara ya KWANZA tu mtumiaji anapokubali.
 * Mtumiaji akifunga popup, inatupa object yenye `error` ("popup_closed_by_user").
 */
export async function getAppleIdentity() {
  if (!isAppleEnabled) throw new Error("Apple sign-in haijawekwa.");
  await loadScript(
    "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
  );

  if (!appleInited) {
    window.AppleID.auth.init({
      clientId: APPLE_CLIENT_ID,
      scope: "name email",
      redirectURI: APPLE_REDIRECT_URI,
      usePopup: true,
    });
    appleInited = true;
  }

  const res = await window.AppleID.auth.signIn();
  const idToken = res?.authorization?.id_token;
  if (!idToken) throw new Error("Apple haikurudisha token.");
  return {
    idToken,
    code: res.authorization.code || null,
    user: res.user || null,
  };
}

export function isSocialCancel(err) {
  const code = err?.error || err?.type || "";
  return (
    code === "popup_closed_by_user" ||
    code === "user_cancelled_authorize" ||
    code === "popup_blocked_by_browser"
  );
}
