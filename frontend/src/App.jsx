import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider, useLanguage } from "./context/LanguageContext.jsx";
import ScrollToHash from "./components/ScrollToHash.jsx";

// ============================================================
// INITIALIZE — categories + bundles za awali
// ============================================================
import {
  initializeCategories,
  hydrateCategoriesFromApi,
} from "./config/categoriesStore.js";
import { SEED_CATEGORIES } from "./config/seedCategories.js";
import { initializeBundles } from "./config/bundlesStore.js";
import { SEED_BUNDLES } from "./config/bundlesStore.js";
import { hydrateListingsFromApi } from "./config/listingsStore.js";

// ============================================================
// PUBLIC PAGES
// ============================================================
import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import JinsiYaKununuaNaKuuza from "./pages/JinsiYaKununuaNaKuuza.jsx";

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
import AllCategoriesPage from "./pages/AllCategoriesPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import AllListingsPage from "./pages/AllListingsPage.jsx";
import BrowseProperties from "./pages/dashboard/components/BrowseProperties.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import BottomNav from "./components/BottomNav.jsx";

// ============================================================
// PROFILE
// ============================================================
import ProfilePage from "./pages/ProfilePage.jsx";

// ============================================================
// BUNDLES
// ============================================================
import BundlesPage from "./pages/BundlesPage.jsx";

// ============================================================
// DASHBOARD
// ============================================================
import DashboardShell from "./pages/dashboard/components/DashboardShell.jsx";

// ============================================================
// ADMIN DASHBOARD
// ============================================================
import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";

// ============================================================
// BROWSE / TAFUTA wrapper
// ============================================================
function BrowseRoute() {
  const { lang } = useLanguage();
  return (
    <>
      <Navbar />
      <BrowseProperties lang={lang} />
      <Footer />
      <BottomNav />
    </>
  );
}

function App() {
  // ============================================================
  // INITIALIZE — categories + bundles + hydrate kutoka API
  // ============================================================
  useEffect(() => {
    // 1) Seed mara moja
    initializeCategories(SEED_CATEGORIES);
    initializeBundles(SEED_BUNDLES);

    // 2) Jaribu kupata data halisi kutoka API
    async function hydrateFromApi() {
      await Promise.allSettled([
        hydrateCategoriesFromApi(),
        hydrateListingsFromApi(),
      ]);
    }
    hydrateFromApi();
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <ScrollToHash />
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<HomePage />} />
            <Route path="/kuhusu" element={<AboutPage />} />
            <Route path="/mawasiliano" element={<ContactPage />} />
            <Route path="/sheria" element={<TermsPage />} />
            <Route path="/faragha" element={<PrivacyPage />} />
            <Route path="/jinsi-ya-kununua" element={<JinsiYaKununuaNaKuuza />} />

            {/* AUTH */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotpasswordPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />

            {/* PROPERTY & SEARCH */}
            <Route path="/mali/:id" element={<PropertyDetailPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/kategoria" element={<AllCategoriesPage />} />
            <Route path="/kategoria/:slug" element={<CategoryPage />} />
            <Route path="/tafuta" element={<BrowseRoute />} />
            <Route path="/mali-zote" element={<AllListingsPage />} />

            {/* BUNDLES */}
            <Route path="/bundles" element={<BundlesPage />} />

            {/* DASHBOARD — SELLER */}
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
            <Route path="/dashboard/activity" element={<DashboardShell />} />     

            {/* DASHBOARD — BUYER */}
            <Route path="/dashboard/buyer" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/overview" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/browse" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/saved" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/searches" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/bundles" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/deals" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/messages" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/notifications" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/waiting" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/transactions" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/safety" element={<DashboardShell />} />
            <Route path="/dashboard/buyer/activity" element={<DashboardShell />} />    

            {/* ADMIN */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/overview" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminDashboard />} />
            <Route path="/admin/moderation" element={<AdminDashboard />} />
            <Route path="/admin/verification" element={<AdminDashboard />} />
            <Route path="/admin/deals" element={<AdminDashboard />} />
            <Route path="/admin/revenue" element={<AdminDashboard />} />
            <Route path="/admin/bundles" element={<AdminDashboard />} />
            <Route path="/admin/promotions" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminDashboard />} />
            <Route path="/admin/support" element={<AdminDashboard />} />
            <Route path="/admin/content" element={<AdminDashboard />} />
            <Route path="/admin/audit" element={<AdminDashboard />} />
            <Route path="/admin/system" element={<AdminDashboard />} />
            <Route path="/admin/staff" element={<AdminDashboard />} />
            <Route path="/admin/profile" element={<AdminDashboard />} />

            {/* PROFILE */}
            <Route path="/wasifu" element={<ProfilePage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* FALLBACK */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
