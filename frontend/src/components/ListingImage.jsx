import React, { useEffect, useRef, useState } from "react";
import { pickVariant } from "../utils/imageVariants.js";

/**
 * ListingImage — picha ya tangazo yenye fremu moja thabiti (kama Facebook
 * Marketplace / AliExpress) lakini isiyoharibu picha zisizo za mraba.
 *
 *  • Picha zilizo karibu na mraba (3:4 → 7:5)  → object-cover (zinajaza fremu)
 *  • Picha ndefu sana / pana sana (screenshot, panorama) → object-contain
 *    juu ya nakala yake iliyofifishwa (blur), hakuna kukatwa wala mapengo meupe
 *  • Skeleton wakati inapakia, na `fallback` ikishindwa/haipo
 *
 * Props: src, alt, ratio (default "aspect-square"), fallback (node), className
 */
const COVER_MIN = 0.75; // upana ÷ urefu
const COVER_MAX = 1.4;

export default function ListingImage({
  src,
  variant = "card",
  alt = "",
  ratio = "aspect-square",
  fallback = null,
  className = "",
  eager = false,
}) {
  const imgRef = useRef(null);
  // Resolve variant URLs from either a string or an image object.
  const resolved = pickVariant(src, variant);
  const effectiveSrc = resolved.src || (typeof src === "string" ? src : null);
  const [status, setStatus] = useState(effectiveSrc ? "loading" : "error");
  const [fit, setFit] = useState("cover");

  const settle = (el) => {
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    if (w && h) {
      const r = w / h;
      setFit(r >= COVER_MIN && r <= COVER_MAX ? "cover" : "contain");
    }
    setStatus("loaded");
  };

  useEffect(() => {
    if (!effectiveSrc) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    setFit("cover");
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth) settle(el);
  }, [effectiveSrc]);

  const showImage = effectiveSrc && status !== "error";

  return (
    <div className={`relative overflow-hidden bg-sand ${ratio} ${className}`}>
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-sandline/60" aria-hidden="true" />
      )}

      {/* Mandharinyuma iliyofifishwa — kwa picha zisizo za mraba tu */}
      {showImage && fit === "contain" && status === "loaded" && (
        <img
          src={effectiveSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl"
        />
      )}

      {showImage && (
        <img
          ref={imgRef}
          src={effectiveSrc}
          srcSet={resolved.srcSet || undefined}
          sizes={resolved.sizes || undefined}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchpriority={eager ? "high" : undefined}
          onLoad={(e) => settle(e.currentTarget)}
          onError={() => setStatus("error")}
          className={`absolute inset-0 h-full w-full transition duration-500 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          } ${
            fit === "cover"
              ? "object-cover object-center group-hover:scale-[1.04]"
              : "object-contain"
          }`}
        />
      )}

      {!showImage && (
        <div className="absolute inset-0 flex items-center justify-center text-gold">
          {fallback}
        </div>
      )}
    </div>
  );
}
