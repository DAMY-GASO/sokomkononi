import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");
    const adminStatus = localStorage.getItem("is_admin") === "true";
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setIsAdmin(adminStatus);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
    setLoading(false);
  }, []);

  // User login
  const login = async (credentials) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.post("/auth/login", credentials);
      // const { user, token } = response.data;
      
      // Mock login - Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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

  // Admin login
  const adminLogin = async (credentials) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.post("/auth/admin/login", credentials);
      // const { user, token } = response.data;
      
      // Mock admin login - Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Admin credentials check (mock)
      const adminEmail = "admin@sokomkononi.co.tz";
      const adminPassword = "Admin123!";
      
      if (credentials.email !== adminEmail || credentials.password !== adminPassword) {
        throw new Error("Invalid admin credentials");
      }
      
      const adminUser = {
        id: "admin1",
        name: "Administrator",
        email: credentials.email,
        role: "admin",
        permissions: ["all"],
      };
      
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

  // Register
  const register = async (userData) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      // TODO: Replace with actual API call
      // await api.post("/auth/logout");
      
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("is_admin");
      
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Send OTP
  const sendOtp = async (email) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log(`OTP sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error("Send OTP error:", error);
      throw error;
    }
  };

  // Verify OTP
  const verifyOtp = async (email, otp) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock verification - accept any 6-digit code
      if (otp.length < 4) {
        throw new Error("Invalid OTP");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Verify OTP error:", error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email, newPassword) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 800));
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
