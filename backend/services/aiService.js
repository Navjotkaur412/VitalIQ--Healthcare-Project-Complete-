const axios = require("axios");

// This is the ONLY place the Node backend talks to the Python AI service.
// The browser never calls it directly — every route in routes/aiRoutes.js
// goes through normal JWT auth + RBAC first, then this client attaches the
// shared internal key before forwarding.
const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || "http://localhost:8000",
  timeout: 15000,
  headers: { "X-Internal-Api-Key": process.env.AI_SERVICE_INTERNAL_KEY || "" },
});

// Wraps a call so a down/misconfigured AI service degrades gracefully
// instead of taking down the feature that triggered it (e.g. logging a
// reading should never fail just because risk scoring is unavailable).
const safeCall = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (err) {
    console.error("[aiService] call failed:", err.message);
    return fallback;
  }
};

module.exports = {
  computeRisk: (patientId, readingBody = {}) =>
    aiClient.post(`/risk/${patientId}/compute`, readingBody).then((r) => r.data),
  getLatestRisk: (patientId) => aiClient.get(`/risk/${patientId}/latest`).then((r) => r.data),
  getAnomalies: (patientId) => aiClient.get(`/anomalies/${patientId}`).then((r) => r.data),
  getTrend: (patientId) => aiClient.get(`/trend/${patientId}`).then((r) => r.data),
  getWhatChanged: (patientId) => aiClient.get(`/what-changed/${patientId}`).then((r) => r.data),
  getSummary: (patientId) => aiClient.get(`/summary/${patientId}`).then((r) => r.data),
  getInsights: (patientId) => aiClient.get(`/insights/${patientId}`).then((r) => r.data),
  getFullAnalysis: (patientId) => aiClient.get(`/analysis/${patientId}`).then((r) => r.data),
  getPrioritization: (doctorId) => aiClient.get(`/prioritization/${doctorId}`).then((r) => r.data),
  askAssistant: (patientId, question) =>
    aiClient.post(`/assistant/ask`, { patientId, question }).then((r) => r.data),
  getAssistantStatus: () => aiClient.get(`/assistant/status`).then((r) => r.data),
  getAdminAiStats: () => aiClient.get(`/admin/stats`).then((r) => r.data),
  safeCall,
};
