import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import DashboardShell from "./components/DashboardShell.jsx";
import DealRooms from "./components/DealRooms.jsx";

// Mock data ya saved properties
const SAVED_PROPERTIES = [
  {
    id: "sp1",
    title: "Nyumba ya Ghorofa Mbezi Beach",
    price: 85000000,
    location: "Mbezi Beach, Dar es Salaam",
    category: "nyumba",
    savedAt: "2026-09-10",
  },
  {
    id: "sp2",
    title: "Toyota Harrier 2016",
    price: 42000000,
    location: "Kinondoni, Dar es Salaam",
    category: "magari",
    savedAt: "2026-09-08",
  },
];

// Mock data ya waiting list
const WAITING_LIST = [
  {
    id: "w1",
    property: "Kiwanja Ubungo — Hati Miliki",
    price: 28000000,
    location: "Ubungo, Dar es Salaam",
    status: "pending",
    joinedAt: "2026-09-05",
  },
];

export default function BuyerDashboard() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("browse");
  const [savedProperties] = useState(SAVED_PROPERTIES);
  const [waitingList] = useState(WAITING_LIST);

  const renderContent = () => {
    switch (activeView) {
      case "browse":
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">
              {lang === "sw" ? "Tafuta Mali" : "Browse Properties"}
            </h2>
            <p className="text-gray-600 mt-2">
              {lang === "sw" ? "Pata mali unayoitafuta" : "Find the property you need"}
            </p>

            {/* Search Bar */}
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                placeholder={lang === "sw" ? "Tafuta mali kwa jina, mahali..." : "Search properties by name, location..."}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
              />
              <button className="bg-[#E8A33D] text-[#101A2E] px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#B87A1F] transition-colors">
                {lang === "sw" ? "Tafuta" : "Search"}
              </button>
            </div>

            {/* Categories */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { sw: "Nyumba", en: "Houses" },
                { sw: "Viwanja", en: "Plots" },
                { sw: "Magari", en: "Cars" },
                { sw: "Biashara", en: "Business" },
                { sw: "Mashine", en: "Machinery" },
              ].map((cat) => (
                <button
                  key={cat.en}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md hover:border-[#E8A33D] transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-[#E8A33D]/10 flex items-center justify-center mx-auto mb-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 11.5 12 4l9 7.5" />
                      <path d="M5 10v10h14V10" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {lang === "sw" ? cat.sw : cat.en}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );

      case "deals":
        return <DealRooms side="buyer" />;

      case "waiting":
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">
              {lang === "sw" ? "Waiting List" : "Waiting List"}
            </h2>
            <p className="text-gray-600 mt-2">
              {lang === "sw" ? "Mali ulizoweka nia ya kununua" : "Properties you're interested in"}
            </p>

            {waitingList.length === 0 ? (
              <div className="mt-4 bg-white rounded-xl p-12 text-center shadow-sm border">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.5" className="mx-auto text-gray-300">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-gray-500 mt-2">
                  {lang === "sw" ? "Hujajiunga na waiting list yoyote" : "You haven't joined any waiting list"}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {waitingList.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">{item.property}</h4>
                      <p className="text-xs text-gray-500">{item.location}</p>
                      <p className="text-[#C1502E] font-bold text-sm mt-1">
                        TSh {item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        item.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        item.status === "notified" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {item.status === "pending" ? (lang === "sw" ? "Inasubiri" : "Pending") :
                         item.status === "notified" ? (lang === "sw" ? "Umetaarifiwa" : "Notified") :
                         (lang === "sw" ? "Imeisha Muda" : "Expired")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "transactions":
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">
              {lang === "sw" ? "My Transactions" : "My Transactions"}
            </h2>
            <p className="text-gray-600 mt-2">
              {lang === "sw" ? "Fuatilia ununuzi wako" : "Track your purchases"}
            </p>
            <div className="mt-4 bg-white rounded-xl p-12 shadow-sm border">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="1.5" className="mx-auto text-gray-300">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 10h18" />
              </svg>
              <p className="text-gray-500 mt-2">
                {lang === "sw" ? "Hakuna miamala bado" : "No transactions yet"}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardShell
      role="buyer"
      activeView={activeView}
      setActiveView={setActiveView}
      user={user}
    >
      {renderContent()}
    </DashboardShell>
  );
}
