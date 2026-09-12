import React, { useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  useAnnouncements,
  addAnnouncement,
  removeAnnouncement,
  ANNOUNCEMENT_TYPES,
} from "../../../../../config/announcementsStore.js";

export default function AnnouncementsPanel() {
  const { lang } = useLanguage();
  const announcements = useAnnouncements();
  const [form, setForm] = useState({
    typeId: "fee_change",
    title: "",
    message: "",
    scheduledFor: "",
  });
  const [expanded, setExpanded] = useState(false);

  const typeLabel = (id) =>
    ANNOUNCEMENT_TYPES.find((t) => t.id === id)?.label || id;

  const send = () => {
    if (!form.title.trim() || !form.message.trim()) return;
    addAnnouncement({ id: Date.now(), ...form, sent: !form.scheduledFor });
    setForm({ typeId: "fee_change", title: "", message: "", scheduledFor: "" });
    setExpanded(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4 lg:col-span-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div
            style={{ background: `${COLORS.night}0D` }}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
          >
            <Megaphone size={16} color={COLORS.night} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {lang === "sw"
                ? "Matangazo ya Mfumo / Marketplace"
                : "System / Marketplace Announcements"}
            </p>
            <p className="text-xs text-gray-500">
              {lang === "sw"
                ? "Matangazo ya jumla — fee changes, categories mpya, maintenance"
                : "General announcements — fee changes, new categories, maintenance"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 shrink-0"
        >
          <Plus size={13} /> {lang === "sw" ? "Tangazo Jipya" : "New Announcement"}
        </button>
      </div>

      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="border rounded-xl p-4 flex flex-col gap-3"
        >
          <div className="flex flex-wrap gap-1.5">
            {ANNOUNCEMENT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setForm({ ...form, typeId: t.id })}
                style={{
                  background: form.typeId === t.id ? COLORS.night : "white",
                  color: form.typeId === t.id ? COLORS.sand : COLORS.night,
                  borderColor: COLORS.sandLine,
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={lang === "sw" ? "Kichwa cha tangazo" : "Announcement title"}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
          />
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder={
              lang === "sw"
                ? "Ujumbe kamili wa tangazo..."
                : "Full announcement message..."
            }
            rows={3}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none resize-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 shrink-0">
              {lang === "sw" ? "Ratiba (hiari):" : "Schedule (optional):"}
            </label>
            <input
              type="datetime-local"
              value={form.scheduledFor}
              onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none flex-1"
            />
          </div>
          <button
            onClick={send}
            style={{ background: COLORS.green, color: "white" }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 self-start"
          >
            <Megaphone size={13} />
            {form.scheduledFor
              ? lang === "sw"
                ? "Panga Tangazo"
                : "Schedule Announcement"
              : lang === "sw"
                ? "Tuma Sasa kwa Wote"
                : "Send Now to All"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {announcements.map((a) => (
          <div
            key={a.id}
            style={{ borderColor: COLORS.sandLine }}
            className="flex items-start justify-between gap-3 border rounded-lg px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  style={{ background: `${COLORS.gold}15`, color: COLORS.gold }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                >
                  {typeLabel(a.typeId)}
                </span>
                {!a.sent && (
                  <span
                    style={{
                      background: `${COLORS.green}15`,
                      color: COLORS.green,
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    {lang === "sw" ? "Imepangwa:" : "Scheduled:"}{" "}
                    {a.scheduledFor?.replace("T", " ")}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800">{a.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>
            </div>
            <button
              onClick={() => removeAnnouncement(a.id)}
              className="text-gray-300 hover:text-[#C1502E] shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-xs text-gray-400">
            {lang === "sw" ? "Hakuna tangazo bado" : "No announcements yet"}
          </p>
        )}
      </div>
    </div>
  );
}
