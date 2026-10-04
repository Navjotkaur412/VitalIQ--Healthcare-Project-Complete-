import React, { useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { VITAL_FIELDS } from "../../lib/vitals";

const EMPTY = { systolic: "", diastolic: "", bloodSugar: "", heartRate: "", spo2: "", temperature: "", weight: "", notes: "" };

const EnterReading = () => {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasAtLeastOne = VITAL_FIELDS.some((f) => form[f.key] !== "");
    if (!hasAtLeastOne) {
      toast.error("Enter at least one vital");
      return;
    }
    setLoading(true);
    try {
      await api.post("/health-readings", form);
      toast.success("Reading saved");
      setForm(EMPTY);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save reading");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Log a Reading">
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="label mb-2">Blood pressure</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                className="input"
                placeholder="Systolic (mmHg)"
                value={form.systolic}
                onChange={set("systolic")}
              />
              <input
                type="number"
                className="input"
                placeholder="Diastolic (mmHg)"
                value={form.diastolic}
                onChange={set("diastolic")}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {VITAL_FIELDS.filter((f) => f.group !== "bp").map((f) => (
              <div key={f.key}>
                <label className="label">
                  {f.label} <span className="normal-case font-normal text-muted/70">({f.unit})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="input"
                  value={form[f.key]}
                  onChange={set(f.key)}
                  placeholder={`e.g. ${f.key === "spo2" ? "98" : f.key === "temperature" ? "36.8" : ""}`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={set("notes")}
              placeholder="How are you feeling? Anything unusual?"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
            {loading ? "Saving…" : "Save reading"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EnterReading;
