const express = require("express");
const router = express.Router();
const {
  getUsers,
  createDoctor,
  setUserStatus,
  assignDoctor,
  setUserRole,
  getSystemStats,
} = require("../controllers/adminController");
const { getAuditLogs } = require("../controllers/auditController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

router.use(protect, authorize("admin"));

router.get("/users", getUsers);
router.post("/doctors", createDoctor);
router.patch("/users/:id/status", setUserStatus);
router.patch("/users/:id/role", setUserRole);
router.patch("/patients/:id/assign-doctor", assignDoctor);
router.get("/stats", getSystemStats);
router.get("/audit-logs", getAuditLogs);

module.exports = router;
