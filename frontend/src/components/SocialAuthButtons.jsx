import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  isGoogleEnabled,
  isAppleEnabled,
  renderGoogleButton,
  getAppleIdentity,
  isSocialCancel,
  socialLoginAsync,
} from "../config/socialAuth.js";

const IS_DEV =
  typeof import.meta !== "undefined" && Boolean(import.meta.env && import.meta.env.DEV);

function errMsg(err, fallback) {
  const first =
    err?.data && typeof err.data === "object" && !err.data.detail
      ? Object.values(err.data).flat().find((v) => typeof v === "string")
      : null;
  return err?.data?.detail || first || err?.message || fallback;
}

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
    <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

export default function SocialAuthButtons({
  lang = "sw",
  onSuccess,
  showTerms = false,
}) {
  const tx = (sw, en) => (lang === "sw" ? sw : en);
  const googleRef = useRef(null);
  const handlerRef = useRef(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const showGoogle = isGoogleEnabled || IS_DEV;
  const showApple = isAppleEnabled || IS_DEV;

  async function finish(provider, identity) {
    if (busyRef.current) return;
    busyRef.current = true;
    setError("");
    setBusy(provider);
    const res = await socialLoginAsync({
      provider,
      idToken: identity.idToken,
      code: identity.code || null,
      user: identity.user || null,
    });
    busyRef.current = false;
    setBusy("");
    if (!res.ok) {
      setError(
        errMsg(res.error, tx("Imeshindwa kuingia. Jaribu tena.", "Sign-in failed. Please try again."))
      );
      return;
    }
    onSuccess?.(res);
  }
  handlerRef.current = finish;

  async function handleApple() {
    if (busyRef.current) return;
    setError("");
    busyRef.current = true;
    setBusy("apple");
    let identity;
    try {
      identity = await getAppleIdentity();
    } catch (err) {
      busyRef.current = false;
      setBusy("");
      if (!isSocialCancel(err)) {
        setError(err?.message || tx("Imeshindwa kuingia na Apple.", "Could not sign in with Apple."));
      }
      return;
    }
    busyRef.current = false;
    setBusy("");
    await finish("apple", identity);
  }

  useEffect(() => {
    if (!isGoogleEnabled || !googleRef.current) return;
    const el = googleRef.current;
    renderGoogleButton(el, {
      locale: lang === "sw" ? "sw" : "en",
      onCredential: (idToken) => handlerRef.current("google", { idToken }),
      onError: (err) =>
        setError(err?.message || tx("Google imeshindwa.", "Google sign-in failed.")),
    }).catch((err) => setError(err?.message || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (!showGoogle && !showApple) return null;

  const base =
    "w-full h-10 inline-flex items-center justify-center gap-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="mb-6">
      <div className={`space-y-3 transition-opacity ${busy ? "opacity-60 pointer-events-none" : ""}`}>
        {showGoogle &&
          (isGoogleEnabled ? (
            <div ref={googleRef} className="flex w-full min-h-[40px] justify-center" />
          ) : (
            <button type="button" disabled className={`${base} border border-sandline bg-white text-text-primary`}>
              <GoogleG /> {tx("Endelea na Google", "Continue with Google")}
            </button>
          ))}

        {showApple && (
          <button
            type="button"
            onClick={handleApple}
            disabled={!isAppleEnabled || !!busy}
            className={`${base} bg-black text-white hover:bg-neutral-800`}
          >
            <AppleLogo />
            {busy === "apple"
              ? tx("Inaingia...", "Signing in...")
              : tx("Endelea na Apple", "Continue with Apple")}
          </button>
        )}
      </div>

      {IS_DEV && (!isGoogleEnabled || !isAppleEnabled) && (
        <p className="mt-2 rounded-md bg-gold/15 px-3 py-2 text-xs text-gold-ink">
          DEV — weka kwenye <code>.env</code> kisha restart dev server:{" "}
          {!isGoogleEnabled && <code>VITE_GOOGLE_CLIENT_ID </code>}
          {!isAppleEnabled && <code>VITE_APPLE_CLIENT_ID</code>}
        </p>
      )}

      {error && <p className="mt-3 text-center text-body-sm text-rust">{error}</p>}

      {showTerms && (
        <p className="mt-3 text-center text-xs leading-relaxed text-secondary">
          {tx("Kwa kuendelea unakubali", "By continuing you agree to the")}{" "}
          <Link to="/sheria" className="underline hover:text-night">{tx("Masharti", "Terms")}</Link>{" "}
          {tx("na", "and")}{" "}
          <Link to="/faragha" className="underline hover:text-night">{tx("Faragha", "Privacy")}</Link>
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-sandline" />
        <span className="text-xs uppercase tracking-wide text-muted">
          {tx("au tumia barua pepe", "or use email")}
        </span>
        <span className="h-px flex-1 bg-sandline" />
      </div>
    </div>
  );
}
