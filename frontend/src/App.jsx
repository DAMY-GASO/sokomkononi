import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DealRoomPage from "./pages/DealRoomPage.jsx";
import PropertyDetailPage from "./pages/PropertyDetailPage.jsx";
import ComingSoonAppPage from "./pages/ComingSoonAppPage.jsx";
import BottomNav from "./components/BottomNav.jsx";

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div className="app-wrapper">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/deal-rooms/:id" element={<DealRoomPage />} />
                <Route path="/property/:id" element={<PropertyDetailPage />} />
                <Route path="/app" element={<ComingSoonAppPage />} />
                <Route path="/kategoria/:category" element={<LandingPage />} />
                <Route path="/login" element={<LandingPage />} />
                <Route path="/register" element={<LandingPage />} />
                <Route path="/kuhusu" element={<LandingPage />} />
                <Route path="/mawasiliano" element={<LandingPage />} />
                <Route path="/kazi-kwetu" element={<LandingPage />} />
                <Route path="/faq" element={<LandingPage />} />
                <Route path="/usalama" element={<LandingPage />} />
                <Route path="/vigezo-vya-matumizi" element={<LandingPage />} />
                <Route path="/faragha" element={<LandingPage />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
