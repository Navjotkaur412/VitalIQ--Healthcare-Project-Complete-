const AuditLog = require("../models/AuditLog");

// Records an audit trail entry. Fire-and-forget — logging failures should
// never block the underlying action.
const logAction = async ({ req, action, targetType = null, targetId = null, details = "" }) => {
  try {
    await AuditLog.create({
      actor: req.user.id,
      actorRole: req.user.role,
      action,
      targetType,
      targetId,
      details,
      ip: req.ip,
    });
  } catch (err) {
    console.error("logAction() failed:", err.message);
  }
};

module.exports = { logAction };
