const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const HealthReading = require("../models/HealthReading");

// @desc    Get all patients assigned to the logged-in doctor
// @route   GET /api/doctors/patients
// @access  Private (doctor)
const getMyPatients = asyncHandler(async (req, res) => {
  const { search = "" } = req.query;

  const query = { role: "patient", assignedDoctor: req.user.id };
  if (search) {
    query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
  }

  const patients = await User.find(query).select("-password").sort({ name: 1 });

  // Attach each patient's most recent reading so the list is useful without extra round trips
  const patientsWithLatest = await Promise.all(
    patients.map(async (p) => {
      const latest = await HealthReading.findOne({ patient: p._id }).sort({ recordedAt: -1 });
      return { ...p.toObject(), latestReading: latest || null };
    })
  );

  res.json({ success: true, count: patientsWithLatest.length, patients: patientsWithLatest });
});

module.exports = { getMyPatients };
