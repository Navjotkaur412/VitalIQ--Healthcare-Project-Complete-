const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true }, // e.g. "500mg"
    frequency: { type: String, required: true, trim: true }, // e.g. "Twice daily"
    instructions: { type: String, trim: true, maxlength: 500 },

    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null }, // null = ongoing

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

medicationSchema.index({ patient: 1, isActive: 1 });

// A medication is "due" on a given day if that day falls within its active date range
medicationSchema.methods.isDueOn = function (date) {
  if (!this.isActive) return false;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const start = new Date(this.startDate);
  start.setHours(0, 0, 0, 0);
  if (d < start) return false;
  if (this.endDate) {
    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999);
    if (d > end) return false;
  }
  return true;
};

module.exports = mongoose.model("Medication", medicationSchema);
