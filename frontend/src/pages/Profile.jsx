import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

const Profile = () => {
  const { user, refreshMe } = useAuth();
  const fileRef = useRef(null);
  const isDoctor = user?.role === "doctor";

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    gender: user?.gender || "",
    bloodGroup: user?.bloodGroup || "",
    height: user?.height || "",
    specialization: user?.specialization || "",
    licenseNumber: user?.licenseNumber || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/users/profile", form);
      await refreshMe();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append("profilePicture", file);
    setUploading(true);
    try {
      await api.post("/users/profile-picture", data, { headers: { "Content-Type": "multipart/form-data" } });
      await refreshMe();
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not upload picture");
    } finally {
      setUploading(false);
    }
  };

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DashboardLayout title="Profile">
      <div className="grid lg:grid-cols-[220px_1fr] gap-6 max-w-3xl">
        <div className="card flex flex-col items-center text-center h-fit">
          {user?.profilePicture ? (
            <img
              src={`${API_ORIGIN}${user.profilePicture}`}
              alt={user.name}
              className="h-24 w-24 rounded-full object-cover border border-line mb-4"
            />
          ) : (
            <span className="h-24 w-24 rounded-full bg-brand text-white text-xl font-semibold flex items-center justify-center mb-4">
              {initials}
            </span>
          )}
          <p className="font-semibold text-ink">{user?.name}</p>
          <p className="text-xs text-muted mb-4">{user?.email}</p>
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden ref={fileRef} onChange={handlePictureChange} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary w-full text-sm">
            {uploading ? "Uploading…" : "Change photo"}
          </button>
        </div>

        <form onSubmit={handleSave} className="card space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={set("name")} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={set("phone")} />
            </div>
            <div>
              <label className="label">Date of birth</label>
              <input type="date" className="input" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={set("gender")}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={set("address")} />
            </div>
          </div>

          {isDoctor ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Specialization</label>
                <input className="input" value={form.specialization} onChange={set("specialization")} />
              </div>
              <div>
                <label className="label">License number</label>
                <input className="input" value={form.licenseNumber} onChange={set("licenseNumber")} />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Blood group</label>
                <input className="input" value={form.bloodGroup} onChange={set("bloodGroup")} placeholder="e.g. O+" />
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input type="number" className="input" value={form.height} onChange={set("height")} />
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
