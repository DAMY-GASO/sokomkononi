import React, { useEffect, useState } from "react";
import {
  X, ImagePlus, Star, Loader2, AlertTriangle,
  RefreshCw, Info, Maximize2,
} from "lucide-react";
import { listingsApi } from "../../../../api/listings.js";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import ImageLightbox from "../../../../components/ImageLightbox.jsx";

export default function AdminListingImageManager({ listing, onClose }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const fetchImages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listingsApi.listImages(listing.id);
      const list = Array.isArray(res) ? res : res?.results || [];
      list.sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return (a.ordering || 0) - (b.ordering || 0);
      });
      setImages(list);
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kupakia picha", "Failed to load images")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id]);

  const pickImageSrc = (img) =>
    img?.detail || img?.card || img?.image_url || img?.thumb || img?.url || null;

  // ✅ Picha zinazotumwa kwenye ImageLightbox
  const lightboxImages = images
    .map((img) => ({
      id: img.id,
      image_url: pickImageSrc(img),
      thumb: img.thumb || img.card || pickImageSrc(img),
      card: img.card || pickImageSrc(img),
    }))
    .filter((img) => img.image_url);

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[color:rgb(var(--c-hairline))] bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[color:rgb(var(--c-hairline))] px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-primary">
                {t("Picha za Tangazo", "Listing Images")}
              </h2>
              <p className="truncate text-xs text-secondary">{listing.title}</p>
            </div>
            <button
              onClick={onClose}
              aria-label={t("Funga", "Close")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-secondary hover:bg-[color:rgb(var(--c-page))] hover:text-primary"
            >
              <X size={18} />
            </button>
          </div>

          {/* Read-only banner */}
          <div className="flex items-start gap-2 border-b border-[color:rgb(var(--c-hairline))] bg-[#0062FD]/5 px-5 py-3 text-xs text-[#0062FD]">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              {t(
                "Admin anaweza kuona picha pekee. Kama picha hazifai, tumia 'Omba Uhariri' kwenye Moderation ili seller mwenyewe abadilishe.",
                "Admin can view images only. If images are unsuitable, use 'Request Edit' on Moderation so the seller can change them."
              )}
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[#C1502E]/30 bg-[#C1502E]/10 p-3 text-xs text-[#C1502E]">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span className="min-w-0 break-words">{error}</span>
              </div>
            )}

            {/* Existing images */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  {t(`Picha (${images.length})`, `Images (${images.length})`)}
                </h3>
                <button
                  onClick={fetchImages}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-secondary hover:bg-[color:rgb(var(--c-page))] disabled:opacity-50"
                >
                  <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                  {t("Sasisha", "Refresh")}
                </button>
              </div>

              {loading && images.length === 0 ? (
                <div className="grid place-items-center py-10">
                  <Loader2 size={24} className="animate-spin text-muted" />
                </div>
              ) : images.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-[color:rgb(var(--c-hairline))] bg-[color:rgb(var(--c-page))] p-8 text-center">
                  <ImagePlus size={28} className="mx-auto text-muted" />
                  <p className="mt-2 text-xs text-secondary">
                    {t("Hakuna picha", "No images")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((img, index) => {
                    const src = pickImageSrc(img);
                    return (
                      <div
                        key={img.id}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-[color:rgb(var(--c-hairline))] bg-[color:rgb(var(--c-page))]"
                      >
                        {src ? (
                          <button
                            type="button"
                            onClick={() => {
                              setInitialIndex(index);
                              setLightboxOpen(true);
                            }}
                            className="block h-full w-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[color:rgb(var(--c-royal))] focus:ring-inset"
                          >
                            <img
                              src={src}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.style.opacity = 0.3;
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                              <Maximize2 size={24} className="text-white opacity-0 transition-opacity group-hover:opacity-100 drop-shadow-md" />
                            </div>
                          </button>
                        ) : (
                          <div className="grid h-full w-full place-items-center text-muted">
                            <ImagePlus size={24} />
                          </div>
                        )}

                        {img.is_primary && (
                          <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#2F6D4F] px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                            <Star size={9} fill="#fff" />{" "}
                            {t("KUU", "PRIMARY")}
                          </span>
                        )}

                        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                          {index + 1} / {images.length}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[color:rgb(var(--c-hairline))] px-5 py-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-[color:rgb(var(--c-hairline))] px-4 py-2 text-xs font-semibold text-primary hover:bg-[color:rgb(var(--c-page))]"
            >
              {t("Funga", "Close")}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ ImageLightbox moja inayotumika kwa wote */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={initialIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        lang={lang}
        alt={listing.title || ""}
      />
    </>
  );
}