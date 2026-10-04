import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import Modal from "../../components/Modal";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const STATUS_STYLE = {
  pending: "bg-amber-50 text-status-moderate",
  approved: "bg-brand-light text-brand-dark",
  rejected: "bg-signal-light text-signal",
  completed: "bg-brand-light text-brand-dark",
  cancelled: "bg-line text-muted",
};

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/appointments/mine");
      setAppointments(data.appointments);
    } catch (err) {
      toast.error("Could not load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel appointment");
    }
  };

  return (
    <DashboardLayout title="Appointments">
      {!user?.assignedDoctor ? (
        <div className="card text-center py-10">
          <p className="text-ink font-medium">No doctor assigned yet</p>
          <p className="text-sm text-muted mt-1">An administrator needs to assign you a doctor before you can book.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-5">
            <button onClick={() => setShowBooking(true)} className="btn-primary">
              + Book appointment
            </button>
          </div>

          <div className="card overflow-x-auto">
            {loading ? (
              <div className="h-32 animate-pulse" />
            ) : appointments.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No appointments yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide border-b border-line">
                    <th className="pb-3 pr-3">Date requested</th>
                    <th className="pb-3 pr-3">Doctor</th>
                    <th className="pb-3 pr-3">Reason</th>
                    <th className="pb-3 pr-3">Status</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a._id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-3 whitespace-nowrap">{new Date(a.requestedDate).toLocaleString()}</td>
                      <td className="py-3 pr-3">{a.doctor?.name}</td>
                      <td className="py-3 pr-3 max-w-xs truncate">{a.reason}</td>
                      <td className="py-3 pr-3">
                        <span className={`badge ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                      </td>
                      <td className="py-3 text-right">
                        {["pending", "approved"].includes(a.status) && (
                          <button onClick={() => handleCancel(a._id)} className="text-xs font-semibold text-signal hover:underline">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {showBooking && (
        <BookingModal
          onClose={() => setShowBooking(false)}
          onBooked={() => {
            setShowBooking(false);
            fetchAppointments();
          }}
        />
      )}
    </DashboardLayout>
  );
};

const BookingModal = ({ onClose, onBooked }) => {
  const [form, setForm] = useState({ requestedDate: "", reason: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/appointments", form);
      toast.success("Appointment requested");
      onBooked();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not book appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Book an appointment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Preferred date & time</label>
          <input
            type="datetime-local"
            required
            className="input"
            value={form.requestedDate}
            onChange={(e) => setForm({ ...form, requestedDate: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Reason for visit</label>
          <textarea
            required
            className="input"
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Briefly describe why you'd like to see your doctor"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Requesting…" : "Request appointment"}
        </button>
      </form>
    </Modal>
  );
};

export default Appointments;
