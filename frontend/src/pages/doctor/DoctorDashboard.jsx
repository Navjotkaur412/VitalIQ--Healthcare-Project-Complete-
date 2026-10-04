import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "../../lib/vitals";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/doctors/patients")
      .then(({ data }) => setPatients(data.patients))
      .finally(() => setLoading(false));
  }, []);

  const recentlyActive = patients.filter((p) => p.latestReading).length;

  return (
    <DashboardLayout title="Dashboard">
      <h2 className="font-display text-xl font-semibold text-ink mb-1">Welcome, Dr. {user?.name?.split(" ").pop()}</h2>
      <p className="text-sm text-muted mb-6">Here's an overview of your patients.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Assigned patients</p>
          <p className="font-mono text-2xl font-semibold text-ink">{loading ? "—" : patients.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">With readings logged</p>
          <p className="font-mono text-2xl font-semibold text-ink">{loading ? "—" : recentlyActive}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-ink">Recent patients</h3>
        <Link to="/doctor/patients" className="text-sm font-medium text-brand hover:underline">
          View all
        </Link>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="h-32 animate-pulse" />
        ) : patients.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No patients assigned yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide border-b border-line">
                <th className="pb-3 pr-3">Patient</th>
                <th className="pb-3 pr-3">Last reading</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {patients.slice(0, 8).map((p) => (
                <tr key={p._id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-3 font-medium text-ink">{p.name}</td>
                  <td className="py-3 pr-3 text-muted">
                    {p.latestReading ? formatDateTime(p.latestReading.recordedAt) : "No readings yet"}
                  </td>
                  <td className="py-3 text-right">
                    <Link to={`/doctor/patients/${p._id}`} className="text-xs font-semibold text-brand hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
