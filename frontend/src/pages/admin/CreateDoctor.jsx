import React, { useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

const EMPTY = { name: "", email: "", password: "", specialization: "", licenseNumber: "", phone: "" };

const CreateDoctor = () => {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/doctors", form);
      toast.success(`Doctor account created for ${form.name}`);
      setForm(EMPTY);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create doctor account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create Doctor Account">
      <div className="card max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input required className="input" value={form.name} onChange={set("name")} placeholder="Dr. Amara Singh" />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={set("email")}
              placeholder="doctor@vitaliq.local"
            />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input
              type="password"
              required
              minLength={8}
              className="input"
              value={form.password}
              onChange={set("password")}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Specialization</label>
              <input className="input" value={form.specialization} onChange={set("specialization")} placeholder="Cardiology" />
            </div>
            <div>
              <label className="label">License number</label>
              <input className="input" value={form.licenseNumber} onChange={set("licenseNumber")} />
            </div>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={set("phone")} placeholder="Optional" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating…" : "Create doctor account"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateDoctor;
