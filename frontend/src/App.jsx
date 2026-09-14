import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import ScrollToHash from "./components/ScrollToHash.jsx";

// ============================================================
// INITIALIZE — categories + bundles za awali
// ============================================================
import {
  initializeCategories,
  getCategories,
} from "./config/categoriesStore.js";
import { SEED_CATEGORIES } from "./config/seedCategories.js";
import {
  initializeBundles,
  getBundles,
} from "./config/bundlesStore.js";
import { SEED_BUNDLES } from "./config/bundlesStore.js";

// ============================================================
// PUBLIC PAGES
// ============================================================
import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";

// ============================================================
// AUTH PAGES
// ============================================================
import LoginPage from "./pages/Auth/LoginPage.jsx";
import RegisterPage from "./pages/Auth/RegisterPage.jsx";
import WaitlistPage from "./pages/Auth/WaitlistPage.jsx";
import ForgotpasswordPage from "./pages/Auth/ForgotpasswordPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";

// ============================================================
// PROPERTY & SEARCH
// ============================================================
import PropertyDetailPage from "./pages/PropertyDetailPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.jsx";

// ============================================================
// PROFILE
// ============================================================
import ProfilePage from "./pages/ProfilePage.jsx";

// ============================================================
// BUNDLES (user + admin)
// ============================================================
import BundlesPage from "./pages/BundlesPage.jsx";
import AdminBundles from "./pages/AdminBundles.jsx";

// ============================================================
// DASHBOARD (Seller + Buyer — moja inashughulikia zote mbili)
// ============================================================
import DashboardShell from "./pages/dashboard/components/DashboardShell.jsx";

// ============================================================
// ADMIN DASHBOARD
// ============================================================
import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";

function App() {
  // ============================================================
  // INITIALIZE CATEGORIES + BUNDLES — mara moja tu
  // ============================================================
  // Inaweka categories 11 na bundles 20+ za awali KAMA bado
  // hazipo. Kama Admin ameongeza/kubadilisha, haitagusa
  // (inaheshimu mabadiliko yake).
  //
  // Backend halisi ikiwepo: ondoa hii, badala yake
  // stores zitafetch kutoka API kwenye hooks.
  // ============================================================
  useEffect(() => {
    // Categories
    initializeCategories(SEED_CATEGORIES);

    // Bundles
    initializeBundles(SEED_BUNDLES);

    // DEV PEKEE — ondoa comment kama unataka reset kila reload:
    // if (import.meta.env.DEV) {
    //   localStorage.removeItem("sokomkononi_categories_v2");
    //   localStorage.removeItem("sokomkononi_bundles_v1");
    //   initializeCategories(SEED_CATEGORIES);
    //   initializeBundles(SEED_BUNDLES);
    // }
  }, []);

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
            <Route path="/kuhusu" element={<AboutPage />} />
            <Route path="/mawasiliano" element={<ContactPage />} />
            <Route path="/sheria" element={<TermsPage />} />
            <Route path="/faragha" element={<PrivacyPage />} />

            {/* ============================================================ */}
            {/* AUTH ROUTES */}
            {/* ============================================================ */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotpasswordPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />

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
            {/* BUNDLES — user anaweza kununua bundle hapa */}
            {/* ============================================================ */}
            <Route path="/bundles" element={<BundlesPage />} />

            {/* ============================================================ */}
            {/* DASHBOARD ROUTES — SELLER SIDE */}
            {/* ============================================================ */}
            <Route path="/dashboard" element={<DashboardShell />} />
            <Route path="/dashboard/seller" element={<DashboardShell />} />
            <Route path="/dashboard/overview" element={<DashboardShell />} />
            <Route path="/dashboard/post" element={<DashboardShell />} />
            <Route path="/dashboard/listings" element={<DashboardShell />} />
            <Route path="/dashboard/leads" element={<DashboardShell />} />
            <Route path="/dashboard/saved" element={<DashboardShell />} />
            <Route path="/dashboard/boost" element={<DashboardShell />} />
            <Route path="/dashboard/leading" element={<DashboardShell />} />
            <Route path="/dashboard/advertise" element={<DashboardShell />} />
            <Route path="/dashboard/bundles" element={<DashboardShell />} />
            <Route path="/dashboard/deals" element={<DashboardShell />} />
            <Route path="/dashboard/messages" element={<DashboardShell />} />
            <Route path="/dashboard/notifications" element={<DashboardShell />} />
            <Route path="/dashboard/transactions" element={<DashboardShell />} />

            {/* ============================================================ */}
            {/* DASHBOARD ROUTES — BUYER SIDE */}
            {/* ============================================================ */}
            <Route path="/dashboard/buyer" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/overview" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/browse" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/saved" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/searches" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/bundles" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/messages" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/notifications" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/waiting" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/transactions" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/safety" element={<DashboardShell />} />

            {/* ============================================================ */}
            {/* ADMIN ROUTES */}
            {/* ============================================================ */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Dashboard — sections zote 13 + profile + bundles */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/overview" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminDashboard />} />
            <Route path="/admin/moderation" element={<AdminDashboard />} />
            <Route path="/admin/verification" element={<AdminDashboard />} />
            <Route path="/admin/deals" element={<AdminDashboard />} />
            <Route path="/admin/revenue" element={<AdminDashboard />} />
            <Route path="/admin/bundles" element={<AdminBundles />} />
            <Route path="/admin/promotions" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminDashboard />} />
            <Route path="/admin/support" element={<AdminDashboard />} />
            <Route path="/admin/content" element={<AdminDashboard />} />
            <Route path="/admin/audit" element={<AdminDashboard />} />
            <Route path="/admin/system" element={<AdminDashboard />} />
            <Route path="/admin/staff" element={<AdminDashboard />} />
            <Route path="/admin/profile" element={<AdminDashboard />} />

            {/* ============================================================ */}
            {/* PROFILE ROUTES */}
            {/* ============================================================ */}
            <Route path="/wasifu" element={<ProfilePage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* ============================================================ */}
            {/* FALLBACK — LAZIMA IWE YA MWISHO */}
            {/* ============================================================ */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;