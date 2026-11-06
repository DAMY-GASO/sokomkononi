import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { applyTheme, getTheme } from "./config/themeStore.js";
import "./index.css";
import "leaflet/dist/leaflet.css";

// Safisha cookies
function purgeStaleCsrfCookies() {
  try {
    const host = window.location.hostname;
    const paths = ["/", "/api", "/admin", "/django-admin"];
    const domains = ["", "." + host, host];
    const names = ["sessionid", "csrftoken"];
    for (const n of names) {
      for (const p of paths) {
        for (const d of domains) {
          const dPart = d ? `; domain=${d}` : "";
          document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${p}${dPart}`;
        }
      }
    }
  } catch { /* noop */ }
}
purgeStaleCsrfCookies();

// Apply theme
applyTheme(getTheme());

// ✅ Register undo handlers ndani ya App au use static import hapa
// Badala ya dynamic import, tunatumia static import kwa sababu ni ndogo
import { registerRestoreHandlers } from "./config/undoStore.js";
import { restoreListingAsync } from "./config/listingsStore.js";

registerRestoreHandlers({
  listing: (id) => restoreListingAsync(id),
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);