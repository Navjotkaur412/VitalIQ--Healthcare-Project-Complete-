const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const { logAction } = require("../utils/audit");

// @desc    List all users, optionally filtered by role/search/status
// @route   GET /api/admin/users
// @access  Private (admin)
const getUsers = asyncHandler(async (req, res) => {
  const { role, search = "", status } = req.query;
  const query = {};
  if (role) query.role = role;
  if (status === "active") query.isActive = true;
  if (status === "inactive") query.isActive = false;
  if (search) {
    query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
  }

  const users = await User.find(query).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

// @desc    Admin creates a doctor account directly (doctors don't self-register)
// @route   POST /api/admin/doctors
// @access  Private (admin)
const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, specialization, licenseNumber, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const doctor = await User.create({
    name,
    email,
    password,
    role: "doctor",
    specialization,
    licenseNumber,
    phone,
    createdBy: req.user.id,
  });

  await logAction({
    req,
    action: "DOCTOR_CREATED",
    targetType: "User",
    targetId: doctor._id,
    details: `Created doctor account for ${doctor.email}`,
  });

  res.status(201).json({ success: true, user: doctor.toSafeObject() });
});

// @desc    Activate or deactivate any user account
// @route   PATCH /api/admin/users/:id/status
// @access  Private (admin)
const setUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") {
    res.status(400);
    throw new Error("isActive must be true or false");
  }
  if (req.params.id === req.user.id) {
    res.status(400);
    throw new Error("You cannot change your own account status");
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await logAction({
    req,
    action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    targetType: "User",
    targetId: user._id,
    details: `${isActive ? "Activated" : "Deactivated"} ${user.email}`,
  });

  res.json({ success: true, user: user.toSafeObject() });
});

// @desc    Assign or reassign a patient to a doctor
// @route   PATCH /api/admin/patients/:id/assign-doctor
// @access  Private (admin)
const assignDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.body;

  const patient = await User.findById(req.params.id);
  if (!patient || patient.role !== "patient") {
    res.status(404);
    throw new Error("Patient not found");
  }

  if (doctorId) {
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      res.status(400);
      throw new Error("Invalid doctor ID");
    }
  }

  patient.assignedDoctor = doctorId || null;
  await patient.save();

  await logAction({
    req,
    action: "PATIENT_DOCTOR_ASSIGNED",
    targetType: "User",
    targetId: patient._id,
    details: doctorId ? `Assigned doctor ${doctorId} to ${patient.email}` : `Unassigned doctor from ${patient.email}`,
  });

  res.json({ success: true, user: patient.toSafeObject() });
});

// @desc    Update any user's role (rare, but part of role management)
// @route   PATCH /api/admin/users/:id/role
// @access  Private (admin)
const setUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["patient", "doctor", "admin"].includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }
  if (req.params.id === req.user.id) {
    res.status(400);
    throw new Error("You cannot change your own role");
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await logAction({
    req,
    action: "USER_ROLE_CHANGED",
    targetType: "User",
    targetId: user._id,
    details: `Changed role of ${user.email} to ${role}`,
  });

  res.json({ success: true, user: user.toSafeObject() });
});

// @desc    Basic system counts for the admin dashboard
// @route   GET /api/admin/stats
// @access  Private (admin)
const getSystemStats = asyncHandler(async (req, res) => {
  const [
    totalPatients,
    totalDoctors,
    activePatients,
    activeDoctors,
    inactiveUsers,
    pendingAppointments,
    approvedAppointments,
    completedAppointments,
    rejectedAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    User.countDocuments({ role: "patient" }),
    User.countDocuments({ role: "doctor" }),
    User.countDocuments({ role: "patient", isActive: true }),
    User.countDocuments({ role: "doctor", isActive: true }),
    User.countDocuments({ isActive: false }),
    Appointment.countDocuments({ status: "pending" }),
    Appointment.countDocuments({ status: "approved" }),
    Appointment.countDocuments({ status: "completed" }),
    Appointment.countDocuments({ status: "rejected" }),
    Appointment.countDocuments({ status: "cancelled" }),
  ]);

  res.json({
    success: true,
    stats: {
      totalPatients,
      totalDoctors,
      activePatients,
      activeDoctors,
      inactiveUsers,
      appointments: {
        pending: pendingAppointments,
        approved: approvedAppointments,
        completed: completedAppointments,
        rejected: rejectedAppointments,
        cancelled: cancelledAppointments,
        total:
          pendingAppointments + approvedAppointments + completedAppointments + rejectedAppointments + cancelledAppointments,
      },
    },
  });
});

module.exports = { getUsers, createDoctor, setUserStatus, assignDoctor, setUserRole, getSystemStats };
