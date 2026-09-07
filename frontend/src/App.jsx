import React from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import ComingSoonAppPage from "./pages/ComingSoonAppPage.jsx";
import LoginPage from "./pages/Auth/LoginPage.jsx";
import RegisterPage from "./pages/Auth/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PropertyDetailPage from "./pages/PropertyDetailPage.jsx";
import DealRoomPage from "./pages/DealRoomPage.jsx";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-sand">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<ComingSoonAppPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deal-rooms/:id"
          element={
            <ProtectedRoute>
              <DealRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
