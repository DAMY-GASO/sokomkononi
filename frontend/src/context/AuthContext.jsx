import React, { createContext, useContext, useEffect, useState } from "react";
import { getMe, loginUser, registerUser } from "../api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sm_token");
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("sm_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(payload) {
    const res = await loginUser(payload);
    localStorage.setItem("sm_token", res.data.token);
    setUser(res.data.user);
    return res;
  }

  async function register(payload) {
    const res = await registerUser(payload);
    localStorage.setItem("sm_token", res.data.token);
    setUser(res.data.user);
    return res;
  }

  function logout() {
    localStorage.removeItem("sm_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
