import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

// SokoMkononi uses Bearer tokens, not cookies. Any leftover `sessionid`
// or `csrftoken` cookie (from an admin session or a previous backend
// config) would trigger Django's CSRF check on every API call. Clear them
// on every boot so a stale cookie can never break the app.
function purgeStaleCsrfCookies() {
  try {
    const host = window.location.hostname;
    // Delete on common path/domain combos the browser might have.
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

// ── One-time boot cleanup ─────────────────────────────────
try { localStorage.removeItem("sokomkononi_deals_v1"); } catch { /* noop */ }

// ── Register undo restore handlers (survive page reload) ──
import("./config/undoStore.js").then(
  ({ registerRestoreHandlers }) => {
    import("./config/listingsStore.js").then(({ restoreListingAsync }) => {
      registerRestoreHandlers({
        listing: (id) => restoreListingAsync(id),
      });
    });
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
