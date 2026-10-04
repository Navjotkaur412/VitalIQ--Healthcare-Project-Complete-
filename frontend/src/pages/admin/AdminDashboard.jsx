import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data.stats));
    api
      .get("/ai/admin/stats")
      .then(({ data }) => setAiStats(data.stats))
      .catch(() => setAiUnavailable(true));
  }, []);

  const cards = [
    { label: "Total patients", value: stats?.totalPatients },
    { label: "Total doctors", value: stats?.totalDoctors },
    { label: "Active patients", value: stats?.activePatients },
    { label: "Active doctors", value: stats?.activeDoctors },
    { label: "Deactivated accounts", value: stats?.inactiveUsers },
  ];

  const appt = stats?.appointments;
  const apptCards = [
    { label: "Pending", value: appt?.pending, style: "text-status-moderate" },
    { label: "Approved", value: appt?.approved, style: "text-brand" },
    { label: "Completed", value: appt?.completed, style: "text-brand-dark" },
    { label: "Rejected", value: appt?.rejected, style: "text-signal" },
    { label: "Cancelled", value: appt?.cancelled, style: "text-muted" },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/admin/doctors/new" className="btn-primary">
          + Create doctor account
        </Link>
        <Link to="/admin/users" className="btn-secondary">
          Manage users
        </Link>
        <Link to="/admin/audit-logs" className="btn-ghost">
          View audit logs
        </Link>
      </div>

      <h3 className="font-display font-semibold text-ink mb-3">Users</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{c.label}</p>
            <p className="font-mono text-2xl font-semibold text-ink">{c.value ?? "—"}</p>
          </div>
        ))}
      </div>

      <h3 className="font-display font-semibold text-ink mb-3">
        Appointments {appt ? <span className="text-muted font-normal text-sm">({appt.total} total)</span> : null}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {apptCards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{c.label}</p>
            <p className={`font-mono text-2xl font-semibold ${c.style}`}>{c.value ?? "—"}</p>
          </div>
        ))}
      </div>

      <h3 className="font-display font-semibold text-ink mb-3">AI / Risk statistics</h3>
      {aiUnavailable ? (
        <div className="card text-sm text-muted">The AI service is currently unreachable.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Low</p>
            <p className="font-mono text-2xl font-semibold text-brand">{aiStats?.riskDistribution?.Low ?? "—"}</p>
          </div>
          <div className="card">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Moderate</p>
            <p className="font-mono text-2xl font-semibold text-status-moderate">
              {aiStats?.riskDistribution?.Moderate ?? "—"}
            </p>
          </div>
          <div className="card">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">High</p>
            <p className="font-mono text-2xl font-semibold text-status-high">{aiStats?.riskDistribution?.High ?? "—"}</p>
          </div>
          <div className="card">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Critical</p>
            <p className="font-mono text-2xl font-semibold text-signal">{aiStats?.riskDistribution?.Critical ?? "—"}</p>
          </div>
          <div className="card">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Avg. risk score</p>
            <p className="font-mono text-2xl font-semibold text-ink">{aiStats?.averageRiskScore ?? "—"}</p>
          </div>
          <div className="card">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Predictions run</p>
            <p className="font-mono text-2xl font-semibold text-ink">{aiStats?.totalPredictionsLogged ?? "—"}</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
