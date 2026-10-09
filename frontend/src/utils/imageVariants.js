// ============================================================
// imageVariants.js — pick the best WebP variant for a context.
//
// Backend `ListingImage` now returns:
//   { image_url, thumb, card, detail, large, ... }
// Each variant is an absolute URL (R2/CDN) or null.
// ============================================================

export const VARIANTS = ["thumb", "card", "detail", "large", "original"];

// Map a semantic context to a preferred variant.
export const CONTEXT_VARIANT = {
  // Dashboard thumbnails, admin lists, chat avatars
  thumb: "thumb",
  // Grid card in browse / homepage
  card: "card",
  // Detail page hero
  detail: "detail",
  // Fullscreen lightbox
  large: "large",
  // Original (legacy fallback)
  original: "original",
};

function urlOf(img) {
  if (!img) return null;
  if (typeof img === "string") return img;
  return img.image_url || img.url || img.image || img.src || null;
}

/**
 * Return the best URL + optional srcset/sizes for a listing image.
 *
 * @param {object|string} img — one image entry from `photos`
 * @param {string} context — "thumb" | "card" | "detail" | "large"
 * @returns {{ src: string, srcSet: string, sizes: string }}
 */
export function pickVariant(img, context = "card") {
  if (!img) return { src: "", srcSet: "", sizes: "" };

  if (typeof img === "string") {
    return { src: img, srcSet: "", sizes: "" };
  }

  // Original
  const original = urlOf(img);

  // Gather all available variants
  const variants = {
    thumb:  img.thumb  || null,
    card:   img.card   || null,
    detail: img.detail || null,
    large:  img.large  || null,
  };

  const order = ["thumb", "card", "detail", "large"];
  const requested = CONTEXT_VARIANT[context] || "card";
  const requestedIdx = order.indexOf(requested);

  // Find requested variant, or step up to next available, or original.
  let chosen = variants[requested];
  if (!chosen) {
    for (let i = requestedIdx + 1; i < order.length; i++) {
      if (variants[order[i]]) { chosen = variants[order[i]]; break; }
    }
  }
  if (!chosen) chosen = original;

  // Build srcSet from all available variants
  const srcSet = order
    .filter((k) => variants[k])
    .map((k) => {
      const w = { thumb: 200, card: 400, detail: 800, large: 1200 }[k];
      return `${variants[k]} ${w}w`;
    })
    .join(", ");

  // Hint to the browser how wide the image will render
  const sizes =
    context === "thumb"
      ? "96px"
      : context === "card"
        ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
        : context === "detail"
          ? "(max-width: 768px) 100vw, 640px"
          : "100vw";

  return { src: chosen || original || "", srcSet, sizes };
}

/** Return just the URL string — for cases where you don't need srcset. */
export function pickVariantUrl(img, context = "card") {
  return pickVariant(img, context).src || null;
}
