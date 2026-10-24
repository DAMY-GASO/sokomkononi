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