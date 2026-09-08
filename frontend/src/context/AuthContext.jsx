import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// TODO: badilisha hii kwa URL halisi ya backend yenu (au tumia Axios instance
// yenu mliyoshaunda mahali pengine badala ya fetch moja kwa moja hapa).
const API_BASE = import.meta.env.VITE_API_URL || "https://api.sokomkononi.co.tz";

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw { response: { data } };
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
  }, []);

  function persistSession(userData, token) {
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    if (token) localStorage.setItem("auth_token", token);
  }

  // Hatua ya 1 ya usajili: tuma OTP kwenye email ya mtumiaji.
  async function sendOtp(email) {
    return apiPost("/auth/send-otp", { email });
  }

  // Hatua ya 2: thibitisha OTP kabla ya kukamilisha usajili.
  async function verifyOtp(email, otp) {
    return apiPost("/auth/verify-otp", { email, otp });
  }

  // Inaitwa BAADA TU ya verifyOtp kufanikiwa.
  async function register(form) {
    const data = await apiPost("/auth/register", form);
    persistSession(data.user, data.token);
    return data;
  }

  async function login({ identifier, password }) {
    const data = await apiPost("/auth/login", { identifier, password });
    persistSession(data.user, data.token);
    return data;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
  }

  return (
    <AuthContext.Provider value={{ user, sendOtp, verifyOtp, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
