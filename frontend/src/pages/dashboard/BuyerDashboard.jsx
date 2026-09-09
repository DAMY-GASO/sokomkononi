import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import DashboardShell from "./components/DashboardShell.jsx";
import DealRoom, { DEAL_ROOMS } from "./components/DealRoom.jsx";

// Mock data ya saved properties
const SAVED_PROPERTIES = [
  {
    id: "sp1",
    title: "Nyumba ya Ghorofa Mbezi Beach",
    price: 85000000,
    location: "Mbezi Beach, Dar es Salaam",
    category: "nyumba",
    image: "/assets/properties/house1.jpg",
    savedAt: "2026-09-10",
  },
  {
    id: "sp2",
    title: "Toyota Harrier 2016",
    price: 42000000,
    location: "Kinondoni, Dar es Salaam",
    category: "magari",
    image: "/assets/properties/car1.jpg",
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
    status: "pending", // "pending" | "notified" | "expired"
    joinedAt: "2026-09-05",
  },
];

export default function BuyerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("browse");
  const [dealRooms, setDealRooms] = useState(DEAL_ROOMS);
  const [savedProperties] = useState(SAVED_PROPERTIES);
  const [waitingList] = useState(WAITING_LIST);

  const renderContent = () => {
    switch (activeView) {
      case "browse":
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">Tafuta Mali</h2>
            <p className="text-gray-600 mt-2">Pata mali unayoitafuta</p>
            
            {/* Search Bar */}
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                placeholder="Tafuta mali kwa jina, mahali, au category..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
              />
              <button className="bg-[#E8A33D] text-[#101A2E] px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#B87A1F] transition-colors">
                Tafuta
              </button>
            </div>

            {/* Categories */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {["Nyumba", "Viwanja", "Magari", "Biashara", "Mashine"].map((cat) => (
                <button
                  key={cat}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md hover:border-[#E8A33D] transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-[#E8A33D]/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#E8A33D] text-xl">🏠</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{cat}</p>
                </button>
              ))}
            </div>

            {/* Trending Properties */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Mali Zinazotrendi</h3>
                <button className="text-[#E8A33D] text-sm font-medium hover:underline">
                  Tazama Zote →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Nyumba ya Vyumba 3, Mbezi", price: "TSh 35,000,000", location: "Dar es Salaam" },
                  { title: "Gari Ndogo la Mjini, Njiro", price: "TSh 12,500,000", location: "Arusha" },
                  { title: "Pikipiki ya Boxer, Ilemela", price: "TSh 2,800,000", location: "Mwanza" },
                  { title: "Shamba Tayari kwa Kilimo, Kilosa", price: "TSh 1,500,000", location: "Morogoro" },
                ].map((prop, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm">{prop.title}</h4>
                        <p className="text-xs text-gray-500">{prop.location}</p>
                        <p className="text-[#C1502E] font-bold text-sm mt-1">{prop.price}</p>
                      </div>
                      <button className="text-gray-400 hover:text-[#C1502E] transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </div>
                    <button className="w-full mt-3 bg-[#E8A33D] text-[#101A2E] py-1.5 rounded-lg text-sm font-medium hover:bg-[#B87A1F] transition-colors">
                      Nunua Sasa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "deals":
        return <DealRoom userRole="buyer" deals={dealRooms} />;

      case "waiting":
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">Waiting List</h2>
            <p className="text-gray-600 mt-2">Mali ulizoweka nia ya kununua</p>
            
            {waitingList.length === 0 ? (
              <div className="mt-4 bg-white rounded-xl p-12 text-center shadow-sm border">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.5" className="mx-auto text-gray-300">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-gray-500 mt-2">Hujajiunga na waiting list yoyote</p>
                <p className="text-gray-400 text-xs">Mali ulizoonyesha nia zitakuja hapa</p>
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
                        {item.status === "pending" ? "Inasubiri" :
                         item.status === "notified" ? "Umetaarifiwa" :
                         "Imeisha Muda"}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.joinedAt).toLocaleDateString()}
                      </p>
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
            <h2 className="text-xl font-bold text-gray-800">My Transactions</h2>
            <p className="text-gray-600 mt-2">Fuatilia ununuzi wako</p>
            <div className="mt-4 bg-white rounded-xl p-12 shadow-sm border">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="1.5" className="mx-auto text-gray-300">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 10h18" />
              </svg>
              <p className="text-gray-500 mt-2">Hakuna miamala bado</p>
              <p className="text-gray-400 text-xs">Miamala yako yote itaonekana hapa</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 text-center">
            <p className="text-gray-500">Chagua kitendo kutoka kwenye sidebar</p>
          </div>
        );
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
