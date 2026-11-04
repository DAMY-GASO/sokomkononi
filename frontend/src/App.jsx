import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./context/LanguageContext.jsx";
import ScrollToHash from "./components/ScrollToHash.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { ConfirmProvider } from "./components/ConfirmDialog.jsx";
import PaymentReturnRoute from "./components/PaymentReturnRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { AttributionProvider } from "./context/AttributionContext.jsx";

import { installUnauthorizedHandler } from "./config/authStore.js";
import UndoToast from "./components/UndoToast.jsx";
import { ADMIN_PATH, ADMIN_LOGIN_PATH } from "./config/adminPath.js";

import { initializeCategories, hydrateCategoriesFromApi } from "./config/categoriesStore.js";
import { hydrateListingsFromApi, sweepGhostListings } from "./config/listingsStore.js";
import { hydrateReservationFromApi } from "./config/feePolicy.js";

import AuthCallback from "./pages/Auth/AuthCallback.jsx"; 
import { getTheme, applyTheme } from "./config/themeStore.js";

import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import JinsiYaKununuaNaKuuza from "./pages/JinsiYaKununuaNaKuuza.jsx";
import InviteFriendsPage from "./pages/InviteFriendsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

import LoginPage from "./pages/Auth/LoginPage.jsx";
import RegisterPage from "./pages/Auth/RegisterPage.jsx";
import ForgotpasswordPage from "./pages/Auth/ForgotpasswordPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";

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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

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
  
    if (typeof window !== "undefined" && !window.__SMK_LANG__) {
      const saved = (() => {
        try {
          return localStorage.getItem("preferred_language");
        } catch {
          return null;
        }
      })();
      window.__SMK_LANG__ = saved === "en" ? "en" : "sw";
    }

    installUnauthorizedHandler();
    initializeCategories();
    sweepGhostListings();
    (async () => {
      await Promise.allSettled([
        hydrateCategoriesFromApi(),
        hydrateListingsFromApi(),
        hydrateReservationFromApi(),
      ]);
    })();
  }, []);

  return (
    <LanguageProvider>
      <AttributionProvider>
        <ToastProvider>
          <UndoToast />
          <ConfirmProvider>
            <Router>
              {/* ✅ Inasaidia gestures za simu na kurudi juu kwa ukurasa mpya */}
              <ScrollToTop />
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
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* PAYMENT RETURN — after FimiPay card redirect */}
                <Route path="/payments/return" element={<PaymentReturnRoute />} />

                {/* PROPERTY & SEARCH */}
                <Route path="/mali/:id" element={<PropertyDetailPage />} />
                <Route path="/property/:id" element={<PropertyDetailPage />} />
                <Route path="/kategoria" element={<AllCategoriesPage />} />
                <Route path="/kategoria/:slug" element={<CategoryPage />} />
                <Route path="/tafuta" element={<BrowseRoute />} />
                <Route path="/mali-zote" element={<AllListingsPage />} />
                <Route path="/bundles" element={<BundlesPage />} />

                {/* DASHBOARD — SELLER + BUYER
                    Route MOJA: DashboardShell inajengwa mara moja tu na
                    inasoma URL yenyewe (URL_TO_STATE). Hakuna remount kati ya kurasa. */}
                <Route path="/dashboard/*" element={<DashboardShell />} />

                {/* ADMIN */}
                <Route path={ADMIN_LOGIN_PATH} element={<AdminLoginPage />} />
                <Route path={ADMIN_PATH} element={
                  <ErrorBoundary><AdminDashboard /></ErrorBoundary>
                } />
                <Route path={`${ADMIN_PATH}/*`} element={
                  <ErrorBoundary><AdminDashboard /></ErrorBoundary>
                } />
                <Route path="/admin/*" element={<NotFoundPage />} />
                <Route path="/admin" element={<NotFoundPage />} />

                {/* PROFILE */}
                <Route path="/wasifu" element={<ProfilePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/alika-marafiki" element={<InviteFriendsPage />} />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
          </ConfirmProvider>
        </ToastProvider>
      </AttributionProvider>
    </LanguageProvider>
  );
}

export default App;