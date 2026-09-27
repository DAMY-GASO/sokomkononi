import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ============================================================
// INSTALL 401 HANDLER — kabla ya React render
// Hii inahakikisha handler ipo tayari kabla ya request yoyote
// ============================================================
import { installUnauthorizedHandler } from "./config/authStore.js";
installUnauthorizedHandler();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);