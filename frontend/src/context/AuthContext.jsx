import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getSubAdmins,
} from "../config/rolesStore.js";

const AuthContext = createContext();

// ============================================================
// MOCK AVATAR STORAGE (localStorage)
// Baadaye itabadilishwa na API ya Django:
//   POST   /api/admin/profile/avatar   (multipart)
//   DELETE /api/admin/profile/avatar
//   PATCH  /api/admin/profile
// ============================================================
const AVATAR_KEY_PREFIX = "admin_avatar_";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");
    const adminStatus = localStorage.getItem("is_admin") === "true";

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        // Ambatanisha avatar kutoka localStorage (mock)
        const storedAvatar = localStorage.getItem(AVATAR_KEY_PREFIX + parsed.id);
        if (storedAvatar) parsed.avatarUrl = storedAvatar;
        setUser(parsed);
        setIsAdmin(adminStatus);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
    setLoading(false);
  }, []);

  // ============================================================
  // USER LOGIN (mock — baadaye: POST /api/auth/login)
  // ============================================================
  const login = async (credentials) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockUser = {
        id: "u1",
        name: "John Doe",
        email: credentials.identifier || "john@email.com",
        phone: "0743 895 038",
        role: "buyer",
      };
      localStorage.setItem("auth_token", "mock_token_" + Date.now());
      localStorage.setItem("user_data", JSON.stringify(mockUser));
      localStorage.setItem("is_admin", "false");
      setUser(mockUser);
      setIsAdmin(false);
      return mockUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // ============================================================
  // ADMIN LOGIN (mock — baadaye: POST /api/auth/admin/login)
  //
  // Inasaidia:
  //   1. Super Admin (default) — admin@sokomkononi.co.tz / Admin123!
  //   2. Staff — email yoyote iliyo kwenye subAdminsStore
  // ============================================================
  const adminLogin = async (credentials) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 1) Angalia kama ni Super Admin (default)
      const adminEmail = "admin@sokomkononi.co.tz";
      const adminPassword = "Admin123!";

      if (
        credentials.email === adminEmail &&
        credentials.password === adminPassword
      ) {
        const superAdmin = {
          id: "admin1",
          name: "Super Administrator",
          email: credentials.email,
          phone: "+255 700 000 000",
          role: "admin",
          roleKey: "super_admin",
          permissions: ["all"],
        };
        // Ambatanisha avatar kama ipo
        const storedAvatar = localStorage.getItem(
          AVATAR_KEY_PREFIX + superAdmin.id
        );
        if (storedAvatar) superAdmin.avatarUrl = storedAvatar;

        localStorage.setItem("auth_token", "admin_token_" + Date.now());
        localStorage.setItem("user_data", JSON.stringify(superAdmin));
        localStorage.setItem("is_admin", "true");
        setUser(superAdmin);
        setIsAdmin(true);
        return superAdmin;
      }

      // 2) Angalia kama ni Staff (kutoka subAdminsStore)
      const subAdmins = getSubAdmins();
      const staff = subAdmins.find(
        (s) => s.email.toLowerCase() === credentials.email.toLowerCase()
      );

      if (staff) {
        // Kwa demo, password yoyote inakubaliwa kwa staff
        // TODO: backend itathibitisha password halisi
        const staffUser = {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          phone: "",
          role: "admin",
          roleKey: staff.roleKey,
        };
        const storedAvatar = localStorage.getItem(
          AVATAR_KEY_PREFIX + staffUser.id
        );
        if (storedAvatar) staffUser.avatarUrl = storedAvatar;

        localStorage.setItem("auth_token", "admin_token_" + Date.now());
        localStorage.setItem("user_data", JSON.stringify(staffUser));
        localStorage.setItem("is_admin", "true");
        setUser(staffUser);
        setIsAdmin(true);
        return staffUser;
      }

      // 3) Hakuna match
      throw new Error("Invalid admin credentials");
    } catch (error) {
      console.error("Admin login error:", error);
      throw error;
    }
  };

  // ============================================================
  // REGISTER (mock)
  // ============================================================
  const register = async (userData) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newUser = {
        id: "u" + Date.now(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.intent === "sell" ? "seller" : "buyer",
      };
      localStorage.setItem("auth_token", "mock_token_" + Date.now());
      localStorage.setItem("user_data", JSON.stringify(newUser));
      localStorage.setItem("is_admin", "false");
      setUser(newUser);
      setIsAdmin(false);
      return newUser;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================
  const logout = async () => {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("is_admin");
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ============================================================
  // PROFILE — MOCK (localStorage)
  // Baadaye itakuwa:
  //   PATCH /api/admin/profile         (jina, email, phone)
  //   POST  /api/admin/profile/password (password change)
  //   POST  /api/admin/profile/avatar   (multipart)
  //   DELETE /api/admin/profile/avatar
  // ============================================================

  /**
   * Sasisha taarifa za msingi (jina, email, phone)
   * @param {Object} patch - { name?, email?, phone? }
   */
  const updateProfile = async (patch) => {
    try {
      // TODO: PATCH /api/admin/profile
      await new Promise((r) => setTimeout(r, 600));

      const updated = { ...user, ...patch };
      localStorage.setItem("user_data", JSON.stringify(updated));
      setUser(updated);
      return updated;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  /**
   * Badilisha nenosiri
   * @param {Object} payload - { currentPassword, newPassword }
   */
  const updatePassword = async ({ currentPassword, newPassword }) => {
    try {
      // TODO: POST /api/admin/profile/password
      await new Promise((r) => setTimeout(r, 600));

      // Mock: validation rahisi
      if (!currentPassword || !newPassword) {
        throw new Error("Password fields required");
      }
      if (newPassword.length < 6) {
        throw new Error("Password too short");
      }
      return { success: true };
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  };

  /**
   * Weka/ badilisha picha ya avatar
   * @param {File} file - picha (max 1MB)
   * @returns {Promise<string>} - data URL au URL ya backend
   */
  const updateAvatar = async (file) => {
    try {
      // TODO: POST /api/admin/profile/avatar (multipart/form-data)
      if (!file) throw new Error("No file");
      if (!file.type.startsWith("image/")) throw new Error("Not an image");
      if (file.size > 1024 * 1024) throw new Error("Image too large (max 1MB)");

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Hifadhi kwenye localStorage (mock)
      localStorage.setItem(AVATAR_KEY_PREFIX + user.id, dataUrl);

      const updated = { ...user, avatarUrl: dataUrl };
      localStorage.setItem("user_data", JSON.stringify(updated));
      setUser(updated);

      return dataUrl;
    } catch (error) {
      console.error("Update avatar error:", error);
      throw error;
    }
  };

  /**
   * Ondoa picha ya avatar
   */
  const removeAvatar = async () => {
    try {
      // TODO: DELETE /api/admin/profile/avatar
      localStorage.removeItem(AVATAR_KEY_PREFIX + user.id);

      const updated = { ...user, avatarUrl: null };
      localStorage.setItem("user_data", JSON.stringify(updated));
      setUser(updated);
    } catch (error) {
      console.error("Remove avatar error:", error);
      throw error;
    }
  };

  // ============================================================
  // OTP (mock)
  // ============================================================
  const sendOtp = async (email) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log(`OTP sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error("Send OTP error:", error);
      throw error;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (otp.length < 4) throw new Error("Invalid OTP");
      return { success: true };
    } catch (error) {
      console.error("Verify OTP error:", error);
      throw error;
    }
  };

  const resetPassword = async (email, newPassword) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log(`Password reset for ${email}`);
      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    loading,
    isAdmin,
    login,
    adminLogin,
    register,
    logout,
    sendOtp,
    verifyOtp,
    resetPassword,
    // Profile
    updateProfile,
    updatePassword,
    updateAvatar,
    removeAvatar,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
