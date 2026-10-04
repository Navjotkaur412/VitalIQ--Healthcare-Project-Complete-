import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import Modal from "../../components/Modal";
import AIInsightsPanel from "../../components/AIInsightsPanel";
import AskAIAssistant from "../../components/AskAIAssistant";
import api from "../../api/axios";
import { VITAL_FIELDS, formatDateTime, formatDate } from "../../lib/vitals";
import { downloadHealthReport } from "../../lib/downloadReport";

const PatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [readings, setReadings] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrescribe, setShowPrescribe] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [tab, setTab] = useState("overview");

  const load = async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes, medsRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/health-readings/history/${id}`, { params: { limit: 20 } }),
        api.get(`/medications/patient/${id}`),
      ]);
      setPatient(profileRes.data.user);
      setReadings(historyRes.data.readings);
      setMedications(medsRes.data.medications);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load patient");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadHealthReport(id, patient?.name);
    } catch (err) {
      toast.error("Could not generate report");
    } finally {
      setDownloading(false);
    }
  };

  const toggleActive = async (med) => {
    try {
      await api.put(`/medications/${med._id}`, { isActive: !med.isActive });
      toast.success(med.isActive ? "Medication deactivated" : "Medication reactivated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update medication");
    }
  };

  const latest = readings[0];
  const activeMeds = medications.filter((m) => m.isActive);

  return (
    <DashboardLayout title="Patient Profile">
      <Link to="/doctor/patients" className="text-sm font-medium text-brand hover:underline mb-4 inline-block">
        ← Back to patients
      </Link>

      {loading ? (
        <div className="card h-40 animate-pulse" />
      ) : !patient ? (
        <div className="card text-center py-10 text-muted">Patient not found.</div>
      ) : (
        <>
          <div className="card mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">{patient.name}</h2>
              <p className="text-sm text-muted">{patient.email}</p>
              <p className="text-xs text-muted mt-1">
                {patient.gender ? patient.gender + " · " : ""}
                {patient.bloodGroup ? "Blood group " + patient.bloodGroup : ""}
              </p>
            </div>
            <button onClick={handleDownload} disabled={downloading} className="btn-secondary">
              {downloading ? "Preparing…" : "Download PDF report"}
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            {["overview", "ai-insights", "ask-ai"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                  tab === t ? "bg-brand text-white border-brand" : "bg-white text-muted border-line hover:bg-brand-light"
                }`}
              >
                {t === "overview" ? "Overview" : t === "ai-insights" ? "AI Insights" : "Ask AI"}
              </button>
            ))}
          </div>

          {tab === "ai-insights" && <AIInsightsPanel patientId={id} />}
          {tab === "ask-ai" && <AskAIAssistant patientId={id} />}

          {tab === "overview" && (
            <>
          <h3 className="font-display font-semibold text-ink mb-3">Latest vitals</h3>
          {!latest ? (
            <div className="card text-center py-8 text-sm text-muted mb-6">No readings recorded yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {latest.systolic != null && latest.diastolic != null && (
                <VitalTile label="Blood Pressure" value={`${latest.systolic}/${latest.diastolic}`} unit="mmHg" />
              )}
              {VITAL_FIELDS.filter((f) => f.group !== "bp").map(
                (f) => latest[f.key] != null && <VitalTile key={f.key} label={f.label} value={latest[f.key]} unit={f.unit} />
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-ink">Medications</h3>
            <button onClick={() => setShowPrescribe(true)} className="btn-primary px-3 py-1.5 text-sm">
              + Prescribe
            </button>
          </div>
          <div className="card mb-6">
            {medications.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">No medications prescribed yet.</p>
            ) : (
              <div className="space-y-3">
                {medications.map((m) => (
                  <div key={m._id} className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-ink">
                        {m.name} <span className="font-normal text-muted">· {m.dosage}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {m.frequency} · since {formatDate(m.startDate)}
                        {m.endDate ? ` · ends ${formatDate(m.endDate)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${m.isActive ? "bg-brand-light text-brand-dark" : "bg-line text-muted"}`}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                      <button onClick={() => toggleActive(m)} className="text-xs font-semibold text-brand hover:underline">
                        {m.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h3 className="font-display font-semibold text-ink mb-3">Recent history</h3>
          <div className="card overflow-x-auto">
            {readings.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No history yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide border-b border-line">
                    <th className="pb-3 pr-3">Recorded</th>
                    <th className="pb-3 pr-3">BP</th>
                    <th className="pb-3 pr-3">Sugar</th>
                    <th className="pb-3 pr-3">HR</th>
                    <th className="pb-3 pr-3">SpO₂</th>
                    <th className="pb-3 pr-3">Temp</th>
                    <th className="pb-3">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r) => (
                    <tr key={r._id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-3 whitespace-nowrap">{formatDateTime(r.recordedAt)}</td>
                      <td className="py-3 pr-3 font-mono">
                        {r.systolic && r.diastolic ? `${r.systolic}/${r.diastolic}` : "—"}
                      </td>
                      <td className="py-3 pr-3 font-mono">{r.bloodSugar ?? "—"}</td>
                      <td className="py-3 pr-3 font-mono">{r.heartRate ?? "—"}</td>
                      <td className="py-3 pr-3 font-mono">{r.spo2 ?? "—"}</td>
                      <td className="py-3 pr-3 font-mono">{r.temperature ?? "—"}</td>
                      <td className="py-3 font-mono">{r.weight ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
            </>
          )}
        </>
      )}

      {showPrescribe && (
        <PrescribeModal
          patientId={id}
          onClose={() => setShowPrescribe(false)}
          onPrescribed={() => {
            setShowPrescribe(false);
            load();
          }}
        />
      )}
    </DashboardLayout>
  );
};

const PrescribeModal = ({ patientId, onClose, onPrescribed }) => {
  const [form, setForm] = useState({ name: "", dosage: "", frequency: "", instructions: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/medications", { ...form, patientId });
      toast.success("Medication prescribed");
      onPrescribed();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not prescribe medication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Prescribe medication" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Medication name</label>
          <input required className="input" value={form.name} onChange={set("name")} placeholder="e.g. Lisinopril" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Dosage</label>
            <input required className="input" value={form.dosage} onChange={set("dosage")} placeholder="e.g. 10mg" />
          </div>
          <div>
            <label className="label">Frequency</label>
            <input required className="input" value={form.frequency} onChange={set("frequency")} placeholder="e.g. Once daily" />
          </div>
        </div>
        <div>
          <label className="label">Instructions (optional)</label>
          <textarea className="input" rows={2} value={form.instructions} onChange={set("instructions")} placeholder="e.g. Take with food" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start date</label>
            <input type="date" className="input" value={form.startDate} onChange={set("startDate")} />
          </div>
          <div>
            <label className="label">End date (optional)</label>
            <input type="date" className="input" value={form.endDate} onChange={set("endDate")} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Prescribing…" : "Prescribe"}
        </button>
      </form>
    </Modal>
  );
};

const VitalTile = ({ label, value, unit }) => (
  <div className="card">
    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
    <p className="font-mono text-xl font-semibold text-ink">
      {value} <span className="text-sm font-normal text-muted">{unit}</span>
    </p>
  </div>
);

export default PatientDetail;
