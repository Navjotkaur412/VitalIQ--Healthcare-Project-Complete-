const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { generateDueReminders } = require("../utils/medicationReminders");
const { notifyMany } = require("../utils/notify");

// @desc    Get the logged-in user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  // Lazily generate today's medication reminders for patients before listing
  if (req.user.role === "patient") {
    await generateDueReminders(req.user.id).catch(() => {});
  }

  const { unreadOnly } = req.query;
  const query = { user: req.user.id };
  if (unreadOnly === "true") query.read = false;

  const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });

  res.json({ success: true, notifications, unreadCount });
});

// @desc    Mark one notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private (owner)
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  notification.read = true;
  await notification.save();
  res.json({ success: true, notification });
});

// @desc    Mark all of the logged-in user's notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ success: true, message: "All notifications marked as read" });
});

// @desc    Admin sends a system notification to one user, a role, or everyone
// @route   POST /api/notifications/broadcast
// @access  Private (admin)
const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, userId, role } = req.body;
  if (!title || !message) {
    res.status(400);
    throw new Error("Title and message are required");
  }

  let targetIds = [];
  if (userId) {
    targetIds = [userId];
  } else if (role) {
    const users = await User.find({ role }).select("_id");
    targetIds = users.map((u) => u._id);
  } else {
    const users = await User.find({}).select("_id");
    targetIds = users.map((u) => u._id);
  }

  await notifyMany(targetIds, { type: "system", title, message });

  res.status(201).json({ success: true, message: `Notification sent to ${targetIds.length} user(s)` });
});

module.exports = { getNotifications, markAsRead, markAllAsRead, broadcastNotification };
