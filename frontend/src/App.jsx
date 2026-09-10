import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import LoginPage from "./pages/Auth/LoginPage.jsx";
import RegisterPage from "./pages/Auth/RegisterPage.jsx";
import WaitlistPage from "./pages/Auth/WaitlistPage.jsx";
import ForgotpasswordPage from "./pages/Auth/ForgotpasswordPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import SellerDashboard from "./pages/dashboard/SellerDashboard.jsx";
import BuyerDashboard from "./pages/dashboard/BuyerDashboard.jsx";
import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";
import PropertyDetailPage from "./pages/PropertyDetailPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ScrollToHash from "./components/ScrollToHash.jsx";

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <ScrollToHash />
          <Routes>
            {/* ============================================================ */}
            {/* PUBLIC ROUTES */}
            {/* ============================================================ */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotpasswordPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/kuhusu" element={<AboutPage />} />
            <Route path="/mawasiliano" element={<ContactPage />} />
            <Route path="/sheria" element={<TermsPage />} />
            <Route path="/faragha" element={<PrivacyPage />} />

            {/* ============================================================ */}
            {/* PROPERTY & SEARCH ROUTES */}
            {/* ============================================================ */}
            <Route path="/mali/:id" element={<PropertyDetailPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/kategoria" element={<CategoryPage />} />
            <Route path="/kategoria/:slug" element={<CategoryPage />} />
            <Route path="/tafuta" element={<SearchResultsPage />} />
            <Route path="/search" element={<SearchResultsPage />} />

            {/* ============================================================ */}
            {/* DASHBOARD ROUTES - SELLER */}
            {/* ============================================================ */}
            <Route path="/dashboard" element={<SellerDashboard />} />
            <Route path="/dashboard/seller" element={<SellerDashboard />} />
            <Route path="/dashboard/saved" element={<SellerDashboard />} />
            <Route path="/dashboard/messages" element={<SellerDashboard />} />
            <Route path="/dashboard/notifications" element={<SellerDashboard />} />
            <Route path="/dashboard/transactions" element={<SellerDashboard />} />
            <Route path="/dashboard/boost" element={<SellerDashboard />} />
            <Route path="/dashboard/deals" element={<SellerDashboard />} />
            <Route path="/dashboard/post" element={<SellerDashboard />} />
            <Route path="/dashboard/listings" element={<SellerDashboard />} />

            {/* ============================================================ */}
            {/* DASHBOARD ROUTES - BUYER */}
            {/* ============================================================ */}
            <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
            <Route path="/dashboard/buyer/saved" element={<BuyerDashboard />} />
            <Route path="/dashboard/buyer/messages" element={<BuyerDashboard />} />
            <Route path="/dashboard/buyer/notifications" element={<BuyerDashboard />} />
            <Route path="/dashboard/buyer/transactions" element={<BuyerDashboard />} />

            {/* ============================================================ */}
            {/* ADMIN ROUTES */}
            {/* ============================================================ */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* ============================================================ */}
            {/* PROFILE ROUTES */}
            {/* ============================================================ */}
            <Route path="/wasifu" element={<ProfilePage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* ============================================================ */}
            {/* FALLBACK - LAZIMA IWE YA MWISHO */}
            {/* ============================================================ */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
