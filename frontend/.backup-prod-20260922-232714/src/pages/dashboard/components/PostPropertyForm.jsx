// ============================================================
// PostPropertyForm.jsx
// Weka Mali — inatumia listing credits kama user ana, vinginevyo cash.
// Bilingual kamili + centered + credits integration.
// ============================================================

import React, { useState } from "react";
import {
  ImagePlus,
  X,
  ChevronLeft,
  Check,
  Wallet,
} from "lucide-react";
import {
  COLORS,
  formatTZS,
  calculateListingFee,
  buildListingFromSubmission,
} from "./shared";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import {
  checkCredit,
  consumeCredit,
} from "../../../config/userCreditsStore.js";
import PaymentGateway from "./PaymentGateway";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-center">
      <span className="text-primary text-sm font-medium">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: COLORS.sand,
  borderColor: COLORS.sandLine,
  color: COLORS.night,
};

function formatPriceInput(value) {
  if (!value) return "";
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function cleanPriceInput(value) {
  return String(value).replace(/[^0-9]/g, "");
}

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
  const [photos, setPhotos] = useState([]);
  const [stage, setStage] = useState("form");
  const [createdListing, setCreatedListing] = useState(null);
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
  const categoryLabel =
    category?.label?.[lang] || category?.label?.sw || "";
  const feeInfo = calculateListingFee(categoryKey, base.price);
  const noFeeConfig = feeInfo.error === "NO_FEE_CONFIG";

  // ============================================================
  // CREDITS — angalia kama user ana listing credits
  // ============================================================
  const creditInfo = checkCredit(user?.id, "listing");
  const hasCredit = creditInfo.hasCredit;

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8 - photos.length);
    const withUrls = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setPhotos((p) => [...p, ...withUrls]);
  };

  const removePhoto = (idx) =>
    setPhotos((p) => p.filter((_, i) => i !== idx));

  const setExtraField = (key, value) =>
    setExtra((e) => ({ ...e, [key]: value }));

  const canSubmit =
    category &&
    base.title.trim() &&
    base.price.trim() &&
    base.location.trim() &&
    photos.length > 0 &&
    !noFeeConfig;

  const resetForm = () => {
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
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const listing = buildListingFromSubmission({
      categoryKey,
      base,
      extra,
      photoCount: photos.length,
    });
    onSubmit(listing);
    setCreatedListing(listing);
    setStage("review");
  };

  // ============================================================
  // USE CREDIT — tumia listing credit moja kwa moja
  // ============================================================
  const handleUseCredit = () => {
    if (!createdListing || !user) return;

    const result = consumeCredit(user.id, "listing");
    if (!result.success) {
      // Credit haitoshi — lipa kwa cash
      setStage("paying");
      return;
    }

    // Credit imetumika — endelea
    onPaid(createdListing.id);
    setStage("paid");
  };

  const handlePaymentSuccess = () => {
    onPaid(createdListing.id);
    setStage("paid");
  };

  const contactPrefOptions = [
    { value: "Simu", label: lang === "sw" ? "Simu" : "Phone" },
    { value: "WhatsApp", label: "WhatsApp" },
    {
      value: "Ujumbe wa ndani (In-app)",
      label: lang === "sw" ? "Ujumbe wa ndani (In-app)" : "In-app message",
    },
  ];

  // ============================================================
  // REVIEW / PAYING
  // ============================================================
  if (stage === "review" || stage === "paying") {
    return (
      <div
        style={{
          background: COLORS.sand,
          minHeight: "600px",
        }}
        className="w-full flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full">
          {stage === "review" && (
            <div
              style={{ borderColor: COLORS.sandLine }}
              className="text-center bg-white rounded-2xl border p-8"
            >
              <div
                style={{ background: COLORS.green }}
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check color={COLORS.sand} size={26} />
              </div>
              <h2
                className="h-title mb-2"
              >
                {t("Taarifa zimehifadhiwa", "Details Saved")}
              </h2>
              <p
                className="text-secondary text-sm mb-5"
              >
                {lang === "sw" ? (
                  <>
                    Hatua inayofuata ni kulipa Listing Fee ili "{base.title}"
                    ichapishwe na ionekane kwa wanunuzi.
                  </>
                ) : (
                  <>
                    The next step is to pay the Listing Fee so "{base.title}" is
                    published and visible to buyers.
                  </>
                )}
              </p>

              <div
                style={{
                  borderColor: COLORS.sandLine,
                  background: COLORS.sand,
                }}
                className="rounded-xl border p-4 mb-6 text-left"
              >
                <div className="flex justify-between text-body-sm mb-1.5">
                  <span className="text-secondary">
                    {t("Bei ya Mali", "Property Price")}
                  </span>
                  <span
                    className="text-primary font-medium"
                  >
                    {formatTZS(feeInfo.price)}
                  </span>
                </div>
                <div className="flex justify-between text-body-sm mb-1.5">
                  <span className="text-secondary">
                    Rate ({categoryLabel})
                  </span>
                  <span
                    className="text-primary font-medium"
                  >
                    {(feeInfo.rate * 100).toFixed(1)}%
                  </span>
                </div>
                {feeInfo.capped && (
                  <div className="flex justify-between text-body-sm mb-1.5">
                    <span style={{ color: COLORS.rust }}>
                      {feeInfo.capped === "min"
                        ? t(
                            "Fee ya chini kabisa imetumika",
                            "Minimum fee was applied"
                          )
                        : t(
                            "Fee ya juu kabisa imetumika (imekomaa)",
                            "Maximum fee was applied (capped)"
                          )}
                    </span>
                  </div>
                )}
                <div
                  style={{ borderColor: COLORS.sandLine }}
                  className="flex justify-between text-sm pt-2 mt-1 border-t font-semibold"
                >
                  <span className="text-primary">
                    {t("Ada ya Kuchapisha", "Listing Fee")}
                  </span>
                  <span style={{ color: COLORS.rust }}>
                    {formatTZS(feeInfo.fee)}
                  </span>
                </div>
              </div>

              {/* Credit info — kama ana listing credits */}
              {hasCredit && (
                <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col items-center gap-2 text-center">
                  <div className="flex items-center gap-2">
                    <Wallet size={16} color={COLORS.green} />
                    <span className="text-body-sm text-[#2F6D4F] font-medium">
                      {t(
                        `Una Listing Credits ${creditInfo.remaining} — tumia bila kulipa`,
                        `You have ${creditInfo.remaining} Listing Credits — use for free`
                      )}
                    </span>
                  </div>
                  <button
                    onClick={handleUseCredit}
                    className="w-full py-2.5 rounded-xl font-semibold text-body-sm bg-[#2F6D4F] text-white"
                  >
                    {t("Tumia Credit — Chapisha Bila Malipo", "Use Credit — Publish for Free")}
                  </button>
                </div>
              )}

              <button
                onClick={() => setStage("paying")}
                style={{ background: COLORS.gold, color: COLORS.night }}
                className="w-full py-3 rounded-xl font-semibold text-sm"
              >
                {t(
                  `Lipa ${formatTZS(feeInfo.fee)} — Endelea`,
                  `Pay ${formatTZS(feeInfo.fee)} — Continue`
                )}
              </button>
              <button
                onClick={onGoToListings}
                className="text-primary w-full py-2.5 mt-2 text-sm font-medium underline underline-offset-2"
              >
                {t("Angalia kwenye Mali Zangu", "View in My Listings")}
              </button>
            </div>
          )}

          {stage === "paying" && (
            <PaymentGateway
              amount={feeInfo.fee}
              title={t("Ada ya Kuchapisha", "Listing Fee")}
              description={t(
                `Kuchapisha "${base.title}"`,
                `Publishing "${base.title}"`
              )}
              onCancel={() => setStage("review")}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // PAID
  // ============================================================
  if (stage === "paid") {
    return (
      <div
        style={{
          background: COLORS.sand,
          minHeight: "600px",
        }}
        className="w-full flex items-center justify-center p-6"
      >
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="max-w-md w-full text-center bg-white rounded-2xl border p-8"
        >
          <div
            style={{ background: COLORS.green }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check color={COLORS.sand} size={26} />
          </div>
          <h2
            className="h-title mb-2"
          >
            {t("Imechapishwa!", "Published!")}
          </h2>
          <p className="text-secondary text-sm mb-6">
            {lang === "sw" ? (
              <>"{base.title}" sasa iko Live na inaonekana kwa wanunuzi.</>
            ) : (
              <>"{base.title}" is now Live and visible to buyers.</>
            )}
          </p>
          <button
            onClick={onGoToListings}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            {t("Angalia kwenye Mali Zangu", "View in My Listings")}
          </button>
          <button
            onClick={() => onGoToBoost(createdListing.id)}
            className="text-primary w-full py-2.5 mt-2 text-sm font-medium underline underline-offset-2"
          >
            {t("Boost Mali Hii Sasa", "Boost This Listing Now")}
          </button>
          <button
            onClick={resetForm}
            className="text-secondary w-full py-2 mt-1 text-body-sm font-medium"
          >
            {t("Weka Mali Nyingine", "Post Another Property")}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // FORM
  // ============================================================
  return (
    <div
      style={{
        background: COLORS.sand,
        minHeight: "600px",
      }}
      className="w-full p-4 sm:p-6"
    >
      <div className="max-w-2xl mx-auto">
        {category && (
          <div className="flex justify-center mb-3">
            <button
              onClick={() => setCategoryKey(null)}
              className="text-primary flex items-center gap-1 text-sm font-medium opacity-70"
            >
              <ChevronLeft size={16} />{" "}
              {t("Badilisha Category", "Change Category")}
            </button>
          </div>
        )}

        <div className="mb-6 text-center">
          <h1
            className="h-title"
          >
            {t("Weka Mali Yako", "Post Your Property")}
          </h1>
          <p
            className="text-secondary text-sm mt-2 max-w-xl mx-auto"
          >
            {category
              ? `${t("Category", "Category")}: ${categoryLabel}`
              : t(
                  "Chagua category ya mali unayotaka kuiweka",
                  "Choose the category of the property you want to list"
                )}
          </p>
        </div>

        {/* CREDITS BANNER */}
        {hasCredit && (
          <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2">
              <Wallet size={16} color={COLORS.green} />
              <span className="text-sm text-[#2F6D4F] font-medium">
                {t(
                  `Una Listing Credits ${creditInfo.remaining} — chapisha bila kulipa`,
                  `You have ${creditInfo.remaining} Listing Credits — publish for free`
                )}
              </span>
            </div>
          </div>
        )}

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
                  style={{
                    borderColor: COLORS.sandLine,
                    background: "white",
                  }}
                  className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl border hover:shadow-sm transition-shadow overflow-hidden"
                >
                  {hasPhoto ? (
                    <img
                      src={cat.imageUrl}
                      alt={catLabel}
                      className="w-full h-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      style={{ background: COLORS.night }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                    >
                      <Icon size={18} color={COLORS.gold} />
                    </div>
                  )}
                  <span
                    className="text-primary text-sm font-semibold"
                  >
                    {catLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {category && (
          <form
            onSubmit={handleFormSubmit}
            className="max-w-md mx-auto flex flex-col gap-5"
          >
            {noFeeConfig && (
              <div
                style={{
                  background: `${COLORS.rust}15`,
                  color: COLORS.rust,
                  borderColor: COLORS.rust,
                }}
                className="rounded-xl border px-4 py-3 text-body-sm font-semibold text-center"
              >
                ⚠️ {feeInfo.message}
              </div>
            )}

            <Field
              label={t(
                "Picha za Mali (angalau 1, mpaka 8)",
                "Property Photos (at least 1, up to 8)"
              )}
            >
              <div className="flex flex-wrap justify-center gap-2">
                {photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-xl overflow-hidden"
                  >
                    <img
                      src={p.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      style={{ background: COLORS.rust }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    >
                      <X size={12} color="white" />
                    </button>
                  </div>
                ))}
                {photos.length < 8 && (
                  <label
                    style={{
                      borderColor: COLORS.sandLine,
                      color: COLORS.night,
                    }}
                    className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer text-body-sm"
                  >
                    <ImagePlus size={18} />
                    {t("Ongeza", "Add")}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={handlePhotoAdd}
                    />
                  </label>
                )}
              </div>
            </Field>

            <Field label={t("Jina la Mali", "Property Title")}>
              <input
                style={inputStyle}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                placeholder={t(
                  "mfano: Nyumba ya Ghorofa Mbezi Beach",
                  "e.g. Mbezi Beach Apartment Building"
                )}
                value={base.title}
                onChange={(e) => setBase({ ...base, title: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("Bei (TZS)", "Price (TZS)")}>
                <input
                  style={inputStyle}
                  type="text"
                  inputMode="numeric"
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                  placeholder={t("mfano: 85,000,000", "e.g. 85,000,000")}
                  value={formatPriceInput(base.price)}
                  onChange={(e) =>
                    setBase({
                      ...base,
                      price: cleanPriceInput(e.target.value),
                    })
                  }
                />
                {noFeeConfig ? (
                  <span
                    style={{ color: COLORS.rust }}
                    className="text-body-sm font-semibold"
                  >
                    {t(
                      "Fee haipo — wasiliana na Admin",
                      "Fee missing — contact Admin"
                    )}
                  </span>
                ) : (
                  feeInfo.price > 0 && (
                    <span
                      className="text-secondary text-body-sm"
                    >
                      {t(
                        "Makadirio ya Listing Fee",
                        "Estimated Listing Fee"
                      )}
                      :{" "}
                      <b style={{ color: COLORS.rust }}>
                        {formatTZS(feeInfo.fee)}
                      </b>
                    </span>
                  )
                )}
              </Field>
              <Field label={t("Mahali", "Location")}>
                <input
                  style={inputStyle}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                  placeholder={t(
                    "mfano: Mbezi Beach, Dar es Salaam",
                    "e.g. Mbezi Beach, Dar es Salaam"
                  )}
                  value={base.location}
                  onChange={(e) =>
                    setBase({ ...base, location: e.target.value })
                  }
                />
              </Field>
            </div>

            {category.extra && category.extra.length > 0 && (
              <div
                style={{ borderColor: COLORS.sandLine, background: "white" }}
                className="rounded-2xl border p-4 flex flex-col gap-4"
              >
                <span
                  style={{ color: COLORS.rust }}
                  className="text-body-sm font-semibold text-center"
                >
                  {t("Taarifa za Ziada", "Additional Details")} —{" "}
                  {categoryLabel}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {category.extra.map((f) => (
                    <Field
                      key={f.key}
                      label={f.label?.[lang] || f.label?.sw}
                    >
                      {f.type === "select" ? (
                        <select
                          style={inputStyle}
                          className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                          value={extra[f.key] || ""}
                          onChange={(e) =>
                            setExtraField(f.key, e.target.value)
                          }
                        >
                          <option value="">
                            {t("Chagua...", "Choose...")}
                          </option>
                          {f.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label?.[lang] || o.label?.sw}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          style={inputStyle}
                          type={f.type}
                          className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                          placeholder={
                            f.placeholder?.[lang] || f.placeholder?.sw
                          }
                          value={extra[f.key] || ""}
                          onChange={(e) =>
                            setExtraField(f.key, e.target.value)
                          }
                        />
                      )}
                    </Field>
                  ))}
                </div>
              </div>
            )}

            <Field label={t("Maelezo", "Description")}>
              <textarea
                style={inputStyle}
                rows={4}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none resize-none text-center"
                placeholder={t(
                  "Eleza kwa ufupi kuhusu mali yako...",
                  "Briefly describe your property..."
                )}
                value={base.description}
                onChange={(e) =>
                  setBase({ ...base, description: e.target.value })
                }
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("Jina la Muuzaji", "Seller Name")}>
                <input
                  style={inputStyle}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                  placeholder={t("Jina lako", "Your name")}
                  value={base.seller_name}
                  onChange={(e) =>
                    setBase({ ...base, seller_name: e.target.value })
                  }
                />
              </Field>
              <Field label={t("Contact Preference", "Contact Preference")}>
                <select
                  style={inputStyle}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                  value={base.contact_pref}
                  onChange={(e) =>
                    setBase({ ...base, contact_pref: e.target.value })
                  }
                >
                  {contactPrefOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div
              style={{
                borderColor: COLORS.sandLine,
                background: COLORS.sandLine,
              }}
              className="rounded-xl border px-4 py-3 text-body-sm text-center"
            >
              <span className="text-primary">
                {lang === "sw" ? (
                  <>
                    Baada ya kuwasilisha, utaelekezwa kulipa{" "}
                    <b>Ada ya Kuchapisha</b> kabla mali yako haijachapishwa.
                    Fee inategemea bei uliyoweka.
                  </>
                ) : (
                  <>
                    After submitting, you'll be asked to pay the{" "}
                    <b>Listing Fee</b> before your property is published. The
                    fee depends on the price you set.
                  </>
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                background: canSubmit ? COLORS.gold : COLORS.sandLine,
                color: canSubmit ? COLORS.night : "rgba(16,26,46,0.4)",
              }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:cursor-not-allowed"
            >
              {t(
                "Wasilisha na Endelea Kulipa",
                "Submit and Continue to Payment"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
