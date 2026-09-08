import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-night-2 text-sand border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-gold flex items-center justify-center text-night font-bold text-sm">
                S
              </span>
              <span className="font-bold text-lg tracking-tight">Soko</span>
            </Link>
            <p className="text-sand/60 text-sm mt-3 max-w-xs leading-relaxed">
              Jukwaa la kuaminika la kununua na kuuza mali nchini Tanzania.
            </p>
          </div>

          <div>
            <p className="text-sand/50 text-xs font-semibold mb-4">Kampuni</p>
            <ul className="space-y-2.5">
              <li><Link to="/kuhusu" className="text-sand/75 hover:text-sand text-sm transition-colors">Kuhusu Sisi</Link></li>
              <li><Link to="/mawasiliano" className="text-sand/75 hover:text-sand text-sm transition-colors">Wasiliana Nasi</Link></li>
              <li><Link to="/kazi-kwetu" className="text-sand/75 hover:text-sand text-sm transition-colors">Kazi Kwetu</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sand/50 text-xs font-semibold mb-4">Kategoria</p>
            <ul className="space-y-2.5">
              <li><Link to="/kategoria/nyumba" className="text-sand/75 hover:text-sand text-sm transition-colors">Nyumba</Link></li>
              <li><Link to="/kategoria/magari" className="text-sand/75 hover:text-sand text-sm transition-colors">Magari</Link></li>
              <li><Link to="/kategoria/viwanja" className="text-sand/75 hover:text-sand text-sm transition-colors">Viwanja</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sand/50 text-xs font-semibold mb-4">Msaada</p>
            <ul className="space-y-2.5">
              <li><Link to="/faq" className="text-sand/75 hover:text-sand text-sm transition-colors">Maswali</Link></li>
              <li><Link to="/usalama" className="text-sand/75 hover:text-sand text-sm transition-colors">Usalama</Link></li>
              <li><Link to="/faragha" className="text-sand/75 hover:text-sand text-sm transition-colors">Sera ya Faragha</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
          <p className="text-sand/40 text-xs text-center md:text-left">
            © {new Date().getFullYear()} Soko. Haki zote zimehifadhiwa.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sand/40 text-xs">
            <span>Malipo yanakubaliwa:</span>
            <span className="text-sand/60 font-medium">M-Pesa</span>
            <span>·</span>
            <span className="text-sand/60 font-medium">Tigo Pesa</span>
            <span>·</span>
            <span className="text-sand/60 font-medium">Airtel Money</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
