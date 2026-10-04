export const VITAL_FIELDS = [
  { key: "systolic", label: "Systolic BP", unit: "mmHg", group: "bp" },
  { key: "diastolic", label: "Diastolic BP", unit: "mmHg", group: "bp" },
  { key: "bloodSugar", label: "Blood Sugar", unit: "mg/dL" },
  { key: "heartRate", label: "Heart Rate", unit: "bpm" },
  { key: "spo2", label: "SpO₂", unit: "%" },
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "weight", label: "Weight", unit: "kg" },
];

export const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
