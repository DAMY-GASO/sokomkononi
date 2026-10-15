import React, { useEffect, useRef, useState } from "react";
import {
  X, ImagePlus, Star, Trash2, Loader2, AlertTriangle,
  CheckCircle2, ArrowUp, ArrowDown, RefreshCw,
} from "lucide-react";
import { listingsApi } from "../../../../api/listings.js";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useToast } from "../../../../components/Toast.jsx";
import { useConfirm } from "../../../../components/ConfirmDialog.jsx";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL = 10;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * AdminListingImageManager
 *
 * Full-featured modal for admins to manage a listing's images:
 *   • View existing images (thumb/card/detail variants)
 *   • Upload new images in bulk
 *   • Delete an image
 *   • Set any image as primary
 *   • Reorder (up/down) — persists ordering to backend
 *
 * Endpoints used:
 *   GET    /listings/{id}/images/
 *   POST   /listings/{id}/images/bulk/
 *   PATCH  /listings/{id}/images/{img_id}/
 *   DELETE /listings/{id}/images/{img_id}/
 */
export default function AdminListingImageManager({ listing, onClose, onUpdated }) {
  const { lang } = useLanguage();
  const toast = useToast();
  const confirm = useConfirm();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const inputRef = useRef(null);

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
      setError(err?.data?.detail || err?.message || t("Imeshindwa kupakia picha", "Failed to load images"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); /* eslint-disable-next-line */ }, [listing.id]);

  const pickImageSrc = (img) =>
    img?.card || img?.thumb || img?.image_url || img?.url || null;

  const handleUpload = async () => {
    if (newFiles.length === 0 || uploading) return;
    if (images.length + newFiles.length > MAX_TOTAL) {
      setError(t(`Jumla ya picha zisizidi ${MAX_TOTAL}`, `Total images must not exceed ${MAX_TOTAL}`));
      return;
    }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      for (const f of newFiles) fd.append("images", f);
      await listingsApi.bulkUploadImages(listing.id, fd);
      toast.success(t("Picha zimepakiwa", "Images uploaded"));
      setNewFiles([]);
      await fetchImages();
      onUpdated?.();
    } catch (err) {
      const msg =
        err?.data?.detail ||
        err?.data?.error?.message ||
        err?.message ||
        t("Imeshindwa kupakia picha", "Upload failed");
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img) => {
    const ok = await confirm({
      title: t("Ondoa picha hii?", "Remove this image?"),
      description: t("Haiwezi kurudishwa.", "This cannot be undone."),
      confirmLabel: t("Ondoa", "Remove"),
      danger: true,
    });
    if (!ok) return;
    setBusy((b) => ({ ...b, [img.id]: "delete" }));
    try {
      await listingsApi.deleteImage(listing.id, img.id);
      setImages((prev) => {
        const next = prev.filter((x) => x.id !== img.id);
        // If we just deleted the primary, promote the first one locally
        if (img.is_primary && next.length > 0) {
          next[0].is_primary = true;
        }
        return next;
      });
      toast.success(t("Picha imeondolewa", "Image removed"));
      onUpdated?.();
    } catch (err) {
      toast.error(err?.data?.detail || err?.message || t("Imeshindwa kuondoa", "Failed to remove"));
    } finally {
      setBusy((b) => { const n = { ...b }; delete n[img.id]; return n; });
    }
  };

  const handleMakePrimary = async (img) => {
    if (img.is_primary) return;
    setBusy((b) => ({ ...b, [img.id]: "primary" }));
    try {
      await listingsApi.updateImage(listing.id, img.id, { is_primary: true });
      setImages((prev) =>
        prev.map((x) => ({ ...x, is_primary: x.id === img.id }))
      );
      toast.success(t("Picha kuu imebadilishwa", "Primary image changed"));
      onUpdated?.();
    } catch (err) {
      toast.error(err?.data?.detail || err?.message || t("Imeshindwa kubadilisha", "Failed"));
    } finally {
      setBusy((b) => { const n = { ...b }; delete n[img.id]; return n; });
    }
  };

  const reorder = async (img, direction) => {
    const idx = images.findIndex((x) => x.id === img.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const next = [...images];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    setImages(next);

    setBusy((b) => ({ ...b, [img.id]: "reorder" }));
    try {
      await Promise.all([
        listingsApi.updateImage(listing.id, img.id, { ordering: targetIdx }),
        listingsApi.updateImage(listing.id, next[idx].id, { ordering: idx }),
      ]);
      onUpdated?.();
    } catch (err) {
      toast.error(err?.data?.detail || err?.message || t("Imeshindwa kupanga", "Reorder failed"));
      await fetchImages();
    } finally {
      setBusy((b) => { const n = { ...b }; delete n[img.id]; return n; });
    }
  };

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    setError("");
    const combined = [...newFiles, ...picked];

    for (const f of picked) {
      if (!ALLOWED.includes(f.type)) {
        setError(t(`${f.name}: tumia JPG, PNG au WEBP`, `${f.name}: use JPG, PNG or WEBP`));
        return;
      }
      if (f.size > MAX_BYTES) {
        setError(t(`${f.name}: ukubwa usizidi 5 MB`, `${f.name}: max size is 5 MB`));
        return;
      }
    }
    if (combined.length + images.length > MAX_TOTAL) {
      setError(t(`Jumla ya picha zisizidi ${MAX_TOTAL}`, `Total images must not exceed ${MAX_TOTAL}`));
      return;
    }
    setNewFiles(combined);
  };

  const removeNewFile = (i) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const closeAll = () => {
    if (uploading) return;
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
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
            onClick={closeAll}
            disabled={uploading}
            aria-label={t("Funga", "Close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-secondary hover:bg-[color:rgb(var(--c-page))] hover:text-primary disabled:opacity-50"
          >
            <X size={18} />
          </button>
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
                {t(`Zilizopo (${images.length})`, `Existing (${images.length})`)}
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
                <Loader2 size={24} className="animate-spin-slow text-muted" />
              </div>
            ) : images.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[color:rgb(var(--c-hairline))] bg-[color:rgb(var(--c-page))] p-8 text-center">
                <ImagePlus size={28} className="mx-auto text-muted" />
                <p className="mt-2 text-xs text-secondary">
                  {t("Hakuna picha bado", "No images yet")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((img, i) => {
                  const src = pickImageSrc(img);
                  const isBusy = !!busy[img.id];
                  return (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-[color:rgb(var(--c-hairline))] bg-[color:rgb(var(--c-page))]"
                    >
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(e) => { e.currentTarget.style.opacity = 0.3; }}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted">
                          <ImagePlus size={24} />
                        </div>
                      )}

                      {img.is_primary && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#2F6D4F] px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                          <Star size={9} fill="#fff" /> {t("KUU", "PRIMARY")}
                        </span>
                      )}

                      {/* Action buttons (top-right) */}
                      <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                        {!img.is_primary && (
                          <button
                            onClick={() => handleMakePrimary(img)}
                            disabled={isBusy}
                            title={t("Fanya kuwa kuu", "Make primary")}
                            className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[#A35F00] shadow-md hover:bg-white disabled:opacity-50"
                          >
                            {busy[img.id] === "primary"
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Star size={13} />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(img)}
                          disabled={isBusy}
                          title={t("Ondoa", "Remove")}
                          className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[#C1502E] shadow-md hover:bg-white disabled:opacity-50"
                        >
                          {busy[img.id] === "delete"
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={13} />}
                        </button>
                      </div>

                      {/* Reorder (bottom) — only on hover */}
                      <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                        <button
                          onClick={() => reorder(img, "up")}
                          disabled={i === 0 || isBusy}
                          title={t("Pandisha", "Move up")}
                          className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 disabled:opacity-30"
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          onClick={() => reorder(img, "down")}
                          disabled={i === images.length - 1 || isBusy}
                          title={t("Shusha", "Move down")}
                          className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 disabled:opacity-30"
                        >
                          <ArrowDown size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New uploads */}
          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-secondary">
              {t("Ongeza Picha Mpya", "Add New Images")}
            </h3>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFilePick}
              className="hidden"
            />

            {newFiles.length === 0 ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[color:rgb(var(--c-hairline))] bg-[color:rgb(var(--c-page))] px-4 py-8 transition-colors hover:border-[color:rgb(var(--c-gold)/0.6)]"
              >
                <ImagePlus size={24} className="text-secondary" />
                <span className="text-xs font-medium text-primary">
                  {t("Bofya kuchagua picha", "Click to choose images")}
                </span>
                <span className="text-[11px] text-secondary">
                  {t("JPG, PNG au WEBP — max 5 MB kila moja", "JPG, PNG or WEBP — max 5 MB each")}
                </span>
                <span className="text-[11px] text-muted">
                  {t(`Upeo: picha ${MAX_TOTAL} kwa tangazo`, `Limit: ${MAX_TOTAL} images per listing`)}
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {newFiles.map((f, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-lg border border-[color:rgb(var(--c-hairline))]"
                    >
                      <img
                        src={URL.createObjectURL(f)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <button
                        onClick={() => removeNewFile(i)}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-[#C1502E] shadow-md hover:bg-white"
                        aria-label={t("Ondoa", "Remove")}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="rounded-lg border border-[color:rgb(var(--c-hairline))] px-3 py-2 text-xs font-semibold text-primary hover:bg-[color:rgb(var(--c-page))]"
                  >
                    {t("Ongeza zaidi", "Add more")}
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[color:rgb(var(--c-royal))] px-4 py-2 text-xs font-semibold text-white hover:bg-[color:rgb(var(--c-royal-dark))] disabled:opacity-60"
                  >
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    {uploading
                      ? t("Inapakia...", "Uploading...")
                      : t(`Pakia ${newFiles.length}`, `Upload ${newFiles.length}`)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[color:rgb(var(--c-hairline))] px-5 py-3">
          <button
            onClick={closeAll}
            disabled={uploading}
            className="rounded-lg border border-[color:rgb(var(--c-hairline))] px-4 py-2 text-xs font-semibold text-primary hover:bg-[color:rgb(var(--c-page))] disabled:opacity-50"
          >
            {t("Funga", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
