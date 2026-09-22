// ============================================================
// PostPropertyForm.jsx (production)
// 1. POST /listings/              → creates DRAFT listing
// 2. POST /listings/{id}/images/  → uploads images (one by one)
// 3. POST /listings/{id}/{kind}-details/   → category-specific details
// 4. POST /listings/{id}/fee/pay/ → pays fee (moves listing to PENDING_APPROVAL)
// ============================================================
import React, { useState } from "react";
import { ImagePlus, X, ChevronLeft, Check, Loader2, AlertTriangle, Wallet } from "lucide-react";
import { COLORS, formatTZS } from "./shared";
import { useActiveCategories, getCategoryIcon, getCategoryIdByKey } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { checkCredit, consumeCredit } from "../../../config/userCreditsStore.js";
import { api } from "../../../api/client.js";
import PaymentGateway from "./PaymentGateway";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-center">
      <span className="text-primary text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

const inputStyle = { background: COLORS.sand, borderColor: COLORS.sandLine, color: COLORS.night };

function formatPriceInput(v) {
  if (!v) return "";
  const d = String(v).replace(/[^0-9]/g, "");
  if (!d) return "";
  return Number(d).toLocaleString("en-US");
}
function cleanPriceInput(v) { return String(v).replace(/[^0-9]/g, ""); }

const CATEGORY_DETAIL_ENDPOINT = {
  nyumba: "property-details",
  viwanja: "land-details",
  magari: "vehicle-details",
  biashara: "business-details",
  mashine: "equipment-details",
};

export default function PostPropertyForm({
  onSubmit = () => {},
  onGoToListings = () => {},
  onPaid = () => {},
  onGoToBoost = () => {},
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const categories = useActiveCategories();

  const [categoryKey, setCategoryKey] = useState(null);
  const [photos, setPhotos] = useState([]); // [{file, url}]
  const [stage, setStage] = useState("form"); // form | paying | done
  const [createdListing, setCreatedListing] = useState(null);
  const [feeAmount, setFeeAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [base, setBase] = useState({
    title: "",
    price: "",
    location: "",
    description: "",
    seller_name: "",
    contact_pref: lang === "sw" ? "Simu" : "Phone",
  });
  const [extra, setExtra] = useState({});

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const category = categories.find((c) => c.key === categoryKey);
  const categoryLabel = category?.label?.[lang] || category?.label?.sw || "";

  const creditInfo = checkCredit(user?.id, "listing");
  const hasCredit = creditInfo.hasCredit;

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8 - photos.length);
    const withUrls = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...withUrls]);
  };
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));
  const setExtraField = (k, v) => setExtra((e) => ({ ...e, [k]: v }));

  const canSubmit =
    category &&
    base.title.trim() &&
    base.price.trim() &&
    base.location.trim() &&
    photos.length > 0 &&
    !submitting;

  const reset = () => {
    setStage("form");
    setCreatedListing(null);
    setCategoryKey(null);
    setPhotos([]);
    setBase({
      title: "",
      price: "",
      location: "",
      description: "",
      seller_name: "",
      contact_pref: lang === "sw" ? "Simu" : "Phone",
    });
    setExtra({});
    setError("");
    setFeeAmount(0);
  };

  // ── Step 1: create the listing on backend ────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    const categoryId = getCategoryIdByKey(categoryKey);
    if (!categoryId) {
      setError(t("Category haina backend id. Hydrate kwanza.", "Category has no backend id. Hydrate first."));
      setSubmitting(false);
      return;
    }

    try {
      // 1. Create listing (DRAFT)
      const created = await api.post("/listings/", {
        category_id: categoryId,
        title: base.title.trim(),
        description: base.description.trim(),
        price: Number(cleanPriceInput(base.price)),
        location: base.location.trim(),
      });

      // ⚠️ Backend contract note: POST /listings/ returns ListingWrite
      // which has NO `id`. We must resolve the new listing id by fetching
      // our own newest listings and matching by title.
      let listingId =
        created?.id ?? created?.pk ?? created?.listing_id ?? created?.listingId;

      if (!listingId) {
        try {
          const me = await api.get("/auth/me/");
          const mine = await api.get(
            `/listings/?seller=${me.id}&ordering=-created_at&page_size=10`
          );
          const list = Array.isArray(mine) ? mine : mine?.results || [];
          const match = list.find((l) => l.title === base.title.trim());
          listingId = match?.id;
        } catch (lookupErr) {
          console.warn("[PostPropertyForm] id lookup failed:", lookupErr);
        }
      }

      if (!listingId) {
        throw new Error(
          t(
            "Backend haikurudisha listing id na hatukuweza kuipata. Wasiliana na support.",
            "Backend did not return a listing id and we couldn't resolve it. Contact support."
          )
        );
      }

      // Ensure downstream calls have the id
      created.id = listingId;

      // 2. Upload images sequentially (multipart)
      for (const p of photos) {
        const fd = new FormData();
        fd.append("image", p.file);
        fd.append("is_primary", photos.indexOf(p) === 0 ? "true" : "false");
        fd.append("ordering", String(photos.indexOf(p)));
        // eslint-disable-next-line no-await-in-loop
        await api.upload(`/listings/${listingId}/images/`, fd);
      }

      // 3. Category details
      const detailEndpoint = CATEGORY_DETAIL_ENDPOINT[categoryKey];
      if (detailEndpoint) {
        const detailBody = {};
        // Map the seedCategories fields to backend serializer fields
        if (categoryKey === "nyumba") {
          if (extra.vyumba) detailBody.bedrooms = Number(extra.vyumba);
          if (extra.bafu) detailBody.bathrooms = Number(extra.bafu);
          if (extra.ukubwa) detailBody.area_sqm = String(extra.ukubwa);
          detailBody.property_type = "HOUSE";
        } else if (categoryKey === "viwanja") {
          if (extra.ukubwa) detailBody.size = "0";
          detailBody.size_unit = "SQM";
          detailBody.region = base.location.split(",").slice(-1)[0]?.trim() || "Dar es Salaam";
          detailBody.land_type = "PLOT";
        } else if (categoryKey === "magari") {
          if (extra.make_model) {
            const parts = String(extra.make_model).trim().split(/\s+/);
            detailBody.make = parts[0] || "";
            detailBody.model = parts.slice(1).join(" ") || "";
          }
          if (extra.mileage) detailBody.mileage_km = Number(extra.mileage);
          detailBody.vehicle_type = "CAR";
          detailBody.fuel_type = "PETROL";
          detailBody.transmission = "AUTOMATIC";
        } else if (categoryKey === "biashara") {
          detailBody.business_type = extra.aina || "General";
        } else if (categoryKey === "mashine") {
          detailBody.equipment_type = extra.aina || "General";
          if (extra.hours) detailBody.operating_hours = Number(extra.hours);
          detailBody.condition = "USED";
        }
        try {
          await api.post(`/listings/${listingId}/${detailEndpoint}/`, detailBody);
        } catch (detailErr) {
          // Non-fatal — listing is already created. Warn user.
          console.warn("[PostPropertyForm] detail submit failed:", detailErr);
        }
      }

      // 4. Fetch fee (created by backend automatically)
      let fee = 0;
      try {
        const feeRes = await api.get(`/listings/${listingId}/fee/`);
        fee = Number(feeRes.amount) || 0;
      } catch (feeErr) {
        console.warn("[PostPropertyForm] fee fetch failed:", feeErr);
      }

      setCreatedListing(created);
      setFeeAmount(fee);
      setStage("review");
      onSubmit?.(created);
    } catch (err) {
      setError(
        err?.data?.detail ||
          (err?.data && typeof err.data === "object"
            ? Object.values(err.data).flat().find((v) => typeof v === "string")
            : null) ||
          err?.message ||
          t("Imeshindwa kuweka listing.", "Failed to create listing.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 4: Pay the listing fee ──────────────────────────
  const handleFeeSubmit = async ({ reference }) => {
    if (!createdListing) return { ok: false, error: new Error("no listing") };
    try {
      await api.post(`/listings/${createdListing.id}/fee/pay/`, {
        payment_reference: reference || "manual",
      });
      onPaid?.(createdListing.id);
      setStage("done");
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  const handleUseCredit = async () => {
    if (!createdListing || !user) return;
    const consume = consumeCredit(user.id, "listing");
    if (!consume.success) {
      setStage("paying");
      return;
    }
    // Backend will treat "credits" reference as a credit-based payment
    try {
      await api.post(`/listings/${createdListing.id}/fee/pay/`, {
        payment_reference: "credits",
      });
      onPaid?.(createdListing.id);
      setStage("done");
    } catch (err) {
      setError(err?.data?.detail || err?.message || t("Imeshindwa kutumia credit.", "Failed to use credit."));
    }
  };

  // ── Review stage ─────────────────────────────────────────
  if (stage === "review" || stage === "paying") {
    return (
      <div className="w-full flex items-center justify-center p-6" style={{ background: COLORS.sand, minHeight: "600px" }}>
        <div className="max-w-md w-full">
          {stage === "review" && (
            <div className="text-center bg-white rounded-2xl border p-8" style={{ borderColor: COLORS.sandLine }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: COLORS.green }}>
                <Check color={COLORS.sand} size={26} />
              </div>
              <h2 className="h-title mb-2">{t("Listing imeundwa", "Listing Created")}</h2>
              <p className="text-secondary text-sm mb-5">
                {t(
                  "Lipa ada ili listing ichapishwe na kuanza kuonekana kwa wanunuzi.",
                  "Pay the fee so the listing is published and visible to buyers."
                )}
              </p>
              <div className="rounded-xl border p-4 mb-6" style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">{t("Ada ya Kuchapisha", "Listing Fee")}</span>
                  <span className="font-bold" style={{ color: COLORS.rust }}>
                    {formatTZS(feeAmount)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-lg px-3 py-2 mb-3 text-xs" style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}>
                  <AlertTriangle size={12} className="inline mr-1" />
                  {error}
                </div>
              )}

              {hasCredit && (
                <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col items-center gap-2 text-center">
                  <div className="flex items-center gap-2">
                    <Wallet size={16} color={COLORS.green} />
                    <span className="text-body-sm text-[#2F6D4F] font-medium">
                      {t(`Una Listing Credits ${creditInfo.remaining}`, `You have ${creditInfo.remaining} Listing Credits`)}
                    </span>
                  </div>
                  <button
                    onClick={handleUseCredit}
                    className="w-full py-2.5 rounded-xl font-semibold text-body-sm bg-[#2F6D4F] text-white"
                  >
                    {t("Tumia Credit", "Use Credit")}
                  </button>
                </div>
              )}

              <button
                onClick={() => setStage("paying")}
                style={{ background: COLORS.gold, color: COLORS.night }}
                className="w-full py-3 rounded-xl font-semibold text-sm"
              >
                {t(`Lipa ${formatTZS(feeAmount)}`, `Pay ${formatTZS(feeAmount)}`)}
              </button>
              <button
                onClick={onGoToListings}
                className="w-full py-2.5 mt-2 text-sm font-medium underline underline-offset-2"
              >
                {t("Angalia kwenye Mali Zangu", "View in My Listings")}
              </button>
            </div>
          )}

          {stage === "paying" && (
            <PaymentGateway
              amount={feeAmount}
              title={t("Ada ya Kuchapisha", "Listing Fee")}
              description={t(`Kuchapisha "${base.title}"`, `Publishing "${base.title}"`)}
              requireReference
              onSubmit={handleFeeSubmit}
              onCancel={() => setStage("review")}
            />
          )}
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="w-full flex items-center justify-center p-6" style={{ background: COLORS.sand, minHeight: "600px" }}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl border p-8" style={{ borderColor: COLORS.sandLine }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: COLORS.green }}>
            <Check color={COLORS.sand} size={26} />
          </div>
          <h2 className="h-title mb-2">{t("Listing imewasilishwa!", "Listing Submitted!")}</h2>
          <p className="text-secondary text-sm mb-6">
            {t(
              "Listing yako inasubiri idhini ya Admin. Utapata taarifa mara itakapoidhinishwa.",
              "Your listing awaits admin approval. You'll be notified once it's approved."
            )}
          </p>
          <button
            onClick={onGoToListings}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            {t("Nenda kwenye Mali Zangu", "Go to My Listings")}
          </button>
          <button onClick={reset} className="w-full py-2 mt-2 text-body-sm font-medium">
            {t("Weka Mali Nyingine", "Post Another Property")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.sand, minHeight: "600px" }} className="w-full p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm"
               style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {category && (
          <div className="flex justify-center mb-3">
            <button onClick={() => setCategoryKey(null)} className="text-primary flex items-center gap-1 text-sm font-medium opacity-70">
              <ChevronLeft size={16} /> {t("Badilisha Category", "Change Category")}
            </button>
          </div>
        )}

        <div className="mb-6 text-center">
          <h1 className="h-title">{t("Weka Mali Yako", "Post Your Property")}</h1>
          <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
            {category
              ? `${t("Category", "Category")}: ${categoryLabel}`
              : t("Chagua category ya mali unayotaka kuiweka", "Choose the category of the property you want to list")}
          </p>
        </div>

        {!category && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.iconKey);
              const hasPhoto = Boolean(cat.imageUrl);
              const catLabel = cat.label?.[lang] || cat.label?.sw;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategoryKey(cat.key)}
                  style={{ borderColor: COLORS.sandLine, background: "white" }}
                  className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl border hover:shadow-sm transition-shadow overflow-hidden"
                >
                  {hasPhoto ? (
                    <img src={cat.imageUrl} alt={catLabel} className="w-full h-20 rounded-xl object-cover" />
                  ) : (
                    <div style={{ background: COLORS.night }} className="w-10 h-10 rounded-xl flex items-center justify-center">
                      <Icon size={18} color={COLORS.gold} />
                    </div>
                  )}
                  <span className="text-primary text-sm font-semibold">{catLabel}</span>
                </button>
              );
            })}
          </div>
        )}

        {category && (
          <form onSubmit={handleFormSubmit} className="max-w-md mx-auto flex flex-col gap-5">
            <Field label={t("Picha za Mali (angalau 1, mpaka 8)", "Property Photos (at least 1, up to 8)")}>
              <div className="flex flex-wrap justify-center gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} style={{ background: COLORS.rust }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center">
                      <X size={12} color="white" />
                    </button>
                  </div>
                ))}
                {photos.length < 8 && (
                  <label style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
                         className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer text-body-sm">
                    <ImagePlus size={18} />
                    {t("Ongeza", "Add")}
                    <input type="file" accept="image/*" multiple hidden onChange={handlePhotoAdd} />
                  </label>
                )}
              </div>
            </Field>

            <Field label={t("Jina la Mali", "Property Title")}>
              <input style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                     placeholder={t("mfano: Nyumba ya Ghorofa Mbezi Beach", "e.g. Mbezi Beach Apartment Building")}
                     value={base.title} onChange={(e) => setBase({ ...base, title: e.target.value })} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("Bei (TZS)", "Price (TZS)")}>
                <input style={inputStyle} type="text" inputMode="numeric"
                       className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                       placeholder={t("mfano: 85,000,000", "e.g. 85,000,000")}
                       value={formatPriceInput(base.price)}
                       onChange={(e) => setBase({ ...base, price: cleanPriceInput(e.target.value) })} />
              </Field>
              <Field label={t("Mahali", "Location")}>
                <input style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                       placeholder={t("mfano: Mbezi Beach, Dar es Salaam", "e.g. Mbezi Beach, Dar es Salaam")}
                       value={base.location} onChange={(e) => setBase({ ...base, location: e.target.value })} />
              </Field>
            </div>

            {category.extra && category.extra.length > 0 && (
              <div style={{ borderColor: COLORS.sandLine, background: "white" }}
                   className="rounded-2xl border p-4 flex flex-col gap-4">
                <span style={{ color: COLORS.rust }} className="text-body-sm font-semibold text-center">
                  {t("Taarifa za Ziada", "Additional Details")} — {categoryLabel}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {category.extra.map((f) => (
                    <Field key={f.key} label={f.label?.[lang] || f.label?.sw}>
                      {f.type === "select" ? (
                        <select style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                                value={extra[f.key] || ""} onChange={(e) => setExtraField(f.key, e.target.value)}>
                          <option value="">{t("Chagua...", "Choose...")}</option>
                          {f.options?.map((o) => (
                            <option key={o.value} value={o.value}>{o.label?.[lang] || o.label?.sw}</option>
                          ))}
                        </select>
                      ) : (
                        <input style={inputStyle} type={f.type} className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                               placeholder={f.placeholder?.[lang] || f.placeholder?.sw}
                               value={extra[f.key] || ""} onChange={(e) => setExtraField(f.key, e.target.value)} />
                      )}
                    </Field>
                  ))}
                </div>
              </div>
            )}

            <Field label={t("Maelezo", "Description")}>
              <textarea style={inputStyle} rows={4} className="rounded-xl border px-3 py-2.5 text-sm outline-none resize-none text-center"
                        placeholder={t("Eleza kwa ufupi kuhusu mali yako...", "Briefly describe your property...")}
                        value={base.description} onChange={(e) => setBase({ ...base, description: e.target.value })} />
            </Field>

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                background: canSubmit ? COLORS.gold : COLORS.sandLine,
                color: canSubmit ? COLORS.night : "rgba(16,26,46,0.4)",
              }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 size={16} className="animate-spin" /> {t("Inawasilisha...", "Submitting...")}</> : t("Wasilisha", "Submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
