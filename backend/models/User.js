const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email"],
    },
    password: { type: String, required: [true, "Password is required"], minlength: 8, select: false },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
      required: true,
    },

    // Common profile fields
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    address: { type: String, trim: true },
    profilePicture: { type: String, default: null }, // relative path served statically

    // Patient-specific
    bloodGroup: { type: String },
    height: { type: Number }, // cm
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Doctor-specific
    specialization: { type: String },
    licenseNumber: { type: String },

    // Account status & security
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    passwordChangedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // for admin-created doctors
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ assignedDoctor: 1 });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak password/__v in API responses
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
