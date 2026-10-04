const asyncHandler = require("express-async-handler");
const HealthReading = require("../models/HealthReading");
const User = require("../models/User");
const ai = require("../services/aiService");
const { notify } = require("../utils/notify");

const VITAL_FIELDS = ["systolic", "diastolic", "bloodSugar", "heartRate", "spo2", "temperature", "weight"];

// Fires risk scoring for a newly-created reading and, if the result comes
// back High/Critical, alerts the patient's assigned doctor. Runs after the
// response has already been sent — a slow or unavailable AI service should
// never make reading submission feel slow or broken for the patient.
const scoreAndAlert = async (reading) => {
  const result = await ai.safeCall(() => ai.computeRisk(reading.patient.toString()));
  if (!result || !result.risk) return;

  const { level, score } = result.risk;
  if (level !== "High" && level !== "Critical") return;

  const patient = await User.findById(reading.patient);
  if (!patient || !patient.assignedDoctor) return;

  await notify({
    user: patient.assignedDoctor,
    type: "high_risk",
    title: `High-risk alert: ${patient.name}`,
    message: `${patient.name}'s latest reading scored ${level} risk (${score}/100). Review their vitals when you can.`,
    relatedType: "HealthReading",
    relatedId: reading._id,
  });
};

// Helper: can `requester` view readings belonging to `patientId`?
const canAccessPatientData = async (requester, patientId) => {
  if (requester.role === "admin") return true;
  if (requester.role === "patient") return requester.id === patientId;
  if (requester.role === "doctor") {
    const patient = await User.findById(patientId);
    return !!patient && !!patient.assignedDoctor && patient.assignedDoctor.toString() === requester.id;
  }
  return false;
};

// @desc    Patient submits a new health reading
// @route   POST /api/health-readings
// @access  Private (patient)
const createReading = asyncHandler(async (req, res) => {
  const payload = { patient: req.user.id, notes: req.body.notes };
  let hasVital = false;

  for (const field of VITAL_FIELDS) {
    if (req.body[field] !== undefined && req.body[field] !== "" && req.body[field] !== null) {
      payload[field] = Number(req.body[field]);
      hasVital = true;
    }
  }
  if (req.body.recordedAt) payload.recordedAt = req.body.recordedAt;

  if (!hasVital) {
    res.status(400);
    throw new Error("Provide at least one vital reading");
  }

  const reading = await HealthReading.create(payload);
  res.status(201).json({ success: true, reading });

  // Fire-and-forget: don't let AI service latency/downtime delay this response
  scoreAndAlert(reading).catch((err) => console.error("[scoreAndAlert] failed:", err.message));
});

// @desc    Get the patient's most recent reading
// @route   GET /api/health-readings/latest/:patientId?
// @access  Private (patient self, doctor of patient, admin)
const getLatestReading = asyncHandler(async (req, res) => {
  const patientId = req.params.patientId || req.user.id;

  if (!(await canAccessPatientData(req.user, patientId))) {
    res.status(403);
    throw new Error("Not authorized to view this patient's data");
  }

  const reading = await HealthReading.findOne({ patient: patientId }).sort({ recordedAt: -1 });
  res.json({ success: true, reading: reading || null });
});

// @desc    Get a patient's reading history (paginated, optional date range)
// @route   GET /api/health-readings/history/:patientId?
// @access  Private (patient self, doctor of patient, admin)
const getReadingHistory = asyncHandler(async (req, res) => {
  const patientId = req.params.patientId || req.user.id;

  if (!(await canAccessPatientData(req.user, patientId))) {
    res.status(403);
    throw new Error("Not authorized to view this patient's data");
  }

  const { from, to, page = 1, limit = 30 } = req.query;
  const query = { patient: patientId };
  if (from || to) {
    query.recordedAt = {};
    if (from) query.recordedAt.$gte = new Date(from);
    if (to) query.recordedAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [readings, total] = await Promise.all([
    HealthReading.find(query).sort({ recordedAt: -1 }).skip(skip).limit(Number(limit)),
    HealthReading.countDocuments(query),
  ]);

  res.json({
    success: true,
    readings,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
});

// @desc    Update one of the patient's own readings (e.g. fix a typo)
// @route   PUT /api/health-readings/:id
// @access  Private (patient who owns it)
const updateReading = asyncHandler(async (req, res) => {
  const reading = await HealthReading.findById(req.params.id);
  if (!reading) {
    res.status(404);
    throw new Error("Reading not found");
  }
  if (reading.patient.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to edit this reading");
  }

  for (const field of VITAL_FIELDS) {
    if (req.body[field] !== undefined) reading[field] = req.body[field] === "" ? undefined : Number(req.body[field]);
  }
  if (req.body.notes !== undefined) reading.notes = req.body.notes;

  await reading.save();
  res.json({ success: true, reading });
});

// @desc    Delete one of the patient's own readings
// @route   DELETE /api/health-readings/:id
// @access  Private (patient who owns it, or admin)
const deleteReading = asyncHandler(async (req, res) => {
  const reading = await HealthReading.findById(req.params.id);
  if (!reading) {
    res.status(404);
    throw new Error("Reading not found");
  }
  if (reading.patient.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this reading");
  }

  await reading.deleteOne();
  res.json({ success: true, message: "Reading deleted" });
});

module.exports = { createReading, getLatestReading, getReadingHistory, updateReading, deleteReading };
