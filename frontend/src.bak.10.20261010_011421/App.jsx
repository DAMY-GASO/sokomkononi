import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./context/LanguageContext.jsx";
import ScrollToHash from "./components/ScrollToHash.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { ConfirmProvider } from "./components/ConfirmDialog.jsx";
import PaymentReturnRoute from "./components/PaymentReturnRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

import { installUnauthorizedHandler } from "./config/authStore.js";
import UndoToast from "./components/UndoToast.jsx";
import { ADMIN_PATH, ADMIN_LOGIN_PATH } from "./config/adminPath.js";

import { initializeCategories, hydrateCategoriesFromApi } from "./config/categoriesStore.js";
import { hydrateListingsFromApi } from "./config/listingsStore.js";

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
    (async () => {
      await Promise.allSettled([
        hydrateCategoriesFromApi(),
        hydrateListingsFromApi(),
      ]);
    })();
  }, []);

  return (
    <LanguageProvider>
      <ToastProvider>
        <UndoToast />
        <ConfirmProvider>
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

              {/* DASHBOARD — SELLER */}
              <Route path="/dashboard" element={<DashboardShell />} />
              <Route path="/dashboard/seller" element={<DashboardShell />} />
              <Route path="/dashboard/overview" element={<DashboardShell />} />
              <Route path="/dashboard/post" element={<DashboardShell />} />
              <Route path="/dashboard/pay-listing" element={<DashboardShell />} />
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
              <Route path="/dashboard/verification" element={<DashboardShell />} />
              <Route path="/dashboard/listings/edit/:id" element={<DashboardShell />} />

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
              <Route path="/dashboard/buyer/verification" element={<DashboardShell />} />

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
    </LanguageProvider>
  );
}

export default App;
