import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import Modal from "../../components/Modal";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { VITAL_FIELDS, formatDate, formatDateTime } from "../../lib/vitals";
import { downloadHealthReport } from "../../lib/downloadReport";

const RANGE_DAYS = { week: 7, month: 30, "3m": 90 };
const PAGE_SIZE = 10;

const History = () => {
  const { user } = useAuth();
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");
  const [metric, setMetric] = useState("heartRate");
  const [editing, setEditing] = useState(null); // reading object or null
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadHealthReport(null, user?.name);
    } catch (err) {
      toast.error("Could not generate report");
    } finally {
      setDownloading(false);
    }
  };

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const from = new Date();
      from.setDate(from.getDate() - RANGE_DAYS[range]);
      const { data } = await api.get("/health-readings/history", {
        params: { from: from.toISOString(), limit: PAGE_SIZE, page },
      });
      setReadings(data.readings);
      setPagination(data.pagination);
    } catch (err) {
      toast.error("Could not load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Chart uses a wider pull (unpaginated) so trend lines aren't choppy within the page size
  const [chartReadings, setChartReadings] = useState([]);
  useEffect(() => {
    const from = new Date();
    from.setDate(from.getDate() - RANGE_DAYS[range]);
    api
      .get("/health-readings/history", { params: { from: from.toISOString(), limit: 200 } })
      .then(({ data }) => setChartReadings(data.readings))
      .catch(() => {});
  }, [range]);

  const chartData = useMemo(
    () =>
      [...chartReadings].reverse().map((r) => ({
        date: formatDate(r.recordedAt),
        heartRate: r.heartRate,
        spo2: r.spo2,
        bloodSugar: r.bloodSugar,
        temperature: r.temperature,
        weight: r.weight,
        systolic: r.systolic,
        diastolic: r.diastolic,
      })),
    [chartReadings]
  );

  const handleDelete = async (id) => {
    if (!confirm("Delete this reading?")) return;
    try {
      await api.delete(`/health-readings/${id}`);
      toast.success("Reading deleted");
      fetchHistory(pagination.page);
    } catch (err) {
      toast.error("Could not delete reading");
    }
  };

  return (
    <DashboardLayout title="Health History">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2">
          {Object.keys(RANGE_DAYS).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                range === r ? "bg-brand text-white border-brand" : "bg-white text-muted border-line hover:bg-brand-light"
              }`}
            >
              {r === "week" ? "7 days" : r === "month" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-auto" value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="heartRate">Heart Rate</option>
            <option value="spo2">SpO₂</option>
            <option value="bloodSugar">Blood Sugar</option>
            <option value="temperature">Temperature</option>
            <option value="weight">Weight</option>
            <option value="bp">Blood Pressure</option>
          </select>
          <button onClick={handleDownload} disabled={downloading} className="btn-secondary whitespace-nowrap">
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="card mb-6 h-72">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted">
            No readings in this range yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#E1EAE7" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5C7570" }} />
              <YAxis tick={{ fontSize: 12, fill: "#5C7570" }} />
              <Tooltip />
              {metric === "bp" ? (
                <>
                  <Legend />
                  <Line type="monotone" dataKey="systolic" stroke="#0F5C56" strokeWidth={2} dot={false} name="Systolic" />
                  <Line type="monotone" dataKey="diastolic" stroke="#E14F3D" strokeWidth={2} dot={false} name="Diastolic" />
                </>
              ) : (
                <Line type="monotone" dataKey={metric} stroke="#0F5C56" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="h-32 animate-pulse" />
        ) : readings.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No readings recorded yet.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide border-b border-line">
                  <th className="pb-3 pr-3">Recorded</th>
                  <th className="pb-3 pr-3">BP</th>
                  <th className="pb-3 pr-3">Sugar</th>
                  <th className="pb-3 pr-3">HR</th>
                  <th className="pb-3 pr-3">SpO₂</th>
                  <th className="pb-3 pr-3">Temp</th>
                  <th className="pb-3 pr-3">Weight</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r._id} className="border-b border-line last:border-0">
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDateTime(r.recordedAt)}</td>
                    <td className="py-3 pr-3 font-mono">{r.systolic && r.diastolic ? `${r.systolic}/${r.diastolic}` : "—"}</td>
                    <td className="py-3 pr-3 font-mono">{r.bloodSugar ?? "—"}</td>
                    <td className="py-3 pr-3 font-mono">{r.heartRate ?? "—"}</td>
                    <td className="py-3 pr-3 font-mono">{r.spo2 ?? "—"}</td>
                    <td className="py-3 pr-3 font-mono">{r.temperature ?? "—"}</td>
                    <td className="py-3 pr-3 font-mono">{r.weight ?? "—"}</td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(r)} className="text-xs font-semibold text-brand hover:underline mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(r._id)} className="text-xs font-semibold text-signal hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-line">
                <p className="text-xs text-muted">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} readings
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchHistory(pagination.page - 1)}
                    className="btn-ghost px-3 py-1.5 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchHistory(pagination.page + 1)}
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

      {editing && (
        <EditReadingModal
          reading={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchHistory(pagination.page);
          }}
        />
      )}
    </DashboardLayout>
  );
};

const EditReadingModal = ({ reading, onClose, onSaved }) => {
  const [form, setForm] = useState({
    systolic: reading.systolic ?? "",
    diastolic: reading.diastolic ?? "",
    bloodSugar: reading.bloodSugar ?? "",
    heartRate: reading.heartRate ?? "",
    spo2: reading.spo2 ?? "",
    temperature: reading.temperature ?? "",
    weight: reading.weight ?? "",
    notes: reading.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/health-readings/${reading._id}`, form);
      toast.success("Reading updated");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update reading");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit reading" onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="label mb-2">Blood pressure</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className="input" placeholder="Systolic" value={form.systolic} onChange={set("systolic")} />
            <input type="number" className="input" placeholder="Diastolic" value={form.diastolic} onChange={set("diastolic")} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {VITAL_FIELDS.filter((f) => f.group !== "bp").map((f) => (
            <div key={f.key}>
              <label className="label">
                {f.label} <span className="normal-case font-normal text-muted/70">({f.unit})</span>
              </label>
              <input type="number" step="any" className="input" value={form[f.key]} onChange={set(f.key)} />
            </div>
          ))}
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={3} value={form.notes} onChange={set("notes")} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default History;
