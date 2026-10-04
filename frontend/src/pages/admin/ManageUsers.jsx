import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users", { params: { role: role || undefined, search } });
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/admin/users", { params: { role: "doctor" } }).then(({ data }) => setDoctors(data.users));
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, search]);

  const toggleStatus = async (user) => {
    try {
      const { data } = await api.patch(`/admin/users/${user._id}/status`, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? data.user : u)));
      toast.success(`${user.name} ${data.user.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update status");
    }
  };

  const assignDoctor = async (patientId, doctorId) => {
    try {
      const { data } = await api.patch(`/admin/patients/${patientId}/assign-doctor`, { doctorId: doctorId || null });
      setUsers((prev) => prev.map((u) => (u._id === patientId ? data.user : u)));
      toast.success("Doctor assignment updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not assign doctor");
    }
  };

  const changeRole = async (user, role) => {
    if (role === user.role) return;
    if (!confirm(`Change ${user.name}'s role from ${user.role} to ${role}?`)) return;
    try {
      const { data } = await api.patch(`/admin/users/${user._id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? data.user : u)));
      toast.success(`${user.name} is now a ${role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change role");
    }
  };

  return (
    <DashboardLayout title="Manage Users">
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          className="input max-w-xs"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="patient">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="h-40 animate-pulse" />
        ) : users.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No users match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide border-b border-line">
                <th className="pb-3 pr-3">Name</th>
                <th className="pb-3 pr-3">Email</th>
                <th className="pb-3 pr-3">Role</th>
                <th className="pb-3 pr-3">Change role</th>
                <th className="pb-3 pr-3">Assigned doctor</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-3 font-medium text-ink">{u.name}</td>
                  <td className="py-3 pr-3 text-muted">{u.email}</td>
                  <td className="py-3 pr-3 capitalize">{u.role}</td>
                  <td className="py-3 pr-3">
                    <select
                      className="input py-1.5 text-xs w-28"
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                    >
                      <option value="patient">patient</option>
                      <option value="doctor">doctor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="py-3 pr-3">
                    {u.role === "patient" ? (
                      <select
                        className="input py-1.5 text-xs w-40"
                        value={u.assignedDoctor || ""}
                        onChange={(e) => assignDoctor(u._id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {doctors.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`badge ${u.isActive ? "bg-brand-light text-brand-dark" : "bg-signal-light text-signal"}`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => toggleStatus(u)} className="text-xs font-semibold text-brand hover:underline">
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
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

export default ManageUsers;
