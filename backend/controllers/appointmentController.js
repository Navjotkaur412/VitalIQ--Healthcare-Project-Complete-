const asyncHandler = require("express-async-handler");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { notify } = require("../utils/notify");
const { logAction } = require("../utils/audit");

// @desc    Patient books an appointment with their assigned doctor
// @route   POST /api/appointments
// @access  Private (patient)
const bookAppointment = asyncHandler(async (req, res) => {
  const { requestedDate, reason } = req.body;

  if (!requestedDate || !reason) {
    res.status(400);
    throw new Error("Requested date and reason are required");
  }

  const patient = await User.findById(req.user.id);
  if (!patient.assignedDoctor) {
    res.status(400);
    throw new Error("You don't have an assigned doctor yet. Contact an administrator.");
  }

  const appointment = await Appointment.create({
    patient: req.user.id,
    doctor: patient.assignedDoctor,
    requestedDate,
    reason,
  });

  await notify({
    user: patient.assignedDoctor,
    type: "appointment",
    title: "New appointment request",
    message: `${patient.name} requested an appointment for ${new Date(requestedDate).toLocaleString()}`,
    relatedType: "Appointment",
    relatedId: appointment._id,
  });

  res.status(201).json({ success: true, appointment });
});

// @desc    Get the logged-in patient's own appointments
// @route   GET /api/appointments/mine
// @access  Private (patient)
const getMyAppointments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { patient: req.user.id };
  if (status) query.status = status;

  const appointments = await Appointment.find(query).populate("doctor", "name specialization").sort({ requestedDate: -1 });
  res.json({ success: true, appointments });
});

// @desc    Get appointments for the logged-in doctor
// @route   GET /api/appointments/doctor
// @access  Private (doctor)
const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { doctor: req.user.id };
  if (status) query.status = status;

  const appointments = await Appointment.find(query).populate("patient", "name email").sort({ requestedDate: 1 });
  res.json({ success: true, appointments });
});

// @desc    Doctor approves, rejects, or completes an appointment
// @route   PATCH /api/appointments/:id/status
// @access  Private (doctor who owns it)
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, doctorNotes } = req.body;
  const allowed = ["approved", "rejected", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowed.join(", ")}`);
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }
  if (appointment.doctor.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to update this appointment");
  }

  appointment.status = status;
  if (doctorNotes !== undefined) appointment.doctorNotes = doctorNotes;
  appointment.respondedAt = new Date();
  await appointment.save();

  await notify({
    user: appointment.patient,
    type: "appointment",
    title: `Appointment ${status}`,
    message: `Your appointment request for ${appointment.requestedDate.toLocaleString()} was ${status}.`,
    relatedType: "Appointment",
    relatedId: appointment._id,
  });

  await logAction({
    req,
    action: `APPOINTMENT_${status.toUpperCase()}`,
    targetType: "Appointment",
    targetId: appointment._id,
  });

  res.json({ success: true, appointment });
});

// @desc    Patient cancels their own pending appointment
// @route   PATCH /api/appointments/:id/cancel
// @access  Private (patient who owns it)
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }
  if (appointment.patient.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to cancel this appointment");
  }
  if (!["pending", "approved"].includes(appointment.status)) {
    res.status(400);
    throw new Error("Only pending or approved appointments can be cancelled");
  }

  appointment.status = "cancelled";
  await appointment.save();

  await notify({
    user: appointment.doctor,
    type: "appointment",
    title: "Appointment cancelled",
    message: `A patient cancelled their appointment scheduled for ${appointment.requestedDate.toLocaleString()}.`,
    relatedType: "Appointment",
    relatedId: appointment._id,
  });

  res.json({ success: true, appointment });
});

module.exports = {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
};
