const mongoose = require("mongoose");

const healthReadingSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Blood pressure
    systolic: { type: Number, min: 40, max: 300 },
    diastolic: { type: Number, min: 20, max: 200 },

    // Other vitals
    bloodSugar: { type: Number, min: 20, max: 800 }, // mg/dL
    heartRate: { type: Number, min: 20, max: 250 }, // bpm
    spo2: { type: Number, min: 40, max: 100 }, // %
    temperature: { type: Number, min: 30, max: 45 }, // Celsius
    weight: { type: Number, min: 1, max: 400 }, // kg

    notes: { type: String, trim: true, maxlength: 500 },
    recordedAt: { type: Date, default: Date.now },

    // Reserved for Phase 3 (AI service will populate these later)
    aiRiskScore: { type: Number, default: null },
    aiRiskLevel: { type: String, enum: ["Low", "Moderate", "High", "Critical", null], default: null },
  },
  { timestamps: true }
);

healthReadingSchema.index({ patient: 1, recordedAt: -1 });

// At least one vital must be provided
healthReadingSchema.pre("validate", function (next) {
  const vitals = [this.systolic, this.diastolic, this.bloodSugar, this.heartRate, this.spo2, this.temperature, this.weight];
  const hasAtLeastOne = vitals.some((v) => v !== undefined && v !== null);
  if (!hasAtLeastOne) {
    return next(new Error("At least one vital reading must be provided"));
  }
  next();
});

module.exports = mongoose.model("HealthReading", healthReadingSchema);
