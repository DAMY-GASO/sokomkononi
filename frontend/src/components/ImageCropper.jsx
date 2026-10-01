
import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";

const MAX_ZOOM = 4;

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
}

export default function ImageCropper({
  file,
  lang = "sw",
  outputSize = 1080,
  maxBytes = 2 * 1024 * 1024,
  onConfirm,
  onCancel,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const boxRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null); // { id, startX, startY, ox, oy }
  const pointersRef = useRef(new Map()); // kwa pinch
  const pinchRef = useRef(null);

  const [src, setSrc] = useState(null);
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [view, setView] = useState(320); // ukubwa wa kisanduku (px)
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);

  // ── Pakia picha ────────────────────────────────────────
  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setLoadError(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ── Pima kisanduku ─────────────────────────────────────
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => setView(el.clientWidth || 320);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Esc = funga ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Zuia ukurasa wa nyuma kusogea
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // scale ya msingi: upande mfupi wa picha ujaze kisanduku (cover)
  const baseScale = nat.w && nat.h ? view / Math.min(nat.w, nat.h) : 1;
  const scale = baseScale * zoom;

  const clampOffset = useCallback(
    (x, y, sc = scale) => {
      const maxX = Math.max(0, (nat.w * sc - view) / 2);
      const maxY = Math.max(0, (nat.h * sc - view) / 2);
      return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
    },
    [nat, view, scale]
  );

  // Re-clamp kila zoom/ukubwa unapobadilika
  useEffect(() => {
    setOffset((o) => clampOffset(o.x, o.y));
  }, [clampOffset]);

  const changeZoom = (next) => {
    const z = clamp(next, 1, MAX_ZOOM);
    setZoom(z);
  };

  // ── Pointer: buruta + pinch ────────────────────────────
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        ox: offset.x,
        oy: offset.y,
      };
    } else if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        zoom,
      };
      dragRef.current = null;
    }
  };

  const onPointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      changeZoom(pinchRef.current.zoom * (d / pinchRef.current.dist));
      return;
    }
    if (dragRef.current) {
      const d = dragRef.current;
      setOffset(
        clampOffset(d.ox + (e.clientX - d.startX), d.oy + (e.clientY - d.startY))
      );
    }
  };

  const onPointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    pinchRef.current = null;
    if (pointersRef.current.size === 1) {
      const [p] = [...pointersRef.current.values()];
      dragRef.current = { startX: p.x, startY: p.y, ox: offset.x, oy: offset.y };
    } else {
      dragRef.current = null;
    }
  };

  const onWheel = (e) => {
    changeZoom(zoom - e.deltaY * 0.002);
  };

  // ── Kata na toa faili ──────────────────────────────────
  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img || !nat.w) return;
    setBusy(true);
    try {
      // Eneo la picha asilia linaloonekana kwenye kisanduku
      const sSize = view / scale;
      const sx = nat.w / 2 + (-view / 2 - offset.x) / scale;
      const sy = nat.h / 2 + (-view / 2 - offset.y) / scale;

      // Usipanue picha ndogo kupita uhalisia wake
      const out = Math.max(1, Math.min(outputSize, Math.round(sSize)));
      const canvas = document.createElement("canvas");
      canvas.width = out;
      canvas.height = out;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // PNG zenye uwazi → mandharinyuma meupe
      ctx.fillRect(0, 0, out, out);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, out, out);

      // Punguza quality hadi ukubwa uwe chini ya kikomo
      let blob = null;
      for (const q of [0.9, 0.82, 0.74, 0.66, 0.58, 0.5]) {
        // eslint-disable-next-line no-await-in-loop
        blob = await canvasToBlob(canvas, q);
        if (blob && blob.size <= maxBytes) break;
      }
      if (!blob) throw new Error("toBlob failed");

      const base = (file.name || "photo").replace(/\.[^.]+$/, "");
      onConfirm?.(
        new File([blob], `${base}-square.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        })
      );
    } catch (err) {
      console.warn("[ImageCropper] crop failed:", err);
      setLoadError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("Kata picha", "Crop photo")}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-4 sm:p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-primary">
              {t("Kata picha kuwa mraba", "Crop photo to square")}
            </h3>
            <p className="text-xs text-secondary">
              {t(
                "Buruta kusogeza, tumia slider kuvuta.",
                "Drag to move, use the slider to zoom."
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("Funga", "Close")}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Eneo la kukata */}
        <div
          ref={boxRef}
          className="relative mx-auto aspect-square w-full touch-none select-none overflow-hidden rounded-xl bg-[#101A2E] cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {src && !loadError && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) =>
                setNat({
                  w: e.currentTarget.naturalWidth,
                  h: e.currentTarget.naturalHeight,
                })
              }
              onError={() => setLoadError(true)}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: nat.w || "auto",
                height: nat.h || "auto",
                maxWidth: "none",
                transformOrigin: "center",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                visibility: nat.w ? "visible" : "hidden",
              }}
            />
          )}

          {/* Gridi ya theluthi tatu */}
          {nat.w > 0 && !loadError && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 border border-white/70" />
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
              <div className="absolute top-1/3 left-0 h-px w-full bg-white/30" />
              <div className="absolute top-2/3 left-0 h-px w-full bg-white/30" />
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center p-5 text-center text-sm text-white/80">
              {t(
                "Picha hii haiwezi kusomwa. Jaribu picha ya JPG au PNG.",
                "This image can't be read. Try a JPG or PNG photo."
              )}
            </div>
          )}
        </div>

        {/* Zoom */}
        <div className="mt-4 flex items-center gap-3">
          <ZoomOut size={16} className="shrink-0 text-secondary" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => changeZoom(Number(e.target.value))}
            disabled={!nat.w || loadError}
            aria-label={t("Kuvuta", "Zoom")}
            className="h-1.5 w-full cursor-pointer accent-[#E8A33D]"
          />
          <ZoomIn size={16} className="shrink-0 text-secondary" />
        </div>

        {/* Vitendo */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-gray-50 disabled:opacity-50"
          >
            {t("Ghairi", "Cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !nat.w || loadError}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#E8A33D] px-4 py-2.5 text-sm font-semibold text-[#101A2E] hover:bg-[#D99728] disabled:opacity-50"
          >
            <Check size={16} />
            {busy ? t("Inakata...", "Cropping...") : t("Kata na Tumia", "Crop & Use")}
          </button>
        </div>
      </div>
    </div>
  );
}
