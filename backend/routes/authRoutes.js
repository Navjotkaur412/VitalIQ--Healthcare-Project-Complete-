const express = require("express");
const router = express.Router();
const {
  registerPatient,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", registerPatient);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

module.exports = router;
