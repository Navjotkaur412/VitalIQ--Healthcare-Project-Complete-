const express = require("express");
const router = express.Router();
const { getMyPatients } = require("../controllers/doctorController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

router.use(protect, authorize("doctor"));

router.get("/patients", getMyPatients);

module.exports = router;
