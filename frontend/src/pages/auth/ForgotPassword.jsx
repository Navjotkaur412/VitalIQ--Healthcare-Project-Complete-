import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../components/AuthLayout";
import api from "../../api/axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to get back in.">
      {sent ? (
        <div className="text-center py-2">
          <p className="text-sm text-ink">
            If an account exists for <span className="font-semibold">{email}</span>, a reset link is on its way.
          </p>
          <Link to="/login" className="btn-secondary mt-5 inline-flex">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending…" : "Send reset link"}
          </button>
          <Link to="/login" className="block text-center text-sm text-brand hover:underline mt-2">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
