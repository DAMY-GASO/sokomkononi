import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Grid3x3, List, Search, Bell, AlertTriangle } from "lucide-react";
import { COLORS, getCategory } from "./dashboard/components/shared";
import { getListings } from "../config/listingsStore.js";
import { useSavedIds, useSavedSnapshots, toggleSaved, hydrateSavedFromApi } from "../config/savedStore.js";
import { getCategoryIcon } from "../config/categoriesStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useToast } from "../components/Toast.jsx";
import ListingCard from "../components/ListingCard.jsx";

export default function SavedPropertiesPage() {
  const { lang } = useLanguage();
  const toast = useToast();
  const savedIds = useSavedIds();
  const snapshots = useSavedSnapshots();
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [allListings, setAllListings] = useState(() => getListings());
  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    let cancelled = false;
    hydrateSavedFromApi().finally(() => {
      if (!cancelled) { setAllListings(getListings()); setHydrated(true); }
    });
    const sync = () => setAllListings(getListings());
    window.addEventListener("storage", sync);
    window.addEventListener("sokomkononi:listings-updated", sync);
    return () => { cancelled = true; window.removeEventListener("storage", sync); window.removeEventListener("sokomkononi:listings-updated", sync); };
  }, []);

  const saved = useMemo(() => {
    const byId = new Map(allListings.map((l) => [String(l.id), l]));
    const result = [];
    for (const rawId of savedIds) {
      const lid = String(rawId);
      if (byId.has(lid)) { result.push(byId.get(lid)); continue; }
      const snap = snapshots[lid];
      if (snap) {
        result.push({ id: lid, title: snap.title || t("Tangazo lililoondolewa", "Listing removed"), price: Number(snap.price) || 0, status: snap.status || "removed", imageUrl: null, photos: [], location: "", category: null, removed: true, savedAt: snap.savedAt });
      }
    }
    return result.sort((a, b) => {
      const at = (a.savedAt || a.postedAt) ? new Date(a.savedAt || a.postedAt).getTime() : 0;
      const bt = (b.savedAt || b.postedAt) ? new Date(b.savedAt || b.postedAt).getTime() : 0;
      return bt - at;
    });
  }, [allListings, savedIds, snapshots, lang]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return saved;
    const q = searchQuery.toLowerCase();
    return saved.filter((p) => (p.title || "").toLowerCase().includes(q) || (p.location || "").toLowerCase().includes(q));
  }, [saved, searchQuery]);

  const handleRemove = async (id, listing) => {
    const res = await toggleSaved(id, listing);
    if (res?.ok && res.saved === false) toast.success(t("Imeondolewa kwenye zilizohifadhiwa", "Removed from saved"));
    else if (res?.ok === false) toast.error(res?.error?.message || t("Imeshindwa kuondoa.", "Failed to remove."));
  };

  return (
    <div style={{ background: COLORS.sand, minHeight: "100%" }} className="w-full p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-2 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <h1 style={{ color: "var(--text-primary)" }} className="text-2xl sm:text-3xl font-semibold">{t("Mali Zilizohifadhiwa", "Saved Properties")}</h1>
            <span style={{ background: COLORS.night, color: COLORS.sand }} className="text-xs font-semibold px-2.5 py-1 rounded-full">{saved.length}</span>
          </div>
          <p style={{ color: "var(--text-secondary)" }} className="text-sm max-w-xl mx-auto">{t("Mali ulizozihifadhi kwa ajili ya baadaye.", "Properties youve saved for later.")}</p>
        </div>
        <div style={{ background: "rgba(0,98,253,0.08)", color: "#011957", borderColor: "rgba(0,98,253,0.25)" }} className="flex flex-col items-center text-center gap-2 text-xs rounded-lg border px-3 py-2.5 mb-5 max-w-2xl mx-auto">
          <Bell size={14} /><span>{t("Utapata taarifa listings hizi zinapobadilika (bei, kuuzwa, au kushikiliwa).", "Youll be notified when these listings change (price, sold, reserved).")}</span>
        </div>
        {saved.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 max-w-md mx-auto">
            <div className="relative flex-1">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("Tafuta kwenye Mali zilizohifadhiwa...", "Search in saved...")} style={{ background: "white", borderColor: COLORS.sandLine, color: "var(--text-primary)", WebkitAppearance: "none" }} className="w-full rounded-xl border pl-3 pr-10 py-2.5 text-sm outline-none text-center focus:outline-none focus-visible:outline-none focus:border-[#FEA406]" />
              <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            </div>
            <div className="flex border rounded-xl overflow-hidden shrink-0 mx-auto sm:mx-0" style={{ borderColor: COLORS.sandLine }}>
              <button onClick={() => setViewMode("grid")} style={{ background: viewMode === "grid" ? COLORS.night : "white", color: viewMode === "grid" ? COLORS.sand : "var(--text-primary)" }} className="p-2.5 transition-colors" aria-label={t("Grid", "Grid")}><Grid3x3 size={16} /></button>
              <button onClick={() => setViewMode("list")} style={{ background: viewMode === "list" ? COLORS.night : "white", color: viewMode === "list" ? COLORS.sand : "var(--text-primary)" }} className="p-2.5 transition-colors" aria-label={t("Orodha", "List")}><List size={16} /></button>
            </div>
          </div>
        )}
        {!hydrated ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">{[1, 2, 3].map((i) => <div key={i} className="aspect-square rounded-2xl skeleton" />)}</div>
        ) : filtered.length === 0 ? (
          <div style={{ borderColor: COLORS.sandLine }} className="rounded-2xl border-2 border-dashed p-12 text-center bg-white">
            <Heart size={48} className="mx-auto text-muted mb-3" />
            <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-1">{searchQuery ? t("Hakuna matokeo", "No results") : t("Hakuna mali iliyohifadhiwa", "No saved listings")}</h3>
            <p style={{ color: "var(--text-secondary)" }} className="text-sm mb-5">{searchQuery ? t("Jaribu kutafuta kwa neno lingine", "Try searching with a different term") : t("Mali unayovutiwa nayo, ihifadhi ili uikumbuke baadaye.", "Save properties youre interested in so you can find them later.")}</p>
            {!searchQuery && <Link to="/" style={{ background: COLORS.gold, color: COLORS.night }} className="inline-block px-5 py-2.5 rounded-xl font-semibold text-sm">{t("Tafuta Mali", "Browse Properties")}</Link>}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4" : "flex flex-col gap-3"}>
            {filtered.map((p) => {
              if (p.removed) {
                return (
                  <div key={p.id} style={{ borderColor: COLORS.sandLine, background: "white" }} className="rounded-2xl border p-4 flex flex-col gap-2 opacity-70">
                    <div className="flex items-start gap-2 text-xs font-semibold text-[#C1502E]"><AlertTriangle size={14} />{t("Tangazo hili halipo tena", "This listing is no longer available")}</div>
                    <p style={{ color: "var(--text-primary)" }} className="text-sm font-medium line-clamp-2">{p.title}</p>
                    <p className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>TZS {Number(p.price || 0).toLocaleString("en-US")}</p>
                    <button onClick={() => handleRemove(p.id)} className="mt-1 self-start text-xs font-semibold text-[#C1502E] hover:underline">{t("Ondoa kwenye zilizohifadhiwa", "Remove from saved")}</button>
                  </div>
                );
              }
              const cat = getCategory(p.category);
              return <ListingCard key={p.id} listing={p} category={cat} Icon={getCategoryIcon(cat?.iconKey)} lang={lang} viewMode={viewMode} isSaved={true} onToggleSave={handleRemove} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}