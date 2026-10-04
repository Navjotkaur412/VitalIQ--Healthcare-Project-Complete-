import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { formatDateTime } from "../../lib/vitals";

const ACTION_OPTIONS = [
  "",
  "DOCTOR_CREATED",
  "USER_ACTIVATED",
  "USER_DEACTIVATED",
  "USER_ROLE_CHANGED",
  "PATIENT_DOCTOR_ASSIGNED",
  "APPOINTMENT_APPROVED",
  "APPOINTMENT_REJECTED",
  "APPOINTMENT_COMPLETED",
  "APPOINTMENT_CANCELLED",
];

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/audit-logs", { params: { action: action || undefined, page, limit: 20 } });
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      toast.error("Could not load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  return (
    <DashboardLayout title="Audit Logs">
      <select className="input w-auto mb-5" value={action} onChange={(e) => setAction(e.target.value)}>
        {ACTION_OPTIONS.map((a) => (
          <option key={a || "all"} value={a}>
            {a ? a.replaceAll("_", " ") : "All actions"}
          </option>
        ))}
      </select>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="h-40 animate-pulse" />
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No audit entries match.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide border-b border-line">
                  <th className="pb-3 pr-3">Time</th>
                  <th className="pb-3 pr-3">Actor</th>
                  <th className="pb-3 pr-3">Action</th>
                  <th className="pb-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-line last:border-0">
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="py-3 pr-3">
                      {log.actor?.name} <span className="text-muted">({log.actorRole})</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="badge bg-brand-light text-brand-dark">{log.action.replaceAll("_", " ")}</span>
                    </td>
                    <td className="py-3 text-muted">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-line">
                <p className="text-xs text-muted">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} entries
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchLogs(pagination.page - 1)}
                    className="btn-ghost px-3 py-1.5 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchLogs(pagination.page + 1)}
                    className="btn-ghost px-3 py-1.5 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuditLogs;
