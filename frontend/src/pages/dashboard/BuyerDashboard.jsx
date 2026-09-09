import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import DashboardShell from "./components/DashboardShell.jsx";

export default function BuyerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("browse");

  const renderContent = () => {
    switch (activeView) {
      case "browse":
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">Tafuta Mali</h2>
            <p className="text-gray-600 mt-2">Pata mali unayoitafuta</p>
            <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
              <p className="text-gray-500">Hapa utaona matokeo ya utafutaji</p>
            </div>
          </div>
        );
      case "deals":
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">Deal Rooms</h2>
            <p className="text-gray-600 mt-2">Mazungumzo yako na wauzaji</p>
            <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
              <p className="text-gray-500">Hakuna deal zilizoanzishwa bado</p>
            </div>
          </div>
        );
      case "waiting":
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">Waiting List</h2>
            <p className="text-gray-600 mt-2">Mali ulizoweka nia ya kununua</p>
            <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
              <p className="text-gray-500">Hujajiunga na waiting list yoyote</p>
            </div>
          </div>
        );
      case "transactions":
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">My Transactions</h2>
            <p className="text-gray-600 mt-2">Fuatilia ununuzi wako</p>
            <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
              <p className="text-gray-500">Hakuna miamala bado</p>
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
