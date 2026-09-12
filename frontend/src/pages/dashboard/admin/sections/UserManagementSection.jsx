// ============================================================
// UserManagementSection.jsx
// Usimamizi wa watumiaji — table (desktop) + card list (mobile).
// Bilingual.
// ============================================================

import React, { useState } from "react";
import { Search, RotateCcw, Ban } from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import UserDrawer from "../shared/UserDrawer.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useUsers, toggleUserStatus } from "../../../../config/usersStore.js";
import { useListings } from "../../../../config/listingsStore.js";
import { useDeals } from "../../../../config/dealsStore.js";

export default function UserManagementSection() {
  const { lang } = useLanguage();
  const users = useUsers();
  const listings = useListings();
  const deals = useDeals();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  const filtered = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      u.role?.toLowerCase() === roleFilter.toLowerCase();
    return matchesQuery && matchesRole;
  });

  // ============================================================
  // ACTION BUTTON — inatumika table na card
  // ============================================================
  const ActionButton = ({ user, fullWidth = false }) => {
    const isSuspended = user.status === "suspended";
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleUserStatus(user.id);
        }}
        style={{
          color: isSuspended ? COLORS.green : COLORS.rust,
          borderColor: isSuspended ? `${COLORS.green}33` : `${COLORS.rust}33`,
        }}
        className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
          fullWidth ? "w-full" : ""
        }`}
      >
        {isSuspended ? <RotateCcw size={13} /> : <Ban size={13} />}
        {isSuspended
          ? lang === "sw"
            ? "Washa Tena"
            : "Activate"
          : lang === "sw"
            ? "Simamisha"
            : "Suspend"}
      </button>
    );
  };

  return (
    <>
      <SectionHeader
        title={lang === "sw" ? "Usimamizi wa Watumiaji" : "User Management"}
        subtitle={
          lang === "sw"
            ? "Dhibiti akaunti za watumiaji — simamisha au washa"
            : "Manage user accounts — suspend or activate"
        }
      />

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === "sw"
                ? "Tafuta kwa jina au email..."
                : "Search by name or email..."
            }
            className="outline-none text-sm flex-1 min-w-0"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
        >
          <option value="all">{lang === "sw" ? "Zote" : "All"}</option>
          <option value="Buyer">{lang === "sw" ? "Wanunuzi" : "Buyers"}</option>
          <option value="Seller">{lang === "sw" ? "Wauzaji" : "Sellers"}</option>
        </select>
      </div>

      {/* ============================================================
          DESKTOP — TABLE (sm na juu)
          ============================================================ */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Jina" : "Name"}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Alijiunga" : "Joined"}
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Kitendo" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(u)}
                >
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">
                    {u.name}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{u.role}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={u.status} lang={lang} />
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">{u.joined}</td>
                  <td className="px-5 py-3 text-right">
                    <ActionButton user={u} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-gray-400"
                  >
                    {lang === "sw" ? "Hakuna matokeo" : "No results"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================
          MOBILE — CARD LIST (sm na chini)
          ============================================================ */}
      <div className="sm:hidden flex flex-col gap-3">
        {filtered.map((u) => (
          <div
            key={u.id}
            onClick={() => setSelectedUser(u)}
            className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-sm transition-shadow"
          >
            {/* Header: jina + status */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {u.name}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {u.email}
                </p>
              </div>
              <StatusBadge status={u.status} lang={lang} />
            </div>

            {/* Meta: role + joined */}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <span className="text-gray-400">
                  {lang === "sw" ? "Role:" : "Role:"}
                </span>
                <span className="font-medium text-gray-700">{u.role}</span>
              </span>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="text-gray-400">
                  {lang === "sw" ? "Alijiunga:" : "Joined:"}
                </span>
                <span className="font-medium text-gray-700">{u.joined}</span>
              </span>
            </div>

            {/* Action */}
            <ActionButton user={u} fullWidth />
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            {lang === "sw" ? "Hakuna matokeo" : "No results"}
          </div>
        )}
      </div>

      {/* DRAWER */}
      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          listings={listings}
          deals={deals}
          onClose={() => setSelectedUser(null)}
          lang={lang}
        />
      )}
    </>
  );
}
