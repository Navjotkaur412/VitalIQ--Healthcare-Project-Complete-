const Notification = require("../models/Notification");

// Create a single notification for one user. Fire-and-forget by design:
// failing to notify should never fail the action that triggered it.
const notify = async ({ user, type, title, message, relatedType = null, relatedId = null }) => {
  try {
    await Notification.create({ user, type, title, message, relatedType, relatedId });
  } catch (err) {
    console.error("notify() failed:", err.message);
  }
};

// Notify several users at once (e.g. all admins, or every patient of a doctor)
const notifyMany = async (userIds, payload) => {
  await Promise.all(userIds.map((user) => notify({ ...payload, user })));
};

module.exports = { notify, notifyMany };
