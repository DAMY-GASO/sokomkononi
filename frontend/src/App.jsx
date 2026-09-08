import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./index.css";

function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="bg-[#101A2E] text-white border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button className="md:hidden text-white p-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">S</span>
              <span className="font-bold text-base sm:text-lg">SokoMkononi</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-white/70 hover:text-white text-sm">Nyumba</a>
            <a href="#" className="text-white/70 hover:text-white text-sm">Magari</a>
            <a href="#" className="text-white/70 hover:text-white text-sm">Viwanja</a>
            <a href="#" className="text-white/70 hover:text-white text-sm">Biashara</a>
          </nav>

          {/* Right: Search + Language + Auth */}
          <div className="flex items-center gap-3">
            <button className="text-white/60 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            <button className="text-white/60 hover:text-white text-sm border border-white/15 rounded-md px-2 py-1">
              SW
            </button>
            <Link to="/login" className="hidden sm:inline text-white/80 hover:text-white text-sm">Ingia</Link>
            <Link to="/register" className="hidden sm:inline bg-[#E8A33D] text-[#101A2E] font-semibold text-sm px-4 py-2 rounded-md">Weka Tangazo</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#101A2E] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#E8A33D] text-sm font-semibold">Soko la Kidijitali la Mali</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-3">Nunua na Uza Mali kwa Urahisi</h1>
          <p className="text-white/70 text-base mt-4 max-w-2xl mx-auto">
            SokoMkononi ni jukwaa salama la kununua na kuuza nyumba, magari, viwanja na mali nyingine.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link to="/register" className="bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold px-6 py-3 rounded-md">Nunua Sasa</Link>
            <Link to="/register" className="border border-[#2F6D4F] text-[#2F6D4F] bg-[#2F6D4F]/10 hover:bg-[#2F6D4F]/20 font-semibold px-6 py-3 rounded-md">Uza Bidhaa</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Kategoria Maarufu</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {['Nyumba', 'Viwanja', 'Magari', 'Biashara', 'Mashine'].map((cat, i) => (
            <div key={i} className="bg-[#F5F3EC] rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <div className="text-3xl mb-2">🏠</div>
              <h3 className="font-semibold text-gray-800">{cat}</h3>
              <p className="text-sm text-gray-500">1,000+</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Navigation - Mobile only */}
      <nav className="bottom-nav">
        <Link to="/" className="nav-item active">
          <span>🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/saved" className="nav-item">
          <span>⭐</span>
          <span>Saved</span>
        </Link>
        <Link to="/register" className="nav-item sell-btn">
          <span>➕</span>
          <span>Sell</span>
        </Link>
        <Link to="/messages" className="nav-item">
          <span>💬</span>
          <span>Messages</span>
          <span className="badge">2</span>
        </Link>
        <Link to="/profile" className="nav-item">
          <span>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
