const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    requestedDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    doctorNotes: { type: String, trim: true, maxlength: 500 },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, status: 1 });
appointmentSchema.index({ patient: 1, status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
