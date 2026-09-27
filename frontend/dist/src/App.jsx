import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./context/LanguageContext.jsx";
import ScrollToHash from "./components/ScrollToHash.jsx";

import { installUnauthorizedHandler } from "./config/authStore.js";
import { ADMIN_PATH, ADMIN_LOGIN_PATH } from "./config/adminPath.js";

import { initializeCategories, hydrateCategoriesFromApi } from "./config/categoriesStore.js";
import { initializeBundles } from "./config/bundlesStore.js";
import { hydrateListingsFromApi } from "./config/listingsStore.js";

// Public pages
import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import JinsiYaKununuaNaKuuza from "./pages/JinsiYaKununuaNaKuuza.jsx";
import InviteFriendsPage from "./pages/InviteFriendsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

// Auth
import LoginPage from "./pages/Auth/LoginPage.jsx";
import RegisterPage from "./pages/Auth/RegisterPage.jsx";
import WaitlistPage from "./pages/Auth/WaitlistPage.jsx";
import ForgotpasswordPage from "./pages/Auth/ForgotpasswordPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";

// Property & search
import PropertyDetailPage from "./pages/PropertyDetailPage.jsx";
import AllCategoriesPage from "./pages/AllCategoriesPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import AllListingsPage from "./pages/AllListingsPage.jsx";
import BrowseProperties from "./pages/dashboard/components/BrowseProperties.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import BottomNav from "./components/BottomNav.jsx";

import ProfilePage from "./pages/ProfilePage.jsx";
import BundlesPage from "./pages/BundlesPage.jsx";
import DashboardShell from "./pages/dashboard/components/DashboardShell.jsx";
import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";

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
  useEffect(() => {
    installUnauthorizedHandler();

    initializeCategories();
    initializeBundles();

    (async () => {
      await Promise.allSettled([
        hydrateCategoriesFromApi(),
        hydrateListingsFromApi(),
      ]);
    })();
  }, []);

  return (
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

          {/* ADMIN — SECRET PATHS */}
          <Route path={ADMIN_LOGIN_PATH} element={<AdminLoginPage />} />
          <Route path={ADMIN_PATH} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/dashboard`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/overview`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/users`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/moderation`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/verification`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/deals`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/revenue`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/bundles`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/promotions`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/reports`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/support`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/content`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/audit`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/system`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/staff`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/profile`} element={<AdminDashboard />} />
          <Route path={`${ADMIN_PATH}/trash`} element={<AdminDashboard />} />

          {/* LEGACY /admin/* — render 404 so the secret path stays secret */}
          <Route path="/admin/*" element={<NotFoundPage />} />
          <Route path="/admin" element={<NotFoundPage />} />

          {/* PROFILE */}
          <Route path="/wasifu" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/alika-marafiki" element={<InviteFriendsPage />} />

          {/* REAL 404 — replaces old "/* → HomePage" */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
