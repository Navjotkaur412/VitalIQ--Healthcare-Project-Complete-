import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

const STATUS_STYLE = {
  pending: "bg-amber-50 text-status-moderate",
  approved: "bg-brand-light text-brand-dark",
  rejected: "bg-signal-light text-signal",
  completed: "bg-brand-light text-brand-dark",
  cancelled: "bg-line text-muted",
};

const FILTERS = ["pending", "approved", "completed", "rejected", "cancelled", ""];

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchAppointments = async (status = filter) => {
    setLoading(true);
    try {
      const { data } = await api.get("/appointments/doctor", { params: { status: status || undefined } });
      setAppointments(data.appointments);
    } catch (err) {
      toast.error("Could not load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const respond = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status}`);
      fetchAppointments(filter);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update appointment");
    }
  };

  return (
    <DashboardLayout title="Appointments">
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f || "all"}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize ${
              filter === f ? "bg-brand text-white border-brand" : "bg-white text-muted border-line hover:bg-brand-light"
            }`}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="h-32 animate-pulse" />
        ) : appointments.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No appointments in this view.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide border-b border-line">
                <th className="pb-3 pr-3">Date requested</th>
                <th className="pb-3 pr-3">Patient</th>
                <th className="pb-3 pr-3">Reason</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-3 whitespace-nowrap">{new Date(a.requestedDate).toLocaleString()}</td>
                  <td className="py-3 pr-3 font-medium text-ink">{a.patient?.name}</td>
                  <td className="py-3 pr-3 max-w-xs truncate">{a.reason}</td>
                  <td className="py-3 pr-3">
                    <span className={`badge ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    {a.status === "pending" && (
                      <>
                        <button onClick={() => respond(a._id, "approved")} className="text-xs font-semibold text-brand hover:underline mr-3">
                          Approve
                        </button>
                        <button onClick={() => respond(a._id, "rejected")} className="text-xs font-semibold text-signal hover:underline">
                          Reject
                        </button>
                      </>
                    )}
                    {a.status === "approved" && (
                      <button onClick={() => respond(a._id, "completed")} className="text-xs font-semibold text-brand hover:underline">
                        Mark completed
                      </button>
                    )}
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

export default DoctorAppointments;
