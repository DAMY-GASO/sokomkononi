import React, { useState } from "react";
import { ImagePlus, X, ChevronLeft, Check } from "lucide-react";
import {
  COLORS,
  FONTS,
  formatTZS,
  calculateListingFee,
  buildListingFromSubmission,
} from "./shared";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../../../config/categoriesStore.js";
import PaymentGateway from "./PaymentGateway";
import { useLanguage } from "../../../context/LanguageContext.jsx";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span style={{ color: COLORS.night }} className="text-sm font-medium">
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

export default function PostPropertyForm({
  onSubmit = () => {},
  onGoToListings = () => {},
  onPaid = () => {},
  onGoToBoost = () => {},
}) {
  const { lang } = useLanguage();
  const categories = useActiveCategories();

  const [categoryKey, setCategoryKey] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [stage, setStage] = useState("form"); // form | review | paying | paid
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

  // category object kutoka store (sasa ni object yenye label: {sw,en})
  const category = categories.find((c) => c.key === categoryKey);
  const categoryLabel = category?.label?.[lang] || category?.label?.sw || "";
  const feeInfo = calculateListingFee(categoryKey, base.price);

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8 - photos.length);
    const withUrls = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...withUrls]);
  };

  const removePhoto = (idx) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const setExtraField = (key, value) => setExtra((e) => ({ ...e, [key]: value }));

  const canSubmit =
    category &&
    base.title.trim() &&
    base.price.trim() &&
    base.location.trim() &&
    photos.length > 0;

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

  if (stage === "review" || stage === "paying") {
    return (
      <div
        style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }}
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
                style={{ fontFamily: FONTS.display, color: COLORS.night }}
                className="text-2xl font-semibold mb-2"
              >
                {lang === "sw" ? "Taarifa zimehifadhiwa" : "Details Saved"}
              </h2>
              <p style={{ color: "rgba(16,26,46,0.65)" }} className="text-sm mb-5">
                {lang === "sw" ? (
                  <>
                    Hatua inayofuata ni kulipa Listing Fee ili "{base.title}" ichapishwe na ionekane
                    kwa wanunuzi.
                  </>
                ) : (
                  <>
                    The next step is to pay the Listing Fee so "{base.title}" is published and
                    visible to buyers.
                  </>
                )}
              </p>

              <div
                style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
                className="rounded-xl border p-4 mb-6 text-left"
              >
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "rgba(16,26,46,0.6)" }}>
                    {lang === "sw" ? "Bei ya Mali" : "Property Price"}
                  </span>
                  <span style={{ color: COLORS.night }} className="font-medium">
                    {formatTZS(feeInfo.price)}
                  </span>
                </div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "rgba(16,26,46,0.6)" }}>
                    Rate ({categoryLabel})
                  </span>
                  <span style={{ color: COLORS.night }} className="font-medium">
                    {(feeInfo.rate * 100).toFixed(1)}%
                  </span>
                </div>
                {feeInfo.capped && (
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: COLORS.rust }}>
                      {feeInfo.capped === "min"
                        ? lang === "sw"
                          ? "Fee ya chini kabisa imetumika"
                          : "Minimum fee was applied"
                        : lang === "sw"
                          ? "Fee ya juu kabisa imetumika (imekomaa)"
                          : "Maximum fee was applied (capped)"}
                    </span>
                  </div>
                )}
                <div
                  style={{ borderColor: COLORS.sandLine }}
                  className="flex justify-between text-sm pt-2 mt-1 border-t font-semibold"
                >
                  <span style={{ color: COLORS.night }}>Listing Fee</span>
                  <span style={{ color: COLORS.rust }}>{formatTZS(feeInfo.fee)}</span>
                </div>
              </div>

              <button
                onClick={() => setStage("paying")}
                style={{ background: COLORS.gold, color: COLORS.night }}
                className="w-full py-3 rounded-xl font-semibold text-sm"
              >
                {lang === "sw"
                  ? `Lipa ${formatTZS(feeInfo.fee)} — Endelea`
                  : `Pay ${formatTZS(feeInfo.fee)} — Continue`}
              </button>
              <button
                onClick={onGoToListings}
                style={{ color: COLORS.night }}
                className="w-full py-2.5 mt-2 text-sm font-medium underline underline-offset-2"
              >
                {lang === "sw" ? "Angalia kwenye My Listings" : "View in My Listings"}
              </button>
            </div>
          )}

          {stage === "paying" && (
            <PaymentGateway
              amount={feeInfo.fee}
              title="Listing Fee"
              description={
                lang === "sw"
                  ? `Kuchapisha "${base.title}"`
                  : `Publishing "${base.title}"`
              }
              onCancel={() => setStage("review")}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </div>
      </div>
    );
  }

  if (stage === "paid") {
    return (
      <div
        style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }}
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
            style={{ fontFamily: FONTS.display, color: COLORS.night }}
            className="text-2xl font-semibold mb-2"
          >
            {lang === "sw" ? "Imechapishwa!" : "Published!"}
          </h2>
          <p style={{ color: "rgba(16,26,46,0.65)" }} className="text-sm mb-6">
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
            {lang === "sw" ? "Angalia kwenye My Listings" : "View in My Listings"}
          </button>
          <button
            onClick={() => onGoToBoost(createdListing.id)}
            style={{ color: COLORS.night }}
            className="w-full py-2.5 mt-2 text-sm font-medium underline underline-offset-2"
          >
            {lang === "sw" ? "Boost Mali Hii Sasa" : "Boost This Listing Now"}
          </button>
          <button
            onClick={resetForm}
            style={{ color: "rgba(16,26,46,0.55)" }}
            className="w-full py-2 mt-1 text-xs font-medium"
          >
            {lang === "sw" ? "Weka Mali Nyingine" : "Post Another Property"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }}
      className="w-full p-4 sm:p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-2xl mx-auto">
        {category && (
          <button
            onClick={() => setCategoryKey(null)}
            style={{ color: COLORS.night }}
            className="flex items-center gap-1 text-sm font-medium mb-3 opacity-70"
          >
            <ChevronLeft size={16} />{" "}
            {lang === "sw" ? "Badilisha Category" : "Change Category"}
          </button>
        )}

        <h1
          style={{ fontFamily: FONTS.display, color: COLORS.night }}
          className="text-2xl sm:text-3xl font-semibold mb-1"
        >
          {lang === "sw" ? "Weka Mali Yako" : "Post Your Property"}
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-6">
          {category
            ? `${lang === "sw" ? "Category" : "Category"}: ${categoryLabel}`
            : lang === "sw"
              ? "Chagua category ya mali unayotaka kuiweka"
              : "Choose the category of the property you want to list"}
        </p>

        {!category && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map(({ key, label, iconKey }) => {
              const Icon = getCategoryIcon(iconKey);
              return (
                <button
                  key={key}
                  onClick={() => setCategoryKey(key)}
                  style={{ borderColor: COLORS.sandLine, background: "white" }}
                  className="flex flex-col items-start gap-3 p-4 rounded-2xl border text-left hover:shadow-sm transition-shadow"
                >
                  <div
                    style={{ background: COLORS.night }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                  >
                    <Icon size={18} color={COLORS.gold} />
                  </div>
                  <span style={{ color: COLORS.night }} className="text-sm font-semibold">
                    {label[lang] || label.sw}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {category && (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
            {/* Photos */}
            <Field
              label={
                lang === "sw"
                  ? "Picha za Mali (angalau 1, mpaka 8)"
                  : "Property Photos (at least 1, up to 8)"
              }
            >
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
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
                    style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
                    className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer text-xs"
                  >
                    <ImagePlus size={18} />
                    {lang === "sw" ? "Ongeza" : "Add"}
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

            <Field label={lang === "sw" ? "Jina la Mali" : "Property Title"}>
              <input
                style={inputStyle}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                placeholder={
                  lang === "sw"
                    ? "mfano: Nyumba ya Ghorofa Mbezi Beach"
                    : "e.g. Mbezi Beach Apartment Building"
                }
                value={base.title}
                onChange={(e) => setBase({ ...base, title: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={lang === "sw" ? "Bei (TZS)" : "Price (TZS)"}>
                <input
                  style={inputStyle}
                  type="text"
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                  placeholder={lang === "sw" ? "mfano: 85,000,000" : "e.g. 85,000,000"}
                  value={base.price}
                  onChange={(e) => setBase({ ...base, price: e.target.value })}
                />
                {feeInfo.price > 0 && (
                  <span style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs">
                    {lang === "sw" ? "Makadirio ya Listing Fee" : "Estimated Listing Fee"}:{" "}
                    <b style={{ color: COLORS.rust }}>{formatTZS(feeInfo.fee)}</b>
                  </span>
                )}
              </Field>
              <Field label={lang === "sw" ? "Mahali" : "Location"}>
                <input
                  style={inputStyle}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                  placeholder={
                    lang === "sw"
                      ? "mfano: Mbezi Beach, Dar es Salaam"
                      : "e.g. Mbezi Beach, Dar es Salaam"
                  }
                  value={base.location}
                  onChange={(e) => setBase({ ...base, location: e.target.value })}
                />
              </Field>
            </div>

            {/* Category-specific fields — extra[] kutoka category */}
            {category.extra && category.extra.length > 0 && (
              <div
                style={{ borderColor: COLORS.sandLine, background: "white" }}
                className="rounded-2xl border p-4 flex flex-col gap-4"
              >
                <span style={{ color: COLORS.rust }} className="text-xs font-semibold">
                  {lang === "sw" ? "Taarifa za Ziada" : "Additional Details"} — {categoryLabel}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {category.extra.map((f) => (
                    <Field key={f.key} label={f.label}>
                      {f.type === "select" ? (
                        <select
                          style={inputStyle}
                          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                          value={extra[f.key] || ""}
                          onChange={(e) => setExtraField(f.key, e.target.value)}
                        >
                          <option value="">{lang === "sw" ? "Chagua..." : "Choose..."}</option>
                          {f.options.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          style={inputStyle}
                          type={f.type}
                          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                          placeholder={f.placeholder}
                          value={extra[f.key] || ""}
                          onChange={(e) => setExtraField(f.key, e.target.value)}
                        />
                      )}
                    </Field>
                  ))}
                </div>
              </div>
            )}

            <Field label={lang === "sw" ? "Maelezo" : "Description"}>
              <textarea
                style={inputStyle}
                rows={4}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none resize-none"
                placeholder={
                  lang === "sw"
                    ? "Eleza kwa ufupi kuhusu mali yako..."
                    : "Briefly describe your property..."
                }
                value={base.description}
                onChange={(e) => setBase({ ...base, description: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={lang === "sw" ? "Jina la Muuzaji" : "Seller Name"}>
                <input
                  style={inputStyle}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                  placeholder={lang === "sw" ? "Jina lako" : "Your name"}
                  value={base.seller_name}
                  onChange={(e) => setBase({ ...base, seller_name: e.target.value })}
                />
              </Field>
              <Field label={lang === "sw" ? "Contact Preference" : "Contact Preference"}>
                <select
                  style={inputStyle}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                  value={base.contact_pref}
                  onChange={(e) => setBase({ ...base, contact_pref: e.target.value })}
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
              style={{ borderColor: COLORS.sandLine, background: COLORS.sandLine }}
              className="rounded-xl border px-4 py-3 text-xs"
            >
              <span style={{ color: COLORS.night }}>
                {lang === "sw" ? (
                  <>
                    Baada ya kuwasilisha, utaelekezwa kulipa <b>Listing Fee</b> kabla mali yako
                    haijachapishwa. Fee inategemea bei uliyoweka.
                  </>
                ) : (
                  <>
                    After submitting, you'll be asked to pay the <b>Listing Fee</b> before your
                    property is published. The fee depends on the price you set.
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
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-colors"
            >
              {lang === "sw"
                ? "Wasilisha na Endelea Kulipa"
                : "Submit and Continue to Payment"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
