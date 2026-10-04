const asyncHandler = require("express-async-handler");
const Medication = require("../models/Medication");
const MedicationLog = require("../models/MedicationLog");
const User = require("../models/User");
const { notify } = require("../utils/notify");
const { generateDueReminders } = require("../utils/medicationReminders");

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// @desc    Doctor prescribes a new medication for one of their patients
// @route   POST /api/medications
// @access  Private (doctor)
const prescribeMedication = asyncHandler(async (req, res) => {
  const { patientId, name, dosage, frequency, instructions, startDate, endDate } = req.body;

  if (!patientId || !name || !dosage || !frequency) {
    res.status(400);
    throw new Error("Patient, name, dosage, and frequency are required");
  }

  const patient = await User.findById(patientId);
  if (!patient || patient.role !== "patient" || patient.assignedDoctor?.toString() !== req.user.id) {
    res.status(403);
    throw new Error("You can only prescribe medications for your own assigned patients");
  }

  const medication = await Medication.create({
    patient: patientId,
    prescribedBy: req.user.id,
    name,
    dosage,
    frequency,
    instructions,
    startDate: startDate || Date.now(),
    endDate: endDate || null,
  });

  await notify({
    user: patientId,
    type: "system",
    title: "New medication prescribed",
    message: `Dr. ${req.user.name} prescribed ${name} (${dosage}, ${frequency}).`,
    relatedType: "Medication",
    relatedId: medication._id,
  });

  res.status(201).json({ success: true, medication });
});

// @desc    Doctor updates or deactivates a medication they prescribed
// @route   PUT /api/medications/:id
// @access  Private (doctor who prescribed it)
const updateMedication = asyncHandler(async (req, res) => {
  const medication = await Medication.findById(req.params.id);
  if (!medication) {
    res.status(404);
    throw new Error("Medication not found");
  }
  if (medication.prescribedBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to edit this medication");
  }

  const editable = ["name", "dosage", "frequency", "instructions", "endDate", "isActive"];
  for (const field of editable) {
    if (req.body[field] !== undefined) medication[field] = req.body[field];
  }
  await medication.save();

  res.json({ success: true, medication });
});

// @desc    List medications for a patient (self, their doctor, or admin)
// @route   GET /api/medications/patient/:patientId?
// @access  Private
const getPatientMedications = asyncHandler(async (req, res) => {
  const patientId = req.params.patientId || req.user.id;

  if (req.user.role === "patient" && req.user.id !== patientId) {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (req.user.role === "doctor") {
    const patient = await User.findById(patientId);
    if (!patient || patient.assignedDoctor?.toString() !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to view this patient's medications");
    }
  }

  const medications = await Medication.find({ patient: patientId }).sort({ isActive: -1, createdAt: -1 });

  // Attach today's log status (if any) for the patient's own view
  const today = startOfDay(new Date());
  const logs = await MedicationLog.find({ medication: { $in: medications.map((m) => m._id) }, date: today });
  const logByMed = new Map(logs.map((l) => [l.medication.toString(), l.status]));

  const withStatus = medications.map((m) => ({
    ...m.toObject(),
    todayStatus: logByMed.get(m._id.toString()) || (m.isDueOn(today) ? "pending" : "not_due"),
  }));

  res.json({ success: true, medications: withStatus });
});

// @desc    Patient marks one of their medications taken or missed for today
// @route   POST /api/medications/:id/log
// @access  Private (patient who owns it)
const logMedication = asyncHandler(async (req, res) => {
  const { status, date } = req.body;
  if (!["taken", "missed"].includes(status)) {
    res.status(400);
    throw new Error("Status must be 'taken' or 'missed'");
  }

  const medication = await Medication.findById(req.params.id);
  if (!medication) {
    res.status(404);
    throw new Error("Medication not found");
  }
  if (medication.patient.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to log this medication");
  }

  const logDate = startOfDay(date || new Date());

  const log = await MedicationLog.findOneAndUpdate(
    { medication: medication._id, date: logDate },
    { status, takenAt: new Date(), patient: req.user.id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, log });
});

// @desc    Medication adherence percentage for a patient over the last N days
// @route   GET /api/medications/adherence/:patientId?
// @access  Private
const getAdherence = asyncHandler(async (req, res) => {
  const patientId = req.params.patientId || req.user.id;
  const days = Math.min(Number(req.query.days) || 30, 180);

  if (req.user.role === "patient" && req.user.id !== patientId) {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (req.user.role === "doctor") {
    const patient = await User.findById(patientId);
    if (!patient || patient.assignedDoctor?.toString() !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to view this patient's adherence");
    }
  }

  const since = startOfDay(new Date());
  since.setDate(since.getDate() - days);

  const medications = await Medication.find({ patient: patientId });
  const medIds = medications.map((m) => m._id);
  const logs = await MedicationLog.find({ medication: { $in: medIds }, date: { $gte: since } });

  // Count expected doses (days each medication was due) vs. taken
  let expected = 0;
  let taken = 0;
  const cursor = new Date(since);
  const today = startOfDay(new Date());
  while (cursor <= today) {
    for (const m of medications) {
      if (m.isDueOn(cursor)) expected++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  taken = logs.filter((l) => l.status === "taken").length;

  const adherenceRate = expected > 0 ? Math.round((taken / expected) * 100) : null;

  res.json({
    success: true,
    adherence: { expected, taken, missed: logs.filter((l) => l.status === "missed").length, adherenceRate, days },
  });
});

module.exports = {
  prescribeMedication,
  updateMedication,
  getPatientMedications,
  logMedication,
  getAdherence,
};

// Export the reminder generator too, so routes can trigger it on demand
module.exports.generateDueReminders = generateDueReminders;
