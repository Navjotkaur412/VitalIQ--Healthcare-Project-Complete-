// Run with: npm run seed:admin
// Creates the first admin account from env vars so there's a way into the
// system before any admin exists. Safe to re-run — it skips if one exists.
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@vitaliq.local").toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin already exists for ${email}, skipping.`);
  } else {
    await User.create({
      name: process.env.SEED_ADMIN_NAME || "System Admin",
      email,
      password: process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!",
      role: "admin",
    });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
