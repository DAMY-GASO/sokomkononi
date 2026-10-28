// ============================================================
// socialAuth.js
// Google Identity Services + Apple JS (in-browser popup flow)
// ============================================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// ⚠️ Services ID (sio App ID).
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || "";

// Redirect URI kwa Apple JS (inahitajika hata kwa popup, lazima ilingane na Apple Developer)
const APPLE_REDIRECT_URI =
  import.meta.env.VITE_APPLE_REDIRECT_URI ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const isGoogleEnabled = Boolean(GOOGLE_CLIENT_ID);
export const isAppleEnabled = Boolean(APPLE_CLIENT_ID);

if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
  console.info("[socialAuth] Google client ID:", GOOGLE_CLIENT_ID ? "(set)" : "(missing)");
  console.info("[socialAuth] Apple client ID:", APPLE_CLIENT_ID || "(missing)");
  console.info("[socialAuth] Apple redirect URI:", APPLE_REDIRECT_URI);
}

// ── Script loader (cached) ─────────────────────────────────
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
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(s);
  });
  return scriptCache[src];
}

// ── Google: REDIRECT flow kwa iPhone/iPad (Safari ITP) ─────
// Safari inazuia popup/iframe ya Google Identity Services (ITP), hivyo
// kwenye iOS tunatumia redirect: mtumiaji anaenda Google, anarudi
// kwenye /login akiwa na id_token kwenye URL fragment (#id_token=...).
// Backend /auth/social/ inapokea id_token ileile kama kawaida.
const G_STATE_KEY = "smk_g_state";
const G_NONCE_KEY = "smk_g_nonce";
const G_REDIRECT_KEY = "smk_g_redirect";

function store(key, value) {
  try { window.sessionStorage.setItem(key, value); } catch { /* noop */ }
  try { window.localStorage.setItem(key, value); } catch { /* noop */ }
}
function readStored(key) {
  try {
    const v = window.sessionStorage.getItem(key);
    if (v) return v;
  } catch { /* noop */ }
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function clearStored(...keys) {
  keys.forEach((k) => {
    try { window.sessionStorage.removeItem(k); } catch { /* noop */ }
    try { window.localStorage.removeItem(k); } catch { /* noop */ }
  });
}

function randomString() {
  const a = new Uint8Array(16);
  window.crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function decodeJwtPayload(token) {
  try {
    const part = String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(part)
        .split("")
        .map((ch) => "%" + ("00" + ch.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// iPhone, iPod, iPad (pamoja na iPadOS inayojitambulisha kama Mac)
export function needsGoogleRedirect() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isIOS || isIPadOS;
}

export function startGoogleRedirect() {
  if (!isGoogleEnabled) return;
  const state = randomString();
  const nonce = randomString();
  store(G_STATE_KEY, state);
  store(G_NONCE_KEY, nonce);

  const redirectParam = new URLSearchParams(window.location.search).get("redirect");
  if (redirectParam) store(G_REDIRECT_KEY, redirectParam);
  else clearStored(G_REDIRECT_KEY);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}/login`,
    response_type: "id_token",
    scope: "openid email profile",
    nonce,
    state,
    prompt: "select_account",
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

// Inaitwa LoginPage ikifunguka. Inarudisha:
//   null                      → hakuna kinachoendelea
//   { error: "google_failed" } → imeshindwa/imekataliwa
//   { idToken, redirect }      → tayari kwa socialLoginAsync
export function consumeGoogleRedirect() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash || "";
  if (!hash.includes("id_token=") && !hash.includes("error=")) return null;

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const idToken = params.get("id_token");
  const gError = params.get("error");
  const state = params.get("state");

  const expectedState = readStored(G_STATE_KEY);
  const expectedNonce = readStored(G_NONCE_KEY);
  const redirect = readStored(G_REDIRECT_KEY);
  clearStored(G_STATE_KEY, G_NONCE_KEY, G_REDIRECT_KEY);

  // Ondoa token kwenye URL mara moja
  try {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  } catch { /* noop */ }

  if (gError || !idToken) return { error: "google_failed" };
  if (!expectedState || state !== expectedState) return { error: "google_failed" };

  const payload = decodeJwtPayload(idToken);
  if (!payload || !expectedNonce || payload.nonce !== expectedNonce) {
    return { error: "google_failed" };
  }
  if (payload.aud !== GOOGLE_CLIENT_ID) return { error: "google_failed" };

  const safeRedirect =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
  return { idToken, redirect: safeRedirect };
}

function renderGoogleRedirectButton(el, locale) {
  const label = String(locale || "").startsWith("sw")
    ? "Endelea na Google"
    : "Continue with Google";
  el.innerHTML = "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", label);
  btn.style.cssText = [
    "width:100%", "height:44px", "display:flex", "align-items:center",
    "justify-content:center", "gap:10px", "background:#fff", "color:#3c4043",
    "border:1px solid #dadce0", "border-radius:4px", "cursor:pointer",
    "font:500 14px system-ui,-apple-system,Segoe UI,sans-serif",
  ].join(";");
  btn.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.9 6.1C12.3 13.6 17.7 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/>' +
    '<path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.5 10.8l7.9-6.1z"/>' +
    '<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>' +
    "</svg><span></span>";
  btn.querySelector("span").textContent = label;
  btn.addEventListener("click", startGoogleRedirect);
  el.appendChild(btn);
}

// ── Google (popup/GIS — desktop na Android) ───────────────
let googleInitialized = false;
let googleCredentialHandler = null;

export async function renderGoogleButton(el, { onCredential, onError, locale = "en" } = {}) {
  if (!isGoogleEnabled || !el) return;

  // iPhone/iPad: popup ya GIS haifanyi kazi (ITP) → tumia redirect
  if (needsGoogleRedirect()) {
    renderGoogleRedirectButton(el, locale);
    return;
  }

  try {
    await loadScript("https://accounts.google.com/gsi/client");
  } catch (err) {
    onError?.(err);
    return;
  }

  if (!googleCredentialHandler) googleCredentialHandler = {};
  googleCredentialHandler.onCredential = onCredential;
  googleCredentialHandler.onError = onError;

  if (!googleInitialized) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => {
        if (resp?.credential) {
          googleCredentialHandler?.onCredential?.(resp.credential);
        } else {
          googleCredentialHandler?.onError?.(new Error("Google returned no credential"));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false,
    });
    googleInitialized = true;
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

// ── Apple: popup flow ──────────────────────────────────────
let appleInitialized = false;

export async function getAppleIdentity() {
  if (!isAppleEnabled) throw new Error("Apple Sign-In not configured");
  await loadScript(
    "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
  );

  if (!appleInitialized) {
    window.AppleID.auth.init({
      clientId: APPLE_CLIENT_ID,
      scope: "name email",
      redirectURI: APPLE_REDIRECT_URI,
      usePopup: true,
    });
    appleInitialized = true;
  }

  const res = await window.AppleID.auth.signIn();
  const idToken = res?.authorization?.id_token;
  if (!idToken) throw new Error("Apple returned no id_token");

  return {
    idToken,
    code: res.authorization.code || null,
    user: res.user || null, // { name: { firstName, lastName }, email }
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

// Google login inatumia hii (haijaguswa)
export { socialLoginAsync } from "./authStore.js";