const express = require("express");
const router = express.Router();
const {
  requireAccess,
  getAnalysis,
  getRisk,
  getAnomalies,
  getTrend,
  getWhatChanged,
  getSummary,
  getInsights,
  getPrioritization,
  askAssistant,
  getAdminStats,
} = require("../controllers/aiController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

router.use(protect);

// Per-patient AI data — access checked inside requireAccess (patient self / assigned doctor / admin)
router.get("/analysis/:patientId?", requireAccess, getAnalysis);
router.get("/risk/:patientId?", requireAccess, getRisk);
router.get("/anomalies/:patientId?", requireAccess, getAnomalies);
router.get("/trend/:patientId?", requireAccess, getTrend);
router.get("/what-changed/:patientId?", requireAccess, getWhatChanged);
router.get("/summary/:patientId?", requireAccess, getSummary);
router.get("/insights/:patientId?", requireAccess, getInsights);

// Doctor-only
router.get("/prioritization", authorize("doctor"), getPrioritization);
router.post("/assistant/ask", authorize("doctor"), askAssistant);

// Admin-only
router.get("/admin/stats", authorize("admin"), getAdminStats);

module.exports = router;
