import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../components/AuthLayout";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome to VitalIQ, ${user.name.split(" ")[0]}`);
      navigate("/patient");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="For patients. Doctors are onboarded by an admin.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input required className="input" value={form.name} onChange={set("name")} placeholder="Jordan Lee" />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            className="input"
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label">Password</label>
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={set("phone")} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input type="date" className="input" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
          </div>
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input" value={form.gender} onChange={set("gender")}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-muted text-center mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-brand font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
