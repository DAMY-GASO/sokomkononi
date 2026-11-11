// ============================================================
// App.jsx
//
// Marekebisho:
//  ✅ MPYA: `registerRestoreHandlers` inasajiliwa kabla ya Router
//     ili undo ya listings ifanye kazi HATA baada ya refresh
//     (memory callbacks zinapotea, lakini handler inabaki).
//  ✅ Kila kitu kingine kimebaki kama kilivyo.
// ============================================================
import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./context/LanguageContext.jsx";
import ScrollToHash from "./components/ScrollToHash.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { ConfirmProvider } from "./components/ConfirmDialog.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { AttributionProvider } from "./context/AttributionContext.jsx";

import { installUnauthorizedHandler } from "./config/authStore.js";
import UndoToast from "./components/UndoToast.jsx";
import { ADMIN_PATH, ADMIN_LOGIN_PATH } from "./config/adminPath.js";

// Hizi tunazihitaji papo hapo kwa sababu zinahusiana na Bootstrap
import { initializeCategories, hydrateCategoriesFromApi } from "./config/categoriesStore.js";
import { hydrateListingsFromApi, sweepGhostListings } from "./config/listingsStore.js";
import { hydrateReservationFromApi } from "./config/feePolicy.js";

// ✅ MPYA: Sajili ya restore handlers kwa undo
// Hii inaruhusu undo ya listings kufanya kazi HATA baada ya refresh
// (memory callbacks zinapotea, lakini handler hii inabaki kwenye code).
import { registerRestoreHandlers } from "./config/undoStore.js";
import { restoreListingAsync } from "./config/listingsStore.js";

// ── LAZY LOADED COMPONENTS ──
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const TermsPage = lazy(() => import("./pages/TermsPage.jsx"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage.jsx"));
const JinsiYaKununuaNaKuuza = lazy(() => import("./pages/JinsiYaKununuaNaKuuza.jsx"));
const InviteFriendsPage = lazy(() => import("./pages/InviteFriendsPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

const LoginPage = lazy(() => import("./pages/Auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/Auth/RegisterPage.jsx"));
const ForgotpasswordPage = lazy(() => import("./pages/Auth/ForgotpasswordPage.jsx"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage.jsx"));
const AuthCallback = lazy(() => import("./pages/Auth/AuthCallback.jsx"));

const PropertyDetailPage = lazy(() => import("./pages/PropertyDetailPage.jsx"));
const AllCategoriesPage = lazy(() => import("./pages/AllCategoriesPage.jsx"));
const CategoryPage = lazy(() => import("./pages/CategoryPage.jsx"));
const AllListingsPage = lazy(() => import("./pages/AllListingsPage.jsx"));
const BrowseProperties = lazy(() => import("./pages/dashboard/components/BrowseProperties.jsx"));

const Navbar = lazy(() => import("./components/Navbar.jsx"));
const Footer = lazy(() => import("./components/Footer.jsx"));
const BottomNav = lazy(() => import("./components/BottomNav.jsx"));

const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
const BundlesPage = lazy(() => import("./pages/BundlesPage.jsx"));
const DashboardShell = lazy(() => import("./pages/dashboard/components/DashboardShell.jsx"));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard.jsx"));

const PaymentReturnRoute = lazy(() => import("./components/PaymentReturnRoute.jsx"));

// ── LOADER COMPONENT ──
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-sand">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-night">Inapakia...</p>
      </div>
    </div>
  );
}

registerRestoreHandlers({
  listing: async (itemOrIds) => {
    const ids = Array.isArray(itemOrIds)
      ? itemOrIds
      : itemOrIds != null
        ? [itemOrIds]
        : [];
    if (ids.length === 0) {
      return { ok: false, error: new Error("No listing id") };
    }
    const errors = [];
    for (const id of ids) {
      try {
        const res = await restoreListingAsync(id);
        if (res && res.ok === false) {
          errors.push({ id, error: res.error });
        }
      } catch (err) {
        errors.push({ id, error: err });
      }
    }
    if (errors.length > 0) {
      return {
        ok: false,
        error:
          errors[0].error ||
          new Error(`${errors.length} listing(s) failed to restore`),
      };
    }
    return { ok: true };
  },
});

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
              <ScrollToHash />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* PUBLIC */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/kuhusu" element={<AboutPage />} />
                  <Route path="/mawasiliano" element={<ContactPage />} />
                  <Route path="/sheria" element={<TermsPage />} />
                  <Route path="/faragha" element={<PrivacyPage />} />
                  <Route path="/jinsi-ya-kununua" element={<JinsiYaKununuaNaKuuza />} />
                  <Route
                    path="/jinsi-ya-kuuza"
                    element={<Navigate to="/jinsi-ya-kununua#kuuza" replace />}
                  />

                  {/* AUTH */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotpasswordPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* PAYMENT RETURN */}
                  <Route path="/payments/return" element={<PaymentReturnRoute />} />

                  {/* PROPERTY & SEARCH */}
                  <Route path="/mali/:id" element={<PropertyDetailPage />} />
                  <Route path="/property/:id" element={<PropertyDetailPage />} />
                  <Route path="/kategoria" element={<AllCategoriesPage />} />
                  <Route path="/kategoria/:slug" element={<CategoryPage />} />
                  <Route path="/tafuta" element={<BrowseRoute />} />
                  <Route path="/mali-zote" element={<AllListingsPage />} />
                  <Route path="/bundles" element={<BundlesPage />} />

                  {/* DASHBOARD */}
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
              </Suspense>
            </Router>
          </ConfirmProvider>
        </ToastProvider>
      </AttributionProvider>
    </LanguageProvider>
  );
}

export default App;