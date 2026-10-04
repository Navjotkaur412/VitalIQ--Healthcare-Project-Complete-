const mongoose = require("mongoose");

const medicationLogSchema = new mongoose.Schema(
  {
    medication: { type: mongoose.Schema.Types.ObjectId, ref: "Medication", required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Normalized to midnight UTC so there's exactly one log per medication per calendar day
    date: { type: Date, required: true },
    status: { type: String, enum: ["taken", "missed"], required: true },
    takenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One log per medication per day
medicationLogSchema.index({ medication: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("MedicationLog", medicationLogSchema);
