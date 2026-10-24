// ============================================================
// socialAuth.js
// Google Identity Services (popup) + Apple via django-allauth (redirect)
// ============================================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Services ID (sio App ID). Inatumika tu kuonyesha/kuficha kitufe.
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || "";

// URL ya backend inayoanzisha Apple login (django-allauth)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.sokomkononi.co.tz/api";

// /api ni suffix; tunahitaji origin pekee kwa /accounts/apple/login/
const API_ORIGIN = (() => {
  try {
    const u = new URL(API_BASE_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "https://api.sokomkononi.co.tz";
  }
})();

export const APPLE_LOGIN_URL = `${API_ORIGIN}/accounts/apple/login/`;

export const isGoogleEnabled = Boolean(GOOGLE_CLIENT_ID);
export const isAppleEnabled = Boolean(APPLE_CLIENT_ID);

if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
  console.info("[socialAuth] Google client ID:", GOOGLE_CLIENT_ID ? "(set)" : "(missing)");
  console.info("[socialAuth] Apple client ID:", APPLE_CLIENT_ID || "(missing)");
  console.info("[socialAuth] Apple login URL:", APPLE_LOGIN_URL);
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

// ── Google (HAIJAGUSWA) ────────────────────────────────────
let googleInitialized = false;
let googleCredentialHandler = null;

export async function renderGoogleButton(el, { onCredential, onError, locale = "en" } = {}) {
  if (!isGoogleEnabled || !el) return;
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

// ── Apple: redirect kwa django-allauth ─────────────────────
export function redirectToAppleLogin() {
  if (!isAppleEnabled) throw new Error("Apple Sign-In not configured");
  window.location.href = APPLE_LOGIN_URL;
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