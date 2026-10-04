const asyncHandler = require("express-async-handler");
const ai = require("../services/aiService");
const User = require("../models/User");

// Same access rule used throughout the app: patient sees their own data,
// their assigned doctor sees it, admin sees everything.
const canAccessPatientData = async (requester, patientId) => {
  if (requester.role === "admin") return true;
  if (requester.role === "patient") return requester.id === patientId;
  if (requester.role === "doctor") {
    const patient = await User.findById(patientId);
    return !!patient && !!patient.assignedDoctor && patient.assignedDoctor.toString() === requester.id;
  }
  return false;
};

const resolvePatientId = (req) => req.params.patientId || (req.user.role === "patient" ? req.user.id : null);

const requireAccess = asyncHandler(async (req, res, next) => {
  const patientId = resolvePatientId(req);
  if (!patientId) {
    res.status(400);
    throw new Error("A patient ID is required");
  }
  if (!(await canAccessPatientData(req.user, patientId))) {
    res.status(403);
    throw new Error("Not authorized to view this patient's AI data");
  }
  req.aiPatientId = patientId;
  next();
});

// @desc    Full combined AI analysis (risk, anomalies, trend, what-changed, summary, insights)
// @route   GET /api/ai/analysis/:patientId?
const getAnalysis = asyncHandler(async (req, res) => {
  const data = await ai.getFullAnalysis(req.aiPatientId);
  res.json(data);
});

// @desc    Risk score only
// @route   GET /api/ai/risk/:patientId?
const getRisk = asyncHandler(async (req, res) => {
  const data = await ai.getLatestRisk(req.aiPatientId);
  res.json(data);
});

// @desc    Anomalies only
// @route   GET /api/ai/anomalies/:patientId?
const getAnomalies = asyncHandler(async (req, res) => {
  const data = await ai.getAnomalies(req.aiPatientId);
  res.json(data);
});

// @desc    Trend only
// @route   GET /api/ai/trend/:patientId?
const getTrend = asyncHandler(async (req, res) => {
  const data = await ai.getTrend(req.aiPatientId);
  res.json(data);
});

// @desc    What Changed only
// @route   GET /api/ai/what-changed/:patientId?
const getWhatChanged = asyncHandler(async (req, res) => {
  const data = await ai.getWhatChanged(req.aiPatientId);
  res.json(data);
});

// @desc    AI summary only
// @route   GET /api/ai/summary/:patientId?
const getSummary = asyncHandler(async (req, res) => {
  const data = await ai.getSummary(req.aiPatientId);
  res.json(data);
});

// @desc    Insights only
// @route   GET /api/ai/insights/:patientId?
const getInsights = asyncHandler(async (req, res) => {
  const data = await ai.getInsights(req.aiPatientId);
  res.json(data);
});

// @desc    Doctor's patients ranked by risk
// @route   GET /api/ai/prioritization
// @access  Private (doctor)
const getPrioritization = asyncHandler(async (req, res) => {
  const data = await ai.getPrioritization(req.user.id);
  res.json(data);
});

// @desc    Ask the RAG doctor assistant a question about an assigned patient
// @route   POST /api/ai/assistant/ask
// @access  Private (doctor)
const askAssistant = asyncHandler(async (req, res) => {
  const { patientId, question } = req.body;
  if (!patientId || !question) {
    res.status(400);
    throw new Error("patientId and question are required");
  }

  const patient = await User.findById(patientId);
  if (!patient || !patient.assignedDoctor || patient.assignedDoctor.toString() !== req.user.id) {
    res.status(403);
    throw new Error("You can only ask about your own assigned patients");
  }

  const data = await ai.askAssistant(patientId, question);
  res.json(data);
});

// @desc    Admin-level AI statistics
// @route   GET /api/ai/admin/stats
// @access  Private (admin)
const getAdminStats = asyncHandler(async (req, res) => {
  const data = await ai.getAdminAiStats();
  res.json(data);
});

module.exports = {
  requireAccess,
  getAnalysis,
  getRisk,
  getAnomalies,
  getTrend,
  getWhatChanged,
  getSummary,
  getInsights,
  getPrioritization,
  askAssistant,
  getAdminStats,
};
