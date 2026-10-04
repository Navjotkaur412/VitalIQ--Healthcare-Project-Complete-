const asyncHandler = require("express-async-handler");
const AuditLog = require("../models/AuditLog");

// @desc    List audit log entries, newest first, with optional filters
// @route   GET /api/admin/audit-logs
// @access  Private (admin)
const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, actorRole, page = 1, limit = 50 } = req.query;
  const query = {};
  if (action) query.action = action;
  if (actorRole) query.actorRole = actorRole;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(query).populate("actor", "name email role").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    logs,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
});

module.exports = { getAuditLogs };
