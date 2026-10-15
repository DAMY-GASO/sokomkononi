// ============================================================
// socialAuth.js
// Google Identity Services + Apple JS (in-browser popup flow).
//
// Vite bakes VITE_* into the bundle AT BUILD TIME. In Docker,
// they must arrive via `ARG → ENV` before `npm run build`.
// ============================================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const APPLE_CLIENT_ID  = import.meta.env.VITE_APPLE_CLIENT_ID || "";
const APPLE_REDIRECT_URI =
  import.meta.env.VITE_APPLE_REDIRECT_URI ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const isGoogleEnabled = Boolean(GOOGLE_CLIENT_ID);
export const isAppleEnabled  = Boolean(APPLE_CLIENT_ID);

// Dev-only diagnostics — verify env is picked up
if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
  console.info("[socialAuth] Google client ID:", GOOGLE_CLIENT_ID ? "(set)" : "(missing)");
  console.info("[socialAuth] Apple client ID:", APPLE_CLIENT_ID ? "(set)" : "(missing)");
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

// ── Google ─────────────────────────────────────────────────
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

  // Merge into the existing handler so a second mount doesn't clobber
  // the callback that Google's already-registered click handler points to.
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

// ── Apple ──────────────────────────────────────────────────
let appleInitialized = false;

export async function getAppleIdentity() {
  if (!isAppleEnabled) throw new Error("Apple Sign-In not configured");
  await loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");

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

export { socialLoginAsync } from "./authStore.js";
