import api from "../api/axios";

export const downloadHealthReport = async (patientId, patientName = "patient") => {
  const res = await api.get(`/reports/health/${patientId || ""}`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `VitalIQ-Report-${patientName.replace(/\s+/g, "_")}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
