import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import RiskBadge from "../../components/RiskBadge";
import api from "../../api/axios";
import { formatDateTime } from "../../lib/vitals";

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortByRisk, setSortByRisk] = useState(false);
  const [riskMap, setRiskMap] = useState({}); // patientId -> risk object

  const fetchPatients = async (q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get("/doctors/patients", { params: { search: q } });
      setPatients(data.patients);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrioritization = async () => {
    try {
      const { data } = await api.get("/ai/prioritization");
      const map = {};
      data.patients.forEach((p) => {
        if (p.hasData) map[p.patientId] = p.risk;
      });
      setRiskMap(map);
    } catch (err) {
      toast.error("Could not load AI risk prioritization");
      setSortByRisk(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchPatients(search), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleSortByRisk = async () => {
    if (!sortByRisk) await fetchPrioritization();
    setSortByRisk((v) => !v);
  };

  const LEVEL_RANK = { Critical: 3, High: 2, Moderate: 1, Low: 0 };
  const displayed = sortByRisk
    ? [...patients].sort((a, b) => {
        const ra = riskMap[a._id];
        const rb = riskMap[b._id];
        if (!ra && !rb) return 0;
        if (!ra) return 1;
        if (!rb) return -1;
        return LEVEL_RANK[rb.level] - LEVEL_RANK[ra.level] || rb.score - ra.score;
      })
    : patients;

  return (
    <DashboardLayout title="My Patients">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          className="input max-w-sm"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={toggleSortByRisk}
          className={`px-3 py-2 rounded-lg text-sm font-medium border ${
            sortByRisk ? "bg-brand text-white border-brand" : "bg-white text-muted border-line hover:bg-brand-light"
          }`}
        >
          Sort by AI risk
        </button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="h-40 animate-pulse" />
        ) : displayed.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No matching patients.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide border-b border-line">
                <th className="pb-3 pr-3">Name</th>
                <th className="pb-3 pr-3">Email</th>
                <th className="pb-3 pr-3">Last reading</th>
                {sortByRisk && <th className="pb-3 pr-3">AI Risk</th>}
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((p) => (
                <tr key={p._id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-3 font-medium text-ink">{p.name}</td>
                  <td className="py-3 pr-3 text-muted">{p.email}</td>
                  <td className="py-3 pr-3 text-muted">
                    {p.latestReading ? formatDateTime(p.latestReading.recordedAt) : "No readings yet"}
                  </td>
                  {sortByRisk && (
                    <td className="py-3 pr-3">
                      {riskMap[p._id] ? (
                        <RiskBadge level={riskMap[p._id].level} score={riskMap[p._id].score} />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  )}
                  <td className="py-3 text-right">
                    <Link to={`/doctor/patients/${p._id}`} className="text-xs font-semibold text-brand hover:underline">
                      View history
                    </Link>
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

export default PatientList;
