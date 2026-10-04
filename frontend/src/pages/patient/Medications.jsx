import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { formatDate } from "../../lib/vitals";

const STATUS_BADGE = {
  taken: "bg-brand-light text-brand-dark",
  missed: "bg-signal-light text-signal",
  pending: "bg-amber-50 text-status-moderate",
  not_due: "bg-line text-muted",
};

const Medications = () => {
  const [medications, setMedications] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [medsRes, adherenceRes] = await Promise.all([
        api.get("/medications/patient"),
        api.get("/medications/adherence", { params: { days: 30 } }),
      ]);
      setMedications(medsRes.data.medications);
      setAdherence(adherenceRes.data.adherence);
    } catch (err) {
      toast.error("Could not load medications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const logStatus = async (medId, status) => {
    try {
      await api.post(`/medications/${medId}/log`, { status });
      toast.success(status === "taken" ? "Marked as taken" : "Marked as missed");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update");
    }
  };

  const active = medications.filter((m) => m.isActive);
  const inactive = medications.filter((m) => !m.isActive);

  return (
    <DashboardLayout title="Medications">
      {adherence && adherence.adherenceRate !== null && (
        <div className="card mb-6 flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">30-day adherence</p>
            <p className="font-mono text-3xl font-semibold text-ink">{adherence.adherenceRate}%</p>
          </div>
          <div className="text-sm text-muted">
            <p>{adherence.taken} doses taken</p>
            <p>{adherence.missed} doses missed</p>
            <p>{adherence.expected} doses expected</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card h-40 animate-pulse" />
      ) : active.length === 0 ? (
        <div className="card text-center py-10 text-sm text-muted mb-6">No active medications prescribed.</div>
      ) : (
        <div className="space-y-3 mb-8">
          {active.map((m) => (
            <div key={m._id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-ink">
                  {m.name} <span className="font-normal text-muted">· {m.dosage}</span>
                </p>
                <p className="text-sm text-muted">{m.frequency}</p>
                {m.instructions && <p className="text-xs text-muted mt-1">{m.instructions}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${STATUS_BADGE[m.todayStatus]}`}>
                  {m.todayStatus === "not_due" ? "Not due today" : `Today: ${m.todayStatus}`}
                </span>
                {m.todayStatus === "pending" && (
                  <>
                    <button onClick={() => logStatus(m._id, "taken")} className="btn-secondary px-3 py-1.5 text-xs">
                      Mark taken
                    </button>
                    <button onClick={() => logStatus(m._id, "missed")} className="btn-ghost px-3 py-1.5 text-xs">
                      Mark missed
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <>
          <h3 className="font-display font-semibold text-ink mb-3">Past medications</h3>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide border-b border-line">
                  <th className="pb-3 pr-3">Name</th>
                  <th className="pb-3 pr-3">Dosage</th>
                  <th className="pb-3 pr-3">Started</th>
                  <th className="pb-3">Ended</th>
                </tr>
              </thead>
              <tbody>
                {inactive.map((m) => (
                  <tr key={m._id} className="border-b border-line last:border-0">
                    <td className="py-3 pr-3">{m.name}</td>
                    <td className="py-3 pr-3">{m.dosage}</td>
                    <td className="py-3 pr-3">{formatDate(m.startDate)}</td>
                    <td className="py-3">{m.endDate ? formatDate(m.endDate) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Medications;
