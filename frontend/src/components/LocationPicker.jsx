import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { TZ_REGIONS, WILAYA_SUGGESTIONS } from "../config/categorySchemas.js";

/* ── Brand-aligned marker (data URL — no import issues in Vite) ── */
const MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
  <path d="M16 0C7.2 0 0 7.2 0 16c0 11.8 16 28 16 28s16-16.2 16-28C32 7.2 24.8 0 16 0z"
        fill="#FEA406" stroke="#011957" stroke-width="2.2"/>
  <circle cx="16" cy="16" r="6" fill="#011957"/>
</svg>`;

const BRAND_MARKER = L.divIcon({
  html: `<img src="data:image/svg+xml;base64,${btoa(MARKER_SVG)}" style="width:32px;height:44px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.35))"/>`,
  className: "smk-map-marker",
  iconSize: [32, 44],
  iconAnchor: [16, 44],
});

/* Tanzania center */
const TZ_CENTER = [-6.3690, 34.8888];
const TZ_ZOOM = 6;
const PICK_ZOOM = 16;

const round6 = (n) => Number(Number(n).toFixed(6));

/* ── ISO 3166-2:TZ → jina la mkoa kwenye TZ_REGIONS ── */
const ISO_REGION = {
  "TZ-01": "Arusha", "TZ-02": "Dar es Salaam", "TZ-03": "Dodoma", "TZ-04": "Iringa",
  "TZ-05": "Kagera", "TZ-06": "Kaskazini Pemba", "TZ-07": "Kaskazini Unguja",
  "TZ-08": "Kigoma", "TZ-09": "Kilimanjaro", "TZ-10": "Kusini Pemba",
  "TZ-11": "Kusini Unguja", "TZ-12": "Lindi", "TZ-13": "Mara", "TZ-14": "Mbeya",
  "TZ-15": "Mjini Magharibi", "TZ-16": "Morogoro", "TZ-17": "Mtwara", "TZ-18": "Mwanza",
  "TZ-19": "Pwani", "TZ-20": "Rukwa", "TZ-21": "Ruvuma", "TZ-22": "Shinyanga",
  "TZ-23": "Singida", "TZ-24": "Tabora", "TZ-25": "Tanga", "TZ-26": "Manyara",
  "TZ-27": "Geita", "TZ-28": "Katavi", "TZ-29": "Njombe", "TZ-30": "Simiyu", "TZ-31": "Songwe",
};

const SUFFIX = /\s+(municipal council|city council|town council|district council|municipal|district|council|city|region|mkoa|wilaya)\s*$/i;
const clean = (s) => String(s || "").replace(SUFFIX, "").trim();
const normKey = (s) =>
  String(s || "").toLowerCase().replace(/[^a-z]+/g, " ")
    .replace(/\b(region|mkoa)\b/g, "").replace(/\s+/g, " ").trim();

/* Majina mbadala ya OSM (yameandikwa kwa normKey) */
const REGION_ALIASES = {
  "coast": "Pwani",
  "zanzibar north": "Kaskazini Unguja", "north unguja": "Kaskazini Unguja",
  "zanzibar south and central": "Kusini Unguja", "zanzibar south": "Kusini Unguja",
  "south unguja": "Kusini Unguja", "zanzibar central south": "Kusini Unguja",
  "zanzibar urban west": "Mjini Magharibi", "urban west": "Mjini Magharibi",
  "pemba north": "Kaskazini Pemba", "north pemba": "Kaskazini Pemba",
  "pemba south": "Kusini Pemba", "south pemba": "Kusini Pemba",
};
const REGION_BY_KEY = new Map([
  ...TZ_REGIONS.map((r) => [normKey(r), r]),
  ...Object.entries(REGION_ALIASES),
]);

/* Nominatim address → { region, district, area } zinazolingana na fomu */
function parseAddress(a = {}) {
  const region =
    ISO_REGION[a["ISO3166-2-lvl4"]] ||
    REGION_BY_KEY.get(normKey(a.state)) ||
    "";

  let district = clean(a.county || a.state_district || a.city_district || "");
  const snap = (WILAYA_SUGGESTIONS[region] || []).find(
    (s) => normKey(clean(s)) === normKey(district)
  );
  if (snap) district = snap;

  let area =
    a.suburb || a.neighbourhood || a.quarter || a.village || a.hamlet || a.town || a.city || "";
  if (clean(area).toLowerCase() === clean(district).toLowerCase()) {
    area = a.neighbourhood || a.hamlet || "";
  }
  return { region, district, area: clean(area) };
}

/* ── Sogeza ramani inapohitajika tu; usibadilishe zoom ya mtumiaji ── */
function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    const zoom = map.getZoom();
    if (zoom < 15 || !map.getBounds().contains(position)) {
      map.setView(position, Math.max(zoom, PICK_ZOOM), { animate: true });
    }
  }, [position, map]);
  return null;
}

/* ── Click handler ── */
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * LocationPicker
 *
 * @param {object}   props
 * @param {object}   props.value   — { latitude, longitude }
 * @param {function} props.onChange — (lat:number|null, lng:number|null) => void
 * @param {function} [props.onAddressResolved] — (addressText:string, parts:{region,district,area}|null) => void
 * @param {boolean}  [props.compact=false] — 260px tall instead of 360
 */
export default function LocationPicker({
  value,
  onChange,
  onAddressResolved,
  compact = false,
}) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const lat = value?.latitude;
  const lng = value?.longitude;
  const hasCoords = lat != null && lng != null && lat !== "" && lng !== "";

  const [position, setPosition] = useState(hasCoords ? [Number(lat), Number(lng)] : null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const watchRef = useRef(null);
  const reqRef = useRef(0);

  const stopWatch = () => {
    if (watchRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    watchRef.current = null;
  };
  useEffect(() => stopWatch, []);

  useEffect(() => {
    if (hasCoords) setPosition([Number(lat), Number(lng)]);
    else setPosition(null);
  }, [lat, lng, hasCoords]);

  const reverseGeocode = async (newLat, newLng) => {
    if (!onAddressResolved) return;
    const myReq = ++reqRef.current;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${newLat}&lon=${newLng}&zoom=17&accept-language=en`
      );
      if (!res.ok || myReq !== reqRef.current) return; // jibu la zamani, puuza
      const data = await res.json();
      if (data?.display_name) onAddressResolved(data.display_name, parseAddress(data.address));
    } catch {
      /* silent — reverse geocode is optional */
    }
  };

  const handlePick = (newLat, newLng) => {
    const la = round6(newLat);
    const ln = round6(newLng);
    setPosition([la, ln]);
    onChange(la, ln);
    reverseGeocode(la, ln);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(t("Kivinjari chako hakitumii geolocation.", "Your browser doesn't support geolocation."));
      return;
    }
    stopWatch();
    setLocating(true);
    setGeoError("");
    setAccuracy(null);

    let best = null;
    let done = false;
    let timer = null;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      stopWatch();
      setLocating(false);
      if (best) handlePick(best.latitude, best.longitude);
      else setGeoError(t("Mahali haipatikani. Bofya kwenye ramani kuchagua.", "Couldn't get a fix. Tap the map to choose."));
    };
    timer = setTimeout(finish, 10000); // subiri hadi sekunde 10 kwa GPS bora

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        if (!best || c.accuracy < best.accuracy) {
          best = { latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy };
          setAccuracy(Math.round(c.accuracy));
        }
        if (c.accuracy <= 25) finish();
      },
      (err) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        stopWatch();
        setLocating(false);
        if (best) {
          handlePick(best.latitude, best.longitude);
          return;
        }
        setGeoError(
          err?.code === 1
            ? t(
                "Ruhusa ya mahali imekataliwa. Washa Location kwa browser yako kwenye settings za simu, au bofya ramani kuchagua eneo.",
                "Location permission denied. Enable Location for your browser in phone settings, or tap the map to choose."
              )
            : err?.code === 3
            ? t("Muda umeisha. Jaribu tena au bofya ramani.", "Timed out. Try again or tap the map.")
            : t("Mahali haipatikani kwa sasa. Bofya ramani kuchagua.", "Position unavailable. Tap the map to choose.")
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleClear = () => {
    stopWatch();
    setPosition(null);
    setAccuracy(null);
    onChange(null, null);
    if (onAddressResolved) onAddressResolved("", null);
  };

  return (
    <div className="space-y-3">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors
                     bg-[color:rgb(var(--c-royal))] text-white hover:bg-[color:rgb(var(--c-royal-dark))]
                     disabled:opacity-60"
        >
          {locating ? <Loader2 size={13} className="animate-spin-slow" /> : <Navigation size={13} />}
          {locating ? t("Inatafuta...", "Locating...") : t("Tumia mahali pangu", "Use my location")}
        </button>

        {position && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold
                       border border-[color:rgb(var(--c-hairline))] text-secondary
                       hover:bg-[color:rgb(var(--c-page))] transition-colors"
          >
            {t("Ondoa alama", "Clear marker")}
          </button>
        )}

        {position && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-secondary">
            <MapPin size={11} className="text-[#FEA406]" />
            {Number(position[0]).toFixed(5)}, {Number(position[1]).toFixed(5)}
          </span>
        )}
      </div>

      {geoError && (
        <p className="text-[11px] text-[#C1502E]">{geoError}</p>
      )}

      {accuracy != null && (
        <p className="text-[11px] text-secondary">
          {t(`Usahihi: ±${accuracy} m. Buruta alama kurekebisha.`, `Accuracy: ±${accuracy} m. Drag the pin to adjust.`)}
        </p>
      )}

      {/* Map */}
      <div
        className="overflow-hidden rounded-xl border border-[color:rgb(var(--c-hairline))]"
        style={{ height: compact ? 260 : 360 }}
      >
        <MapContainer
          center={position || TZ_CENTER}
          zoom={position ? PICK_ZOOM : TZ_ZOOM}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
          className="smk-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          <Recenter position={position} />
          {position && (
            <Marker
              position={position}
              icon={BRAND_MARKER}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng();
                  handlePick(p.lat, p.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-[11px] leading-snug text-secondary">
        {t(
          "Bofya au buruta alama kwenye ramani — Mkoa, Wilaya na Eneo vitajazwa vyenyewe. Ukiandika eneo, alama itahamia huko.",
          "Tap or drag the pin — Region, District and Area fill in automatically. If you type an area, the pin moves there."
        )}
      </p>
    </div>
  );
}
