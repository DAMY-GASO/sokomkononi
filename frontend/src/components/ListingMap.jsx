import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";

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

/**
 * ListingMap — read-only map for the property detail page.
 * Returns null when lat/lng are missing (safe to render unconditionally).
 */
export default function ListingMap({ latitude, longitude, title, location }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const pos = [lat, lng];

  return (
    <div className="overflow-hidden rounded-xl border border-[color:rgb(var(--c-hairline))]">
      <MapContainer
        center={pos}
        zoom={15}
        style={{ height: 320, width: "100%" }}
        scrollWheelZoom={false}
        className="smk-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={pos} icon={BRAND_MARKER}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong style={{ display: "block", color: "#011957", fontSize: 13 }}>
                {title}
              </strong>
              {location && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, color: "#6B7280", fontSize: 11 }}>
                  <MapPin size={11} /> {location}
                </span>
              )}
              <a
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", marginTop: 8, color: "#0062FD", fontSize: 11, textDecoration: "underline" }}
              >
                Open in OpenStreetMap
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
