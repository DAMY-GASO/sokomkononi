import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import DashboardShell from "./components/DashboardShell.jsx";
import MyListings from "./components/MyListings.jsx";
import PostPropertyForm from "./components/PostPropertyForm.jsx";

export default function SellerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("post"); // "post" | "listings" | "boost" | "deals" | "transactions"

  // Map views to components
  const renderContent = () => {
    switch (activeView) {
      case "post":
        return <PostPropertyForm />;
      case "listings":
        return <MyListings />;
      case "boost":
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">Boost Sasa</h2>
            <p className="text-gray-600 mt-2">Ongeza mwonekano wa bidhaa yako mara 3</p>
            <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
              <p className="text-gray-500">Hapa utaona chaguzi za ku-boost mali zako</p>
            </div>
          </div>
        );
      case "deals":
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">Deal Rooms</h2>
            <p className="text-gray-600 mt-2">Mazungumzo yako na wanunuzi</p>
            <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
              <p className="text-gray-500">Hakuna deal zilizoanzishwa bado</p>
            </div>
          </div>
        );
      case "transactions":
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">My Transactions</h2>
            <p className="text-gray-600 mt-2">Fuatilia malipo na miamala yako</p>
            <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
              <p className="text-gray-500">Hakuna miamala bado</p>
            </div>
          </div>
        );
      default:
        return <PostPropertyForm />;
    }
  };

  return (
    <DashboardShell 
      role="seller"
      activeView={activeView}
      setActiveView={setActiveView}
      user={user}
    >
      {renderContent()}
    </DashboardShell>
  );
}
