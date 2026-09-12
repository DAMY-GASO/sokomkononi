import React, { createContext, useContext, useState, useEffect } from "react";

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

  // User login (mock — baadaye: POST /api/auth/login)
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

  // Admin login (mock — baadaye: POST /api/auth/admin/login)
  const adminLogin = async (credentials) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const adminEmail = "admin@sokomkononi.co.tz";
      const adminPassword = "Admin123!";
      if (credentials.email !== adminEmail || credentials.password !== adminPassword) {
        throw new Error("Invalid admin credentials");
      }
      const adminUser = {
        id: "admin1",
        name: "Administrator",
        email: credentials.email,
        phone: "+255 700 000 000",
        role: "admin",
        permissions: ["all"],
      };
      // Ambatanisha avatar kama ipo
      const storedAvatar = localStorage.getItem(AVATAR_KEY_PREFIX + adminUser.id);
      if (storedAvatar) adminUser.avatarUrl = storedAvatar;

      localStorage.setItem("auth_token", "admin_token_" + Date.now());
      localStorage.setItem("user_data", JSON.stringify(adminUser));
      localStorage.setItem("is_admin", "true");
      setUser(adminUser);
      setIsAdmin(true);
      return adminUser;
    } catch (error) {
      console.error("Admin login error:", error);
      throw error;
    }
  };

  // Register (mock)
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

  // Logout
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

  // Send OTP (mock)
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

  // Verify OTP (mock)
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

  // Reset password (mock)
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
    // ===== MPYA =====
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
