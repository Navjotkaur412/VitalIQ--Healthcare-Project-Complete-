const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

const PATIENT_EDITABLE_FIELDS = ["name", "phone", "dateOfBirth", "gender", "address", "bloodGroup", "height"];
const DOCTOR_EDITABLE_FIELDS = ["name", "phone", "dateOfBirth", "gender", "address", "specialization", "licenseNumber"];

// @desc    Update the logged-in user's own profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = req.user.role === "doctor" ? DOCTOR_EDITABLE_FIELDS : PATIENT_EDITABLE_FIELDS;
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, user: user.toSafeObject() });
});

// @desc    Upload/replace the logged-in user's profile picture
// @route   POST /api/users/profile-picture
// @access  Private
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image file provided");
  }

  const user = await User.findById(req.user.id);

  // Remove the old picture file if one exists
  if (user.profilePicture) {
    const oldPath = path.join(__dirname, "..", user.profilePicture);
    fs.unlink(oldPath, () => {}); // best-effort, ignore errors
  }

  user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
  await user.save();

  res.json({ success: true, profilePicture: user.profilePicture });
});

// @desc    Get a single user's public profile (doctor viewing a patient, etc. — access checked in route)
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // A doctor may only view patients assigned to them; patients may only view themselves
  const isSelf = req.user.id === user.id;
  const isAssignedDoctor =
    req.user.role === "doctor" && user.assignedDoctor && user.assignedDoctor.toString() === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAssignedDoctor && !isAdmin) {
    res.status(403);
    throw new Error("You are not authorized to view this profile");
  }

  res.json({ success: true, user: user.toSafeObject() });
});

module.exports = { updateProfile, uploadProfilePicture, getUserById };
