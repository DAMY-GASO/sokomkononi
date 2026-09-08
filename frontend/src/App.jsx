import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./index.css";

// Home Page Component
function HomePage() {
  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="bg-night text-sand p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-gold rounded-md flex items-center justify-center text-night font-bold">
              S
            </span>
            <span className="font-bold text-xl">SokoMkononi</span>
          </div>
          <div className="flex gap-4">
            <button className="text-sand/70 hover:text-sand">Ingia</button>
            <button className="bg-gold text-night px-4 py-2 rounded-md font-semibold">
              Weka Tangazo
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-night text-sand px-5 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Nunua na Uza Mali kwa Urahisi
          </h1>
          <p className="text-sand/70 text-lg mb-8 max-w-2xl mx-auto">
            SokoMkononi ni jukwaa salama la kununua na kuuza nyumba, magari, viwanja na mali nyingine.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="bg-gold hover:bg-gold-dark text-night px-8 py-3 rounded-md font-semibold">
              Nunua Sasa
            </button>
            <button className="border border-market text-market bg-market/10 hover:bg-market/20 px-8 py-3 rounded-md font-semibold">
              Uza Bidhaa
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-bold text-ink-primary mb-8">Kategoria Maarufu</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Nyumba", "Magari", "Viwanja", "Biashara"].map((cat) => (
            <div key={cat} className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-100">
              <div className="w-12 h-12 bg-gold/10 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                🏠
              </div>
              <h3 className="font-semibold text-ink-primary">{cat}</h3>
              <p className="text-ink-muted text-sm">1,000+</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 max-w-md mx-auto shadow-lg">
        {[
          { icon: "🏠", label: "Home", path: "/" },
          { icon: "⭐", label: "Saved", path: "/saved" },
          { icon: "➕", label: "Sell", path: "/sell" },
          { icon: "💬", label: "Messages", path: "/messages" },
          { icon: "👤", label: "Profile", path: "/profile" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center text-ink-muted hover:text-gold text-xs"
          >
            <span className="text-2xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
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
