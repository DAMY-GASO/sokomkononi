import React from "react";
import { Link } from "react-router-dom";

export default function Footer({ selectedLang = "sw" }) {
  return (
    <footer className="bg-[#0D1524] text-white/80 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Grid - 2 columns on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          
          {/* Column 1: Brand - Full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#0D1524] font-bold text-sm">
                S
              </span>
              <span className="text-white font-bold text-lg tracking-tight">SokoMkononi</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              {selectedLang === "sw" 
                ? "Jukwaa la kuaminika la kununua na kuuza mali nchini Tanzania." 
                : "A trusted platform for buying and selling property in Tanzania."}
            </p>
            <div className="flex gap-3 mt-4 flex-wrap">
              <a href="#" className="text-white/40 hover:text-[#E8A33D] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
    
              </a>
              <a href="#" className="text-white/40 hover:text-[#E8A33D] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="#" className="text-white/40 hover:text-[#E8A33D] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a href="#" className="text-white/40 hover:text-[#E8A33D] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">
              {selectedLang === "sw" ? "Haraka" : "Quick Links"}
            </h3>
            <ul className="space-y-2.5">
              <li><Link to="/kategoria/nyumba" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Nyumba" : "Houses"}</Link></li>
              <li><Link to="/kategoria/magari" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Magari" : "Cars"}</Link></li>
              <li><Link to="/kategoria/viwanja" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Viwanja" : "Land"}</Link></li>
              <li><Link to="/kategoria/biashara" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Biashara" : "Business"}</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">
              {selectedLang === "sw" ? "Kampuni" : "Company"}
            </h3>
            <ul className="space-y-2.5">
              <li><Link to="/kuhusu" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Kuhusu Sisi" : "About Us"}</Link></li>
              <li><Link to="/mawasiliano" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Wasiliana Nasi" : "Contact Us"}</Link></li>
              <li><Link to="/kazi-kwetu" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Kazi Kwetu" : "Careers"}</Link></li>
              
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">
              {selectedLang === "sw" ? "Msaada" : "Support"}
            </h3>
            <ul className="space-y-2.5">
              <li><Link to="/faq" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Maswali" : "FAQ"}</Link></li>
              <li><Link to="/usalama" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Usalama" : "Safety"}</Link></li>
              <li><Link to="/faragha" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Sera ya Faragha" : "Privacy Policy"}</Link></li>
              <li><Link to="/vigezo" className="text-white/50 hover:text-white text-sm transition-colors">{selectedLang === "sw" ? "Vigezo vya Matumizi" : "Terms of Use"}</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-white font-semibold text-sm">
                {selectedLang === "sw" ? "Jiandikishe Kupata Taarifa" : "Subscribe to Newsletter"}
              </h4>
              <p className="text-white/40 text-sm mt-1">
                {selectedLang === "sw" 
                  ? "Pata taarifa za mali mpya na matangazo maalum." 
                  : "Get updates on new properties and special offers."}
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder={selectedLang === "sw" ? "Barua pepe yako" : "Your email"}
                className="flex-1 md:w-64 bg-white/5 border border-white/10 rounded-md px-4 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#E8A33D]"
              />
              <button className="bg-[#E8A33D] hover:bg-[#B87A1F] text-[#0D1524] font-semibold text-sm px-4 py-2 rounded-md transition-colors whitespace-nowrap">
                {selectedLang === "sw" ? "Jiandikishe" : "Subscribe"}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs text-center md:text-left">
            © {new Date().getFullYear()} SokoMkononi. 
            {selectedLang === "sw" ? " Haki zote zimehifadhiwa." : " All rights reserved."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-white/30 text-xs">
            <span>{selectedLang === "sw" ? "Malipo yanayokubaliwa:" : "Payments accepted:"}</span>
            <span className="text-white/50 font-medium">M-Pesa</span>
            <span className="text-white/20">|</span>
            <span className="text-white/50 font-medium">Mixx by Yas</span>
            <span className="text-white/20">|</span>
            <span className="text-white/50 font-medium">Airtel Money</span>
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
