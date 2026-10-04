const Medication = require("../models/Medication");
const Notification = require("../models/Notification");
const MedicationLog = require("../models/MedicationLog");

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

// Ensures today's "take your medication" reminders exist for a patient's
// active, due medications that haven't already been logged taken/missed today.
// Called lazily (e.g. when the patient loads their dashboard/notifications)
// rather than via a background cron job.
const generateDueReminders = async (patientId) => {
  const today = startOfToday();
  const medications = await Medication.find({ patient: patientId, isActive: true });
  const dueMeds = medications.filter((m) => m.isDueOn(today));
  if (dueMeds.length === 0) return;

  const medIds = dueMeds.map((m) => m._id);

  const [alreadyLogged, alreadyNotified] = await Promise.all([
    MedicationLog.find({ medication: { $in: medIds }, date: today }).select("medication"),
    Notification.find({
      user: patientId,
      type: "medication_reminder",
      relatedId: { $in: medIds },
      createdAt: { $gte: today, $lte: endOfToday() },
    }).select("relatedId"),
  ]);

  const loggedIds = new Set(alreadyLogged.map((l) => l.medication.toString()));
  const notifiedIds = new Set(alreadyNotified.map((n) => n.relatedId.toString()));

  const toCreate = dueMeds.filter((m) => !loggedIds.has(m._id.toString()) && !notifiedIds.has(m._id.toString()));

  if (toCreate.length > 0) {
    await Notification.insertMany(
      toCreate.map((m) => ({
        user: patientId,
        type: "medication_reminder",
        title: "Medication reminder",
        message: `Time to take ${m.name} (${m.dosage}) — ${m.frequency}`,
        relatedType: "Medication",
        relatedId: m._id,
      }))
    );
  }
};

module.exports = { generateDueReminders };
