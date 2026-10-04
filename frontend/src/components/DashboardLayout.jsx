import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = {
  patient: [
    { to: "/patient", label: "Dashboard", end: true },
    { to: "/patient/readings", label: "Health Readings" },
    { to: "/patient/history", label: "History" },
    { to: "/patient/ai-insights", label: "AI Insights" },
    { to: "/patient/appointments", label: "Appointments" },
    { to: "/patient/medications", label: "Medications" },
    { to: "/patient/profile", label: "Profile" },
  ],
  doctor: [
    { to: "/doctor", label: "Dashboard", end: true },
    { to: "/doctor/patients", label: "My Patients" },
    { to: "/doctor/appointments", label: "Appointments" },
    { to: "/doctor/profile", label: "Profile" },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/users", label: "Manage Users" },
    { to: "/admin/doctors/new", label: "Create Doctor" },
    { to: "/admin/audit-logs", label: "Audit Logs" },
  ],
};

const ROLE_LABEL = { patient: "Patient", doctor: "Doctor", admin: "Administrator" };

const DashboardLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV_ITEMS[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col border-r border-line bg-surface">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-line">
          <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          <span className="font-display font-semibold text-ink tracking-tight">VitalIQ AI</span>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-light text-brand-dark" : "text-muted hover:bg-brand-light hover:text-brand-dark"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-line">
          <button onClick={handleLogout} className="btn-ghost w-full justify-start">
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-line bg-surface flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden btn-ghost px-2"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-semibold text-muted uppercase tracking-wide">
              {ROLE_LABEL[user?.role]}
            </span>
            <NotificationBell />
            <NavLink to={`/${user?.role}/profile`} className="flex items-center gap-2 group">
              {user?.profilePicture ? (
                <img
                  src={`${import.meta.env.VITE_API_ORIGIN || "http://localhost:5000"}${user.profilePicture}`}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover border border-line"
                />
              ) : (
                <span className="h-9 w-9 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center">
                  {initials}
                </span>
              )}
            </NavLink>
          </div>
        </header>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden border-b border-line bg-surface px-4 py-3 space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-brand-light text-brand-dark" : "text-muted"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="btn-ghost w-full justify-start">
              Log out
            </button>
          </nav>
        )}

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
