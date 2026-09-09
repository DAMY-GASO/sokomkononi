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
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
