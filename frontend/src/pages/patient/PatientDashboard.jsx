import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import RiskBadge from "../../components/RiskBadge";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { VITAL_FIELDS, formatDateTime } from "../../lib/vitals";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    api
      .get("/health-readings/latest")
      .then(({ data }) => setLatest(data.reading))
      .finally(() => setLoading(false));
    api
      .get("/ai/risk")
      .then(({ data }) => setRisk(data.risk))
      .catch(() => {});
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Hi {user?.name?.split(" ")[0]},</h2>
          <p className="text-sm text-muted mt-1">Here's your most recent snapshot.</p>
        </div>
        {risk && (
          <Link to="/patient/ai-insights">
            <RiskBadge level={risk.level} score={risk.score} size="lg" />
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/patient/readings" className="btn-primary">
          + Log a new reading
        </Link>
        <Link to="/patient/history" className="btn-secondary">
          View history
        </Link>
        <Link to="/patient/ai-insights" className="btn-secondary">
          AI Insights
        </Link>
        <Link to="/patient/appointments" className="btn-secondary">
          Appointments
        </Link>
        <Link to="/patient/medications" className="btn-secondary">
          Medications
        </Link>
      </div>

      {loading ? (
        <div className="card animate-pulse h-40" />
      ) : !latest ? (
        <div className="card text-center py-12">
          <p className="text-ink font-medium">No readings yet</p>
          <p className="text-sm text-muted mt-1 mb-5">Log your first health reading to start building your history.</p>
          <Link to="/patient/readings" className="btn-primary inline-flex">
            Log a reading
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            Last recorded {formatDateTime(latest.recordedAt)}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {latest.systolic != null && latest.diastolic != null && (
              <VitalTile label="Blood Pressure" value={`${latest.systolic}/${latest.diastolic}`} unit="mmHg" />
            )}
            {VITAL_FIELDS.filter((f) => f.group !== "bp").map(
              (f) =>
                latest[f.key] != null && (
                  <VitalTile key={f.key} label={f.label} value={latest[f.key]} unit={f.unit} />
                )
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

const VitalTile = ({ label, value, unit }) => (
  <div className="card">
    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
    <p className="font-mono text-2xl font-semibold text-ink">
      {value} <span className="text-sm font-normal text-muted">{unit}</span>
    </p>
  </div>
);

export default PatientDashboard;
