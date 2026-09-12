// ============================================================
// UserManagementSection.jsx
// Usimamizi wa watumiaji — table + drawer ya wasifu.
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

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={16} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === "sw"
                ? "Tafuta kwa jina au email..."
                : "Search by name or email..."
            }
            className="outline-none text-sm flex-1"
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

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUserStatus(u.id);
                      }}
                      style={{
                        color:
                          u.status === "suspended" ? COLORS.green : COLORS.rust,
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                    >
                      {u.status === "suspended" ? (
                        <RotateCcw size={13} />
                      ) : (
                        <Ban size={13} />
                      )}
                      {u.status === "suspended"
                        ? lang === "sw"
                          ? "Washa Tena"
                          : "Activate"
                        : lang === "sw"
                          ? "Simamisha"
                          : "Suspend"}
                    </button>
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
