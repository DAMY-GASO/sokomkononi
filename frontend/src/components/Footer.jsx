import React from "react";
import { Link } from "react-router-dom";

export default function Footer({ selectedLang = "sw" }) {
  return (
    <footer className="bg-[#0D1524] text-white/80 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* ============================================================ */}
        {/* APP DOWNLOAD SECTION - Separate from main footer */}
        {/* ============================================================ */}
        <div className="text-center mb-10 pb-8 border-b border-white/10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
            {selectedLang === "sw" ? "PAKUA SOKOMKONONI APP" : "DOWNLOAD SOKOMKONONI APP"}
          </h2>
          <p className="text-white/50 text-sm max-w-2xl mx-auto">
            {selectedLang === "sw" 
              ? "Fanya biashara kwa urahisi zaidi ukiwa popote — pata taarifa za deals zako, tafuta mali, na wasiliana na Madalali/Wateja moja kwa moja kutoka simu yako." 
              : "Do business more easily wherever you are — get deal notifications, search properties, and communicate with Agents/Customers directly from your phone."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            <Link to="/app" className="flex items-center gap-2 border border-white/20 rounded-md px-5 py-2.5 hover:bg-white/5 transition-colors">
              <span className="text-2xl">📱</span>
              <span className="text-sm text-left">
                <span className="block text-white/50 text-[10px]">{selectedLang === "sw" ? "Pakua" : "Download"}</span>
                <span className="block font-semibold text-white text-sm">Android App</span>
              </span>
            </Link>
            <Link to="/app" className="flex items-center gap-2 border border-white/20 rounded-md px-5 py-2.5 hover:bg-white/5 transition-colors">
              <span className="text-2xl">🍎</span>
              <span className="text-sm text-left">
                <span className="block text-white/50 text-[10px]">{selectedLang === "sw" ? "Pakua" : "Download"}</span>
                <span className="block font-semibold text-white text-sm">iOS App</span>
              </span>
            </Link>
          </div>
         
        </div>

        {/* ============================================================ */}
        {/* MAIN FOOTER GRID */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Column 1: Brand - Centered on mobile, left on desktop */}
          <div className="col-span-2 lg:col-span-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
              <span className="w-8 h-8 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#0D1524] font-bold text-sm">
                S
              </span>
              <span className="text-white font-bold text-lg tracking-tight">SokoMkononi</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">
              {selectedLang === "sw" 
                ? "SokoMkononi ni jukwaa lako la kidijitali linalokuletea soko kiganjani mwako. Tunakuunganisha na wauzaji na wanunuzi kwa urahisi, usalama na uaminifu." 
                : "SokoMkononi is your digital marketplace bringing the market to your fingertips. We connect you with sellers and buyers with ease, security and trust."}
            </p>
          </div>

          {/* Column 2: Quick Links - Centered on mobile, left on desktop */}
          <div className="text-center lg:text-left">
            <h3 className="text-white font-semibold text-sm mb-4 underline underline-offset-4">
              {selectedLang === "sw" ? "VIUNGO VYA HARAKA" : "QUICK LINKS"}
            </h3>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Nyumbani" : "Home"}</Link></li>
              <li><Link to="/kategoria" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Kategoria za Bidhaa" : "Product Categories"}</Link></li>
              <li><Link to="/kuhusu" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Kuhusu Mfumo" : "About System"}</Link></li>
              <li><Link to="/bidhaa" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Bidhaa Zilizoorodheshwa" : "Listed Products"}</Link></li>
              <li><Link to="/testimonials" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Watu Wanasema Nini" : "What People Say"}</Link></li>
            </ul>
          </div>

          {/* Column 3: Safety - Centered on mobile, left on desktop */}
          <div className="text-center lg:text-left">
            <h3 className="text-white font-semibold text-sm mb-4 underline underline-offset-4">
              {selectedLang === "sw" ? "USALAMA WETU" : "OUR SAFETY"}
            </h3>
            <ul className="space-y-2.5">
              <li className="text-white/50 text-sm">✓ HTTPS / SSL</li>
              <li className="text-white/50 text-sm">✓ {selectedLang === "sw" ? "Udhibiti wa Ufikiaji kwa Majukumu" : "Role-Based Access Control"}</li>
              <li className="text-white/50 text-sm">✓ {selectedLang === "sw" ? "Ufungaji wa Nenosiri" : "Password Hashing"}</li>
              <li className="text-white/50 text-sm">✓ {selectedLang === "sw" ? "Rekodi za Ukaguzi" : "Audit Logs"}</li>
            </ul>
          </div>

          {/* Column 4: Legal & Privacy - Centered on mobile, left on desktop */}
          <div className="text-center lg:text-left">
            <h3 className="text-white font-semibold text-sm mb-4 underline underline-offset-4">
              {selectedLang === "sw" ? "SHERIA NA FARAGHA" : "LEGAL & PRIVACY"}
            </h3>
            <ul className="space-y-2.5">
              <li><Link to="/sheria" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Sheria na Masharti" : "Terms & Conditions"}</Link></li>
              <li><Link to="/faragha" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Sera ya Faragha" : "Privacy Policy"}</Link></li>
              <li><Link to="/mawasiliano" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Wasiliana Nasi" : "Contact Us"}</Link></li>
            </ul>
          </div>

          {/* Column 5: Contact - Centered on mobile, left on desktop */}
          <div className="text-center lg:text-left">
            <h3 className="text-white font-semibold text-sm mb-4 underline underline-offset-4">
              {selectedLang === "sw" ? "WASILIANA NASI" : "CONTACT US"}
            </h3>
            <ul className="space-y-3">
              <li className="text-white/50 text-sm flex items-center justify-center lg:justify-start gap-2">
                <span className="text-[#E8A33D]">✉</span>
                <a href="mailto:info@sokomkononi.co.tz" className="hover:text-white transition-colors">info@sokomkononi.co.tz</a>
              </li>
              <li className="text-white/50 text-sm flex items-center justify-center lg:justify-start gap-2">
                <span className="text-[#E8A33D]">📞</span>
                <span>0743 895 038</span>
              </li>
              <li className="text-white/50 text-sm flex items-center justify-center lg:justify-start gap-2">
                <span className="text-[#E8A33D]">📍</span>
                <span>Dar es Salaam, Tanzania</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs text-center md:text-left">
            © {new Date().getFullYear()} SokoMkononi. 
            {selectedLang === "sw" ? " Haki zote zimehifadhiwa." : " All rights reserved."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-white/30 text-xs">
            <span>{selectedLang === "sw" ? "Malipo yanayokubaliwa:" : "Payments accepted:"}</span>
            <span className="text-white/50 font-medium">M-Pesa</span>
            <span className="text-white/20">|</span>
            <span className="text-white/50 font-medium">HaloPesa</span>
            <span className="text-white/20">|</span>
            <span className="text-white/50 font-medium">Mixx by Yas</span>
            <span className="text-white/20">|</span>
            <span className="text-white/50 font-medium">Airtel Money</span>
            <span className="text-white/50 font-medium">NMB</span>
            <span className="text-white/20">|</span>
            <span className="text-white/50 font-medium">CRDB</span>
            <span className="text-white/20">|</span>
            <span className="text-white/20">|</span>
            <span className="text-white/50 font-medium">Visa</span>
            <span className="text-white/20">|</span>
            <span className="text-white/50 font-medium">Mastercard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
