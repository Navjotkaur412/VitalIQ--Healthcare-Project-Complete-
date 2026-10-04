const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorRole: { type: String, enum: ["patient", "doctor", "admin"], required: true },

    action: { type: String, required: true, index: true }, // e.g. "USER_DEACTIVATED", "DOCTOR_CREATED"
    targetType: { type: String, default: null }, // e.g. "User", "Appointment"
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },

    details: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
