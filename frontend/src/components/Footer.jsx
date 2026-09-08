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
              <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0 fill-white" aria-hidden="true">
                <path d="M17.523 15.3414c-.5511 0-.9997-.4486-.9997-.9997s.4486-.9997.9997-.9997.9997.4486.9997.9997-.4486.9997-.9997.9997m-11.046 0c-.5511 0-.9997-.4486-.9997-.9997s.4486-.9997.9997-.9997.9997.4486.9997.9997-.4486.9997-.9997.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
              </svg>
              <span className="text-sm text-left">
                <span className="block text-white/50 text-[10px]">{selectedLang === "sw" ? "Pakua kwenye" : "Get it on"}</span>
                <span className="block font-semibold text-white text-sm">Google Play</span>
              </span>
            </Link>
            <Link to="/app" className="flex items-center gap-2 border border-white/20 rounded-md px-5 py-2.5 hover:bg-white/5 transition-colors">
              <svg viewBox="0 0 384 512" className="w-6 h-6 shrink-0 fill-white" aria-hidden="true">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.3c0 26.2 4.8 53.3 14.4 81.3 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.8zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              <span className="text-sm text-left">
                <span className="block text-white/50 text-[10px]">{selectedLang === "sw" ? "Pakua kwenye" : "Download on the"}</span>
                <span className="block font-semibold text-white text-sm">App Store</span>
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
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-none stroke-[#E8A33D] stroke-2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0-.828.672-1.5 1.5-1.5h16.5c.828 0 1.5.672 1.5 1.5v10.5c0 .828-.672 1.5-1.5 1.5H3.75c-.828 0-1.5-.672-1.5-1.5V6.75z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75l9.75 6.75 9.75-6.75" />
                </svg>
                <a href="mailto:info@sokomkononi.co.tz" className="hover:text-white transition-colors">info@sokomkononi.co.tz</a>
              </li>
              <li className="text-white/50 text-sm flex items-center justify-center lg:justify-start gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-none stroke-[#E8A33D] stroke-2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 4.5a1.5 1.5 0 011.5-1.5h2.086a1.5 1.5 0 011.42 1.023l1.14 3.42a1.5 1.5 0 01-.4 1.583L6.63 10.39a12.03 12.03 0 006.98 6.98l1.365-1.366a1.5 1.5 0 011.583-.4l3.42 1.14a1.5 1.5 0 011.023 1.42v2.086a1.5 1.5 0 01-1.5 1.5H18.75C9.646 21.75 2.25 14.354 2.25 5.25V4.5z" />
                </svg>
                <span>0743 895 038</span>
              </li>
              <li className="text-white/50 text-sm flex items-center justify-center lg:justify-start gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-none stroke-[#E8A33D] stroke-2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
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

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-white/30 text-xs">{selectedLang === "sw" ? "Malipo yanayokubaliwa:" : "Payments accepted:"}</span>
            {[
              { file: "mpesa.svg", alt: "M-Pesa" },
              { file: "halopesa.svg", alt: "HaloPesa" },
              { file: "mixx-by-yas.svg", alt: "Mixx by Yas" },
              { file: "airtel-money.svg", alt: "Airtel Money" },
              { file: "nmb.svg", alt: "NMB" },
              { file: "crdb.svg", alt: "CRDB" },
              { file: "visa.svg", alt: "Visa" },
              { file: "mastercard.svg", alt: "Mastercard" },
            ].map((logo) => (
              <span
                key={logo.file}
                className="flex items-center justify-center h-6 px-2 rounded bg-white/95"
                title={logo.alt}
              >
                <img
                  src={`/assets/payments/${logo.file}`}
                  alt={logo.alt}
                  className="h-4 w-auto object-contain"
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
