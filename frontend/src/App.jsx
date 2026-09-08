import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Navbar from "./components/Navbar.jsx";
import "./index.css";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="app-wrapper">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
