const express = require("express");
const router = express.Router();
const {
  createReading,
  getLatestReading,
  getReadingHistory,
  updateReading,
  deleteReading,
} = require("../controllers/healthController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

router.use(protect);

router.post("/", authorize("patient"), createReading);
router.get("/latest/:patientId?", getLatestReading);
router.get("/history/:patientId?", getReadingHistory);
router.put("/:id", authorize("patient"), updateReading);
router.delete("/:id", authorize("patient", "admin"), deleteReading);

module.exports = router;
