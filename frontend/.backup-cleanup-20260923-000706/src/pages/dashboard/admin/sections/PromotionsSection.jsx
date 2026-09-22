// ============================================================
// PromotionsSection.jsx
// Admin — Promotions Dashboard (boosted, featured, leading,
// advertised, campaigns).
// Bilingual + mobile-responsive + Async campaign actions.
// ============================================================

import React, { useState } from "react";
import {
  Rocket,
  TrendingUp,
  Megaphone,
  DollarSign,
  Plus,
  Trash2,
  Pencil,
  Save,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "../shared/constants.js";
import { getCategory, getCategoryIcon } from "../../../../config/categoriesStore.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: tumia async variants kwa campaigns
import {
  usePromotions,
  addCampaignAsync,
  updateCampaignAsync,
  removeCampaignAsync,
} from "../../../../config/promotionsStore.js";

// ============================================================
// PROMOTION TYPE CONFIG
// ============================================================
const PROMO_TYPES = {
  boost: {
    label: { sw: "Boost", en: "Boost" },
    icon: Rocket,
    color: COLORS.gold,
    bg: "rgba(232,163,61,0.16)",
  },
  leading: {
    label: { sw: "Leading", en: "Leading" },
    icon: TrendingUp,
    color: COLORS.green,
    bg: "rgba(47,109,79,0.14)",
  },
  advertise: {
    label: { sw: "Tangazo", en: "Advertisement" },
    icon: Megaphone,
    color: COLORS.rust,
    bg: "rgba(193,80,46,0.14)",
  },
};

// ============================================================
// PROMOTION CARD
// ============================================================
function PromotionCard({ listing, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const type = PROMO_TYPES[listing.promotionType] || PROMO_TYPES.boost;
  const Icon = type.icon;

  const category = getCategory(listing.category);
  const CatIcon = getCategoryIcon(category?.iconKey);
  const catLabel = category?.label?.[lang] || category?.label?.sw || listing.category;

  const isUrgent = listing.daysRemaining <= 2;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 w-full max-w-full min-w-0 overflow-hidden"
    >
      <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
        <div
          style={{ background: type.bg }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
        >
          <Icon size={15} color={type.color} />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              style={{ background: type.bg, color: type.color }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
            >
              {type.label?.[lang] || type.label?.sw}
            </span>
            {isUrgent && (
              <span
                style={{
                  background: "rgba(193,80,46,0.14)",
                  color: COLORS.rust,
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {t("Inaisha Hivi Karibuni", "Expiring Soon")}
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-primary truncate w-full">
            {listing.title}
          </p>

          <div className="flex items-center gap-2 text-xs text-secondary mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 min-w-0">
              <CatIcon size={11} className="shrink-0" />
              <span className="truncate">{catLabel}</span>
            </span>
            <span className="text-muted shrink-0">•</span>
            <span className="shrink-0">{formatTZS(listing.price)}</span>
          </div>

          <p className="text-[11px] text-muted mt-1 truncate w-full">
            {t("Muuzaji", "Seller")}: {listing.seller_name || listing.seller || "—"}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p
            style={{
              color: isUrgent ? COLORS.rust : "var(--text-primary)",
            }}
            className="text-sm font-bold"
          >
            {listing.daysRemaining}d
          </p>
          <p className="text-[10px] text-muted whitespace-nowrap">
            {t("zimebaki", "remaining")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CAMPAIGN CARD
// ============================================================
function CampaignCard({ campaign, lang, onEdit, onRemove, isBusy }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const now = Date.now();
  const start = new Date(campaign.startDate).getTime();
  const end = new Date(campaign.endDate).getTime();
  const isActive = campaign.active && now >= start && now <= end;
  const isUpcoming = campaign.active && now < start;
  const isExpired = now > end;

  const status = isActive
    ? { label: t("Inaendelea", "Active"), color: COLORS.green }
    : isUpcoming
      ? { label: t("Inakuja", "Upcoming"), color: COLORS.gold }
      : isExpired
        ? { label: t("Imeisha", "Expired"), color: COLORS.rust }
        : { label: t("Imezimwa", "Inactive"), color: COLORS.night };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 w-full max-w-full min-w-0 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 w-full min-w-0">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div
            style={{ background: "rgba(232,163,61,0.16)" }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <Sparkles size={15} color="#8A5A16" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                style={{ background: `${status.color}15`, color: status.color }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {status.label}
              </span>
              {campaign.discountPercent > 0 && (
                <span
                  style={{
                    background: "rgba(193,80,46,0.14)",
                    color: COLORS.rust,
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                >
                  -{campaign.discountPercent}%
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-primary truncate w-full">
              {campaign.name?.[lang] || campaign.name?.sw}
            </p>
            {campaign.description?.[lang] && (
              <p className="text-xs text-secondary mt-0.5 line-clamp-2 break-words">
                {campaign.description[lang]}
              </p>
            )}
            <p className="text-[11px] text-muted mt-1 flex items-center gap-1 flex-wrap w-full">
              <Calendar size={10} className="shrink-0" />
              <span className="truncate">
                {new Date(campaign.startDate).toLocaleDateString(
                  lang === "sw" ? "sw-TZ" : "en-US"
                )}{" "}
                →{" "}
                {new Date(campaign.endDate).toLocaleDateString(
                  lang === "sw" ? "sw-TZ" : "en-US"
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(campaign)}
            disabled={isBusy}
            className="p-1.5 text-muted hover:text-[#E8A33D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("Hariri", "Edit")}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onRemove(campaign)}
            disabled={isBusy}
            className="p-1.5 text-muted hover:text-[#C1502E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("Ondoa", "Remove")}
          >
            {isBusy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CAMPAIGN FORM
// ============================================================
function CampaignForm({ initial, onSave, onCancel, lang, saving }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [form, setForm] = useState({
    name: { sw: "", en: "" },
    description: { sw: "", en: "" },
    discountPercent: 0,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    active: true,
    ...initial,
  });

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3 w-full max-w-full min-w-0 overflow-hidden"
    >
      {/* Name bilingual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Jina (SW)", "Name (SW)")}
          </span>
          <input
            value={form.name?.sw || ""}
            onChange={(e) =>
              setForm({ ...form, name: { ...form.name, sw: e.target.value } })
            }
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Jina (EN)", "Name (EN)")}
          </span>
          <input
            value={form.name?.en || ""}
            onChange={(e) =>
              setForm({ ...form, name: { ...form.name, en: e.target.value } })
            }
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </label>
      </div>

      {/* Description bilingual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Maelezo (SW)", "Description (SW)")}
          </span>
          <textarea
            value={form.description?.sw || ""}
            onChange={(e) =>
              setForm({
                ...form,
                description: { ...form.description, sw: e.target.value },
              })
            }
            rows={2}
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] resize-none disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Maelezo (EN)", "Description (EN)")}
          </span>
          <textarea
            value={form.description?.en || ""}
            onChange={(e) =>
              setForm({
                ...form,
                description: { ...form.description, en: e.target.value },
              })
            }
            rows={2}
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] resize-none disabled:opacity-50"
          />
        </label>
      </div>

      {/* Discount + Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full min-w-0">
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Punguzo (%)", "Discount (%)")}
          </span>
          <input
            type="number"
            min={0}
            max={100}
            value={form.discountPercent}
            onChange={(e) =>
              setForm({
                ...form,
                discountPercent: Number(e.target.value) || 0,
              })
            }
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Tarehe ya Kuanza", "Start Date")}
          </span>
          <input
            type="date"
            value={form.startDate?.slice(0, 10) || ""}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Tarehe ya Mwisho", "End Date")}
          </span>
          <input
            type="date"
            value={form.endDate?.slice(0, 10) || ""}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />
        </label>
      </div>

      {/* Active */}
      <label className="flex items-center gap-2 cursor-pointer w-full min-w-0">
        <input
          type="checkbox"
          checked={form.active !== false}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
          disabled={saving}
          className="w-4 h-4 rounded text-[#E8A33D] shrink-0"
        />
        <span className="text-xs text-secondary">
          {t("Kampeni hai", "Active campaign")}
        </span>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-secondary shrink-0 disabled:opacity-50"
        >
          {t("Ghairi", "Cancel")}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          {t("Hifadhi", "Save")}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN SECTION
// ============================================================
export default function PromotionsSection() {
  const { lang } = useLanguage();
  const promotions = usePromotions(lang);
  const [activeTab, setActiveTab] = useState("boosted");
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [addingCampaign, setAddingCampaign] = useState(false);
  // ⬇️ MPYA: busy + error
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // HANDLERS — async + rollback
  // ============================================================
  const handleAddCampaign = async (form) => {
    if (busy.campaignSave) return;

    setBusy((b) => ({ ...b, campaignSave: true }));
    setError("");

    const res = await addCampaignAsync(form);
    setBusy((b) => {
      const next = { ...b };
      delete next.campaignSave;
      return next;
    });

    if (res.ok) {
      setAddingCampaign(false);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuongeza kampeni.", "Failed to add campaign.")
      );
    }
  };

  const handleUpdateCampaign = async (id, form) => {
    if (busy.campaignSave) return;

    setBusy((b) => ({ ...b, campaignSave: true }));
    setError("");

    const res = await updateCampaignAsync(id, form);
    setBusy((b) => {
      const next = { ...b };
      delete next.campaignSave;
      return next;
    });

    if (res.ok) {
      setEditingCampaign(null);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi kampeni.", "Failed to save campaign.")
      );
    }
  };

  const handleRemoveCampaign = async (campaign) => {
    if (
      !window.confirm(
        t("Ondoa kampeni?", "Remove campaign?")
      )
    )
      return;

    if (busy[`campaign-${campaign.id}`]) return;

    setBusy((b) => ({ ...b, [`campaign-${campaign.id}`]: true }));
    setError("");

    const res = await removeCampaignAsync(campaign.id);
    setBusy((b) => {
      const next = { ...b };
      delete next[`campaign-${campaign.id}`];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa kampeni.", "Failed to remove campaign.")
      );
    }
  };

  const TABS = [
    {
      key: "boosted",
      label: t("Boost", "Boost"),
      icon: Rocket,
      count: promotions.counts.boosted,
    },
    {
      key: "leading",
      label: t("Leading", "Leading"),
      icon: TrendingUp,
      count: promotions.counts.leading,
    },
    {
      key: "advertised",
      label: t("Matangazo", "Advertisements"),
      icon: Megaphone,
      count: promotions.counts.advertised,
    },
    {
      key: "campaigns",
      label: t("Kampeni", "Campaigns"),
      icon: Sparkles,
      count: promotions.counts.campaigns,
    },
  ];

  const renderTabContent = () => {
    if (activeTab === "boosted") {
      return promotions.boostedListings.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title={t("Hakuna Boosted Listings", "No Boosted Listings")}
          subtitle={t(
            "Mali zenye boost zitaonekana hapa.",
            "Boosted listings will appear here."
          )}
        />
      ) : (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {promotions.boostedListings.map((l) => (
            <PromotionCard key={l.id} listing={l} lang={lang} />
          ))}
        </div>
      );
    }

    if (activeTab === "leading") {
      return promotions.leadingListings.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={t("Hakuna Leading Listings", "No Leading Listings")}
          subtitle={t(
            "Mali zenye leading zitaonekana hapa.",
            "Leading listings will appear here."
          )}
        />
      ) : (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {promotions.leadingListings.map((l) => (
            <PromotionCard key={l.id} listing={l} lang={lang} />
          ))}
        </div>
      );
    }

    if (activeTab === "advertised") {
      return promotions.advertisedListings.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={t("Hakuna Matangazo", "No Advertisements")}
          subtitle={t(
            "Mali zenye banner zitaonekana hapa.",
            "Advertised listings will appear here."
          )}
        />
      ) : (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {promotions.advertisedListings.map((l) => (
            <PromotionCard key={l.id} listing={l} lang={lang} />
          ))}
        </div>
      );
    }

    if (activeTab === "campaigns") {
      return (
        <div className="flex flex-col gap-3 w-full min-w-0">
          <button
            onClick={() => {
              setAddingCampaign(true);
              setEditingCampaign(null);
              setError("");
            }}
            disabled={addingCampaign || !!editingCampaign}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={13} />
            {t("Kampeni Mpya", "New Campaign")}
          </button>

          {addingCampaign && (
            <CampaignForm
              initial={{}}
              lang={lang}
              saving={!!busy.campaignSave}
              onSave={handleAddCampaign}
              onCancel={() => setAddingCampaign(false)}
            />
          )}

          {editingCampaign && (
            <CampaignForm
              initial={editingCampaign}
              lang={lang}
              saving={!!busy.campaignSave}
              onSave={(form) => handleUpdateCampaign(editingCampaign.id, form)}
              onCancel={() => setEditingCampaign(null)}
            />
          )}

          {promotions.campaigns.length === 0 && !addingCampaign ? (
            <EmptyState
              icon={Sparkles}
              title={t("Hakuna Kampeni", "No Campaigns")}
              subtitle={t(
                "Kampeni za matangazo zitaonekana hapa.",
                "Promotional campaigns will appear here."
              )}
            />
          ) : (
            promotions.campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                lang={lang}
                isBusy={!!busy[`campaign-${campaign.id}`]}
                onEdit={(c) => {
                  setEditingCampaign(c);
                  setAddingCampaign(false);
                  setError("");
                }}
                onRemove={handleRemoveCampaign}
              />
            ))
          )}
        </div>
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Matangazo & Kampeni", "Promotions & Campaigns")}
        subtitle={t(
          "Fuatilia boosted, leading, matangazo, na kampeni za matangazo.",
          "Track boosted, leading, advertisements, and promotional campaigns."
        )}
      />

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-5 w-full">
        <StatBox
          label={t("Boosted", "Boosted")}
          value={promotions.counts.boosted}
          icon={Rocket}
          color={COLORS.gold}
        />
        <StatBox
          label={t("Leading", "Leading")}
          value={promotions.counts.leading}
          icon={TrendingUp}
          color={COLORS.green}
        />
        <StatBox
          label={t("Matangazo", "Advertisements")}
          value={promotions.counts.advertised}
          icon={Megaphone}
          color={COLORS.rust}
        />
        <StatBox
          label={t("Mapato ya Matangazo", "Promotion Revenue")}
          value={formatTZS(promotions.totalPromotionRevenue)}
          icon={DollarSign}
          color="#2563EB"
        />
      </div>

      {/* Revenue Breakdown */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-xl border p-3 sm:p-4 mb-5 w-full min-w-0 overflow-hidden"
      >
        <h3 className="text-sm font-semibold text-primary mb-3">
          {t("Mapato kwa Aina", "Revenue by Type")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
          <RevenueRow
            label={t("Boost", "Boost")}
            value={promotions.revenueByType.boost}
            color={COLORS.gold}
          />
          <RevenueRow
            label={t("Leading", "Leading")}
            value={promotions.revenueByType.leading}
            color={COLORS.green}
          />
          <RevenueRow
            label={t("Matangazo", "Advertisements")}
            value={promotions.revenueByType.advertise}
            color={COLORS.rust}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2 w-full min-w-0">
        {TABS.map(({ key, label, icon: Icon, count }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: isActive ? COLORS.night : "white",
                color: isActive ? COLORS.sand : "var(--text-primary)",
                borderColor: COLORS.sandLine,
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
            >
              <Icon size={13} />
              {label}
              <span
                style={{
                  background: isActive
                    ? "rgba(245,243,236,0.18)"
                    : COLORS.sandLine,
                  color: isActive ? COLORS.sand : "var(--text-primary)",
                }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="w-full min-w-0">{renderTabContent()}</div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function StatBox({ label, value, icon: Icon, color }) {
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full overflow-hidden"
    >
      <div
        style={{ background: `${color}15` }}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1.5 shrink-0"
      >
        <Icon size={13} color={color} />
      </div>
      <p className="text-sm sm:text-base lg:text-lg font-bold text-primary break-words leading-tight">
        {value}
      </p>
      <p className="text-[10px] text-secondary leading-tight mt-0.5 break-words">
        {label}
      </p>
    </div>
  );
}

function RevenueRow({ label, value, color }) {
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
      className="rounded-lg border p-2.5 sm:p-3 min-w-0 w-full overflow-hidden"
    >
      <p className="text-[10px] font-semibold text-secondary uppercase truncate">
        {label}
      </p>
      <p
        style={{ color }}
        className="text-sm sm:text-base font-bold mt-1 break-words leading-tight"
      >
        {formatTZS(value)}
      </p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
    >
      <Icon size={40} className="mx-auto text-muted mb-3" />
      <h3 className="font-semibold text-primary mb-1 break-words">{title}</h3>
      <p className="text-sm text-secondary break-words">{subtitle}</p>
    </div>
  );
}
