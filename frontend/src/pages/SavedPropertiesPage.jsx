import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MapPin,
  Eye,
  Trash2,
  Grid3x3,
  List,
  Search,
  Home as HomeIcon,
  Trees,
  Car,
  Briefcase,
  Wrench,
} from "lucide-react";
import { COLORS, FONTS, getCategory, formatTZS, timeAgo } from "../components/shared";

// Mock saved properties
const SEED_SAVED = [
  {
    id: "sp1",
    title: "Nyumba ya Ghorofa Mbezi Beach",
    category: "nyumba",
    price: 85000000,
    location: "Mbezi Beach, Dar es Salaam",
    savedAt: "2026-09-10T10:00:00.000Z",
    isVerified: true,
    views: 214,
  },
  {
    id: "sp2",
    title: "Toyota Harrier 2016",
    category: "magari",
    price: 42000000,
    location: "Kinondoni, Dar es Salaam",
    savedAt: "2026-09-08T14:30:00.000Z",
    isVerified: true,
    views: 567,
  },
  {
    id: "sp3",
    title: "Kiwanja Ubungo — Hati Miliki",
    category: "viwanja",
    price: 28000000,
    location: "Ubungo, Dar es Salaam",
    savedAt: "2026-09-05T09:15:00.000Z",
    views: 145,
  },
  {
    id: "sp4",
    title: "Duka la Vifaa vya Ujenzi — Kariakoo",
    category: "biashara",
    price: 15000000,
    location: "Kariakoo, Dar es Salaam",
    savedAt: "2026-09-01T16:45:00.000Z",
    isVerified: true,
    views: 389,
  },
];

const CATEGORY_ICONS = {
  nyumba: HomeIcon,
  viwanja: Trees,
  magari: Car,
  biashara: Briefcase,
  mashine: Wrench,
};

function SavedCard({ property, viewMode, onRemove }) {
  const category = getCategory(property.category);
  const Icon = category?.icon || HomeIcon;

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(property.id);
  };

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col sm:flex-row">
        <Link
          to={`/mali/${property.id}`}
          className="w-full sm:w-48 h-40 sm:h-auto bg-gray-100 flex items-center justify-center flex-shrink-0"
        >
          <Icon size={32} className="text-gray-300" />
        </Link>
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/mali/${property.id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm hover:text-[#E8A33D] transition-colors">
                {property.title}
              </h3>
            </Link>
            <button
              onClick={handleRemove}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
              aria-label="Remove"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <MapPin size={12} />
            {property.location}
          </div>
          <p className="text-[#C1502E] font-bold text-base mt-2">
            {formatTZS(property.price)}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Ilifadhiwa {timeAgo(property.savedAt)}
            </span>
            <Link
              to={`/mali/${property.id}`}
              className="text-xs font-semibold text-[#E8A33D] hover:underline"
            >
              Angalia →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
      <Link to={`/mali/${property.id}`} className="block relative">
        <div className="w-full h-44 bg-gray-100 flex items-center justify-center">
          <Icon size={40} className="text-gray-300 group-hover:scale-110 transition-transform" />
        </div>
        {property.isVerified && (
          <span className="absolute top-2 right-2 bg-[#2F6D4F] text-white text-[10px] font-bold px-2 py-1 rounded-full">
            Verified
          </span>
        )}
        <button
          onClick={handleRemove}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 text-[#C1502E] hover:bg-red-500 hover:text-white transition-colors"
          aria-label="Remove"
        >
          <Trash2 size={16} />
        </button>
      </Link>
      <Link to={`/mali/${property.id}`} className="block p-4">
        <h3 className="font-semibold text-gray-800 text-sm truncate">{property.title}</h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <MapPin size={12} />
          <span className="truncate">{property.location}</span>
        </div>
        <p className="text-[#C1502E] font-bold text-base mt-2">
          {formatTZS(property.price)}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Eye size={12} /> {property.views}
          </span>
          <span>{timeAgo(property.savedAt)}</span>
        </div>
      </Link>
    </div>
  );
}

export default function SavedPropertiesPage() {
  const [saved, setSaved] = useState(SEED_SAVED);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = saved.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemove = (id) => {
    setSaved((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "100%" }} className="w-full p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold">
            Zilizohifadhiwa
          </h1>
          <span
            style={{ background: COLORS.night, color: COLORS.sand }}
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
          >
            {saved.length}
          </span>
        </div>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-5">
          Mali ulizozihifadhi kwa ajili ya baadaye.
        </p>

        {saved.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tafuta kwenye zilizohifadhiwa..."
                style={{ background: "white", borderColor: COLORS.sandLine, color: COLORS.night }}
                className="w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="flex border rounded-xl overflow-hidden" style={{ borderColor: COLORS.sandLine }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  background: viewMode === "grid" ? COLORS.night : "white",
                  color: viewMode === "grid" ? COLORS.sand : COLORS.night,
                }}
                className="p-2.5 transition-colors"
                aria-label="Grid"
              >
                <Grid3x3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  background: viewMode === "list" ? COLORS.night : "white",
                  color: viewMode === "list" ? COLORS.sand : COLORS.night,
                }}
                className="p-2.5 transition-colors"
                aria-label="List"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="rounded-2xl border-2 border-dashed p-12 text-center bg-white"
          >
            <Heart size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 style={{ color: COLORS.night }} className="font-semibold mb-1">
              {searchQuery ? "Hakuna matokeo" : "Hakuna mali iliyohifadhiwa"}
            </h3>
            <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-sm mb-5">
              {searchQuery
                ? "Jaribu kutafuta kwa neno lingine"
                : "Mali unayovutiwa nayo, ihifadhi ili uikumbuke baadaye."}
            </p>
            {!searchQuery && (
              <Link
                to="/"
                style={{ background: COLORS.gold, color: COLORS.night }}
                className="inline-block px-5 py-2.5 rounded-xl font-semibold text-sm"
              >
                Tafuta Mali
              </Link>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filtered.map((p) => (
              <SavedCard key={p.id} property={p} viewMode={viewMode} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
