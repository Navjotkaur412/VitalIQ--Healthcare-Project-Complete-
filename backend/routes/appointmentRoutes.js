const express = require("express");
const router = express.Router();
const {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

router.use(protect);

router.post("/", authorize("patient"), bookAppointment);
router.get("/mine", authorize("patient"), getMyAppointments);
router.get("/doctor", authorize("doctor"), getDoctorAppointments);
router.patch("/:id/status", authorize("doctor"), updateAppointmentStatus);
router.patch("/:id/cancel", authorize("patient"), cancelAppointment);

module.exports = router;
