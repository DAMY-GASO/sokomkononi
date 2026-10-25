// ============================================================
// ImageLightbox.jsx
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react";

export default function ImageLightbox({
  images = [],
  initialIndex = 0,
  open = false,
  onClose,
  lang = "sw",
  alt = "",
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Touch / swipe state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchDeltaX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  // ✅ HOOKS ZOTE ZINAPASWA KUITWA KABLA YA RETURN NULL
  const lastTapRef = useRef(0);

  // ── Reset wakati open inabadilika ──
  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setZoomed(false);
      setLoading(true);
    }
  }, [open, initialIndex]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  // ✅ SASA RETURN NULL INAKUJA BAADA YA HOOKS ZOTE
  if (!open || images.length === 0) return null;

  const current = images[index];

  const next = () => {
    if (zoomed) return;
    setIndex((i) => (i + 1) % images.length);
    setLoading(true);
    setZoomed(false);
  };

  const prev = () => {
    if (zoomed) return;
    setIndex((i) => (i - 1 + images.length) % images.length);
    setLoading(true);
    setZoomed(false);
  };

  const goTo = (i) => {
    setIndex(i);
    setLoading(true);
    setZoomed(false);
  };

  // ── Touch handlers (swipe) ──
  const handleTouchStart = (e) => {
    if (zoomed) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e) => {
    if (zoomed || touchStartX.current == null) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;

    if (Math.abs(dx) > Math.abs(dy)) {
      touchDeltaX.current = dx;
      setDragOffset(dx);
    }
  };

  const handleTouchEnd = () => {
    if (zoomed) return;
    const dx = touchDeltaX.current;
    const threshold = 60;

    if (dx < -threshold) next();
    else if (dx > threshold) prev();

    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
    setDragOffset(0);
  };

  // ── Double-tap zoom (touch) / double-click zoom ──
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setZoomed((z) => !z);
    }
    lastTapRef.current = now;
  };

  const imgSrc =
    typeof current === "string"
      ? current
      : current?.image_url || current?.url || current?.src || "";

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/95 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("Picha", "Image viewer")}
    >
      {/* ═══════════════════════════════════════════════════════ */}
      {/* TOP BAR — counter + close                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div
        className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <Camera size={16} />
          <span className="font-semibold tabular-nums">
            {index + 1} / {images.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          aria-label={t("Funga", "Close")}
        >
          <X size={20} />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* IMAGE AREA — picha katikati, vitufe katikati            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center px-2 min-h-0"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: dragOffset === 0 ? "transform 0.2s ease-out" : "none",
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleTap();
          }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <img
            src={imgSrc}
            alt={alt}
            loading="eager"
            decoding="async"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            draggable={false}
            className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
              zoomed ? "scale-200 cursor-zoom-out" : "scale-100 cursor-zoom-in"
            }`}
            style={{ touchAction: zoomed ? "pinch-zoom" : "pan-y" }}
          />
        </div>

        {/* ✅ Prev button — KUSHOTO KATIKATI ya picha */}
        {images.length > 1 && !zoomed && (
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10 shadow-lg"
            aria-label={t("Picha iliyotangulia", "Previous image")}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* ✅ Next button — KULIA KATIKATI ya picha */}
        {images.length > 1 && !zoomed && (
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10 shadow-lg"
            aria-label={t("Picha inayofuata", "Next image")}
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BOTTOM — thumbnails                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {images.length > 1 && (
        <div
          className="shrink-0 px-3 sm:px-4 py-3 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2 justify-center min-w-min">
            {images.map((img, i) => {
              const thumbSrc =
                typeof img === "string"
                  ? img
                  : img?.thumb || img?.card || img?.image_url || img?.url || "";
              const isActive = i === index;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    isActive
                      ? "border-white opacity-100 scale-105"
                      : "border-white/20 opacity-50 hover:opacity-80"
                  }`}
                  aria-label={`${t("Picha", "Image")} ${i + 1}`}
                >
                  <img
                    src={thumbSrc}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hint — swipe kwa simu */}
      {images.length > 1 && (
        <p className="text-center text-white/40 text-[11px] pb-2 sm:hidden">
          {t("Telezesha kushoto/kulia kupita picha", "Swipe left/right to navigate")}
        </p>
      )}
    </div>
  );
}