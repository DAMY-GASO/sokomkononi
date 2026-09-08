import React from "react";
import { Link, Route, Routes } from "react-router-dom";

export default function AdminDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-6 flex gap-6">
      <aside className="w-48 shrink-0 space-y-2 text-sm">
        <Link to="/admin" className="block font-semibold text-ink-primary">Overview</Link>
        <Link to="/admin/users" className="block text-ink-secondary">Users</Link>
        <Link to="/admin/listings" className="block text-ink-secondary">Listings</Link>
        <Link to="/admin/deal-rooms" className="block text-ink-secondary">Deal Rooms</Link>
        <Link to="/admin/revenue" className="block text-ink-secondary">Revenue</Link>
        <Link to="/admin/settings" className="block text-ink-secondary">Settings</Link>
      </aside>

      <div className="flex-1 text-sm text-ink-muted">
        <Routes>
          <Route index element={<div>[TODO: Overview stats cards]</div>} />
          <Route path="users" element={<div>[TODO: User Management]</div>} />
          <Route path="listings" element={<div>[TODO: Listing Moderation]</div>} />
          <Route path="deal-rooms" element={<div>[TODO: Deal Rooms & Disputes]</div>} />
          <Route path="revenue" element={<div>[TODO: Revenue & Fee Settings]</div>} />
          <Route path="settings" element={<div>[TODO: System Settings]</div>} />
        </Routes>
      </div>
    </div>
  );
}
