const express = require("express");
const router = express.Router();
const {
  prescribeMedication,
  updateMedication,
  getPatientMedications,
  logMedication,
  getAdherence,
} = require("../controllers/medicationController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

router.use(protect);

router.post("/", authorize("doctor"), prescribeMedication);
router.put("/:id", authorize("doctor"), updateMedication);
router.get("/patient/:patientId?", getPatientMedications);
router.post("/:id/log", authorize("patient"), logMedication);
router.get("/adherence/:patientId?", getAdherence);

module.exports = router;
