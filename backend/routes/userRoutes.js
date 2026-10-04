const express = require("express");
const router = express.Router();
const { updateProfile, uploadProfilePicture, getUserById } = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);

router.put("/profile", updateProfile);
router.post("/profile-picture", upload.single("profilePicture"), uploadProfilePicture);
router.get("/:id", getUserById);

module.exports = router;
