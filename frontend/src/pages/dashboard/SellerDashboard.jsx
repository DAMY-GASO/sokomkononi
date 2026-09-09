import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import DashboardShell from "./components/DashboardShell.jsx";
import MyListings from "./components/MyListings.jsx";
import PostPropertyForm from "./components/PostPropertyForm.jsx";
import DealRoom, { DEAL_ROOMS } from "./components/DealRoom.jsx";

// Mock data ya listings
const MOCK_LISTINGS = [
  {
    id: "l1",
    title: "Nyumba ya Ghorofa Mbezi Beach",
    category: "nyumba",
    price: 85000000,
    location: "Mbezi Beach, Dar es Salaam",
    status: "live",
    postedAt: "2026-08-28",
    views: 214,
    inquiries: 6,
  },
  {
    id: "l2",
    title: "Toyota Harrier 2016",
    category: "magari",
    price: 42000000,
    location: "Kinondoni, Dar es Salaam",
    status: "pending_payment",
    postedAt: "2026-09-07",
    listingFee: 150000,
    views: 0,
    inquiries: 0,
  },
  {
    id: "l3",
    title: "Kiwanja Ubungo — Hati Miliki",
    category: "viwanja",
    price: 28000000,
    location: "Ubungo, Dar es Salaam",
    status: "in_review",
    postedAt: "2026-09-08",
    views: 0,
    inquiries: 0,
  },
  {
    id: "l4",
    title: "Duka la Vifaa vya Ujenzi — Kariakoo",
    category: "biashara",
    price: 15000000,
    location: "Kariakoo, Dar es Salaam",
    status: "sold",
    postedAt: "2026-07-14",
    views: 389,
    inquiries: 11,
  },
  {
    id: "l5",
    title: "Excavator CAT 320D",
    category: "mashine",
    price: 120000000,
    location: "Chalinze, Pwani",
    status: "expired",
    postedAt: "2026-06-02",
    views: 97,
    inquiries: 2,
  },
];

export default function SellerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("listings");
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dealRooms, setDealRooms] = useState(DEAL_ROOMS);

  // Handle removing a listing
  const handleRemoveListing = (id) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  // Handle successful property submission
  const handlePropertySubmit = () => {
    setShowSuccess(true);
    // Baada ya sekunde chache, rudia kwenye listings
    setTimeout(() => {
      setShowSuccess(false);
      setActiveView("listings");
    }, 3000);
  };

  // Handle cancel - rudi kwenye listings
  const handleCancel = () => {
    setActiveView("listings");
  };

  // Map views to components
  const renderContent = () => {
    // Onyesha ujumbe wa mafanikio kama umejitokeza
    if (showSuccess) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border max-w-md">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Mali Imeongezwa!</h3>
            <p className="text-gray-500 text-sm mt-2">Mali yako imewekwa kwa mafanikio. Inaelekezwa kwenye My Listings...</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case "post":
        return (
          <PostPropertyForm 
            onSuccess={handlePropertySubmit}
            onCancel={handleCancel}
          />
        );
      case "listings":
        return <MyListings listings={listings} onRemove={handleRemoveListing} />;
      case "boost":
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">Boost Sasa</h2>
            <p className="text-gray-600 mt-2">Ongeza mwonekano wa bidhaa yako mara 3</p>
            <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
              <p className="text-gray-500">Chagua mali unayotaka ku-boost</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {listings.filter(l => l.status === "live").map((listing) => (
                  <div key={listing.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-sm">{listing.title}</span>
                      <p className="text-xs text-gray-500">{listing.location}</p>
                    </div>
                    <button className="bg-[#E8A33D] text-[#101A2E] px-4 py-2 rounded-lg text-sm font-semibold">
                      Boost
                    </button>
                  </div>
                ))}
                {listings.filter(l => l.status === "live").length === 0 && (
                  <p className="text-gray-400 col-span-2 text-center py-8">
                    Hakuna mali live za ku-boost.<br />
                    <span className="text-xs">Weka mali mpya kwanza.</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case "deals":
        return <DealRoom userRole="seller" deals={dealRooms} />;
      case "transactions":
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">My Transactions</h2>
            <p className="text-gray-600 mt-2">Fuatilia malipo na miamala yako</p>
            <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
              <div className="py-8">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="1.5" className="mx-auto text-gray-300">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                <p className="text-gray-400 mt-2">Hakuna miamala bado</p>
                <p className="text-gray-400 text-xs">Miamala yako yote itaonekana hapa</p>
              </div>
            </div>
          </div>
        );
      default:
        return <MyListings listings={listings} onRemove={handleRemoveListing} />;
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
