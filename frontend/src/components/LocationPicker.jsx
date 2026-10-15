import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

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

/* ── Programmatic recenter when parent changes the value ── */
function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, PICK_ZOOM, { animate: true });
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
 * @param {function} [props.onAddressResolved] — (addressText:string) => void
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

  useEffect(() => {
    if (hasCoords) setPosition([Number(lat), Number(lng)]);
    else setPosition(null);
  }, [lat, lng, hasCoords]);

  const reverseGeocode = async (newLat, newLng) => {
    if (!onAddressResolved) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=16&accept-language=${lang}`,
        { headers: { "User-Agent": "SokoMkononi/1.0" } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.display_name) onAddressResolved(data.display_name);
    } catch {
      /* silent — reverse geocode is optional */
    }
  };

  const handlePick = (newLat, newLng) => {
    setPosition([newLat, newLng]);
    onChange(newLat, newLng);
    reverseGeocode(newLat, newLng);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(t("Kivinjari chako hakitumii geolocation.", "Your browser doesn't support geolocation."));
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        handlePick(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        setGeoError(err.message || t("Imeshindwa kupata mahali pako.", "Couldn't get your location."));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleClear = () => {
    setPosition(null);
    onChange(null, null);
    if (onAddressResolved) onAddressResolved("");
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
          {position && <Marker position={position} icon={BRAND_MARKER} />}
        </MapContainer>
      </div>

      <p className="text-[11px] leading-snug text-secondary">
        {t(
          "Bofya kwenye ramani ili kuchagua eneo halisi. Anwani itajazwa yenyewe.",
          "Click on the map to pick the exact location. The address will fill in automatically."
        )}
      </p>
    </div>
  );
}
