import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx"; // Hii ndio file uliyonipa
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


function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotpasswordPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/kuhusu" element={<AboutPage />} />
            <Route path="/mawasiliano" element={<ContactPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/dashboard/seller" element={<SellerDashboard />} />
            <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
            <Route path="/dashboard" element={<SellerDashboard />} /> 
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
