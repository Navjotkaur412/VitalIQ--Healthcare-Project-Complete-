const express = require("express");
const router = express.Router();
const { downloadHealthReport } = require("../controllers/reportController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/health/:patientId?", downloadHealthReport);

module.exports = router;
