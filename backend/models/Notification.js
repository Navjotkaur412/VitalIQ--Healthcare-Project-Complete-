const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: {
      type: String,
      enum: ["appointment", "medication_reminder", "system", "high_risk"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    relatedType: { type: String, enum: ["Appointment", "Medication", "HealthReading", null], default: null },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },

    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
