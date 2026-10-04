const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateAuthToken, generateResetToken } = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

// @desc    Register a new patient (doctors/admins are created by an admin)
// @route   POST /api/auth/register
// @access  Public
const registerPatient = asyncHandler(async (req, res) => {
  const { name, email, password, phone, dateOfBirth, gender } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    dateOfBirth,
    gender,
    role: "patient",
  });

  const token = generateAuthToken(user._id, user.role);
  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

// @desc    Login for patient, doctor, or admin (single unified endpoint)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error("Account is deactivated. Contact an administrator.");
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateAuthToken(user._id, user.role);
  res.json({ success: true, token, user: user.toSafeObject() });
});

// @desc    Get the logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Request a password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond the same way, whether or not the account exists,
  // so the endpoint can't be used to enumerate registered emails.
  const genericResponse = {
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
  };

  if (!user) {
    return res.json(genericResponse);
  }

  const resetToken = generateResetToken(user._id);
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "VitalIQ AI - Password Reset",
    html: `<p>Hi ${user.name},</p><p>Click the link below to reset your password. This link expires in 15 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  res.json(genericResponse);
});

// @desc    Reset password using a valid reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400);
    throw new Error("Token and new password are required");
  }
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
  } catch (err) {
    res.status(400);
    throw new Error("Reset link is invalid or has expired");
  }

  if (decoded.purpose !== "password_reset") {
    res.status(400);
    throw new Error("Invalid reset token");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.password = newPassword; // pre-save hook re-hashes and sets passwordChangedAt
  await user.save();

  res.json({ success: true, message: "Password has been reset. You can now log in." });
});

// @desc    Change password while logged in
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current and new password are required");
  }
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("New password must be at least 8 characters");
  }

  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password updated successfully" });
});

module.exports = {
  registerPatient,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
