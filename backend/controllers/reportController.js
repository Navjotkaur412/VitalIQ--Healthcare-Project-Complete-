const asyncHandler = require("express-async-handler");
const PDFDocument = require("pdfkit");
const User = require("../models/User");
const HealthReading = require("../models/HealthReading");
const Medication = require("../models/Medication");
const Appointment = require("../models/Appointment");

const BRAND_COLOR = "#0F5C56";
const MUTED_COLOR = "#5C7570";
const INK_COLOR = "#0E2422";

const canAccessPatientData = async (requester, patientId) => {
  if (requester.role === "admin") return true;
  if (requester.role === "patient") return requester.id === patientId;
  if (requester.role === "doctor") {
    const patient = await User.findById(patientId);
    return !!patient && !!patient.assignedDoctor && patient.assignedDoctor.toString() === requester.id;
  }
  return false;
};

// @desc    Download a PDF health report for a patient
// @route   GET /api/reports/health/:patientId?
// @access  Private (patient self, assigned doctor, admin)
const downloadHealthReport = asyncHandler(async (req, res) => {
  const patientId = req.params.patientId || req.user.id;

  if (!(await canAccessPatientData(req.user, patientId))) {
    res.status(403);
    throw new Error("Not authorized to generate a report for this patient");
  }

  const patient = await User.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const [readings, medications, appointments] = await Promise.all([
    HealthReading.find({ patient: patientId }).sort({ recordedAt: -1 }).limit(20),
    Medication.find({ patient: patientId }).sort({ isActive: -1, createdAt: -1 }),
    Appointment.find({ patient: patientId }).populate("doctor", "name").sort({ requestedDate: -1 }).limit(10),
  ]);

  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="VitalIQ-Report-${patient.name.replace(/\s+/g, "_")}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fillColor(BRAND_COLOR).fontSize(20).font("Helvetica-Bold").text("VitalIQ AI — Health Report");
  doc.fillColor(MUTED_COLOR).fontSize(9).font("Helvetica").text(`Generated ${new Date().toLocaleString()}`);
  doc.moveDown(1);
  doc.strokeColor("#E1EAE7").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // Patient info
  doc.fillColor(INK_COLOR).fontSize(13).font("Helvetica-Bold").text("Patient Information");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").fillColor(INK_COLOR);
  doc.text(`Name: ${patient.name}`);
  doc.text(`Email: ${patient.email}`);
  if (patient.dateOfBirth) doc.text(`Date of birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`);
  if (patient.bloodGroup) doc.text(`Blood group: ${patient.bloodGroup}`);
  doc.moveDown(1);

  // Recent vitals
  doc.fontSize(13).font("Helvetica-Bold").fillColor(INK_COLOR).text("Recent Vitals (last 20 readings)");
  doc.moveDown(0.3);

  if (readings.length === 0) {
    doc.fontSize(10).font("Helvetica").fillColor(MUTED_COLOR).text("No readings recorded.");
  } else {
    const headers = ["Date", "BP", "Sugar", "HR", "SpO2", "Temp", "Weight"];
    const colWidths = [95, 65, 55, 50, 50, 50, 55];
    let y = doc.y;
    doc.fontSize(8).font("Helvetica-Bold").fillColor(MUTED_COLOR);
    let x = 50;
    headers.forEach((h, i) => {
      doc.text(h, x, y, { width: colWidths[i] });
      x += colWidths[i];
    });
    y += 14;
    doc.font("Helvetica").fillColor(INK_COLOR);

    readings.forEach((r) => {
      if (y > 740) {
        doc.addPage();
        y = 50;
      }
      x = 50;
      const row = [
        new Date(r.recordedAt).toLocaleDateString(),
        r.systolic && r.diastolic ? `${r.systolic}/${r.diastolic}` : "-",
        r.bloodSugar ?? "-",
        r.heartRate ?? "-",
        r.spo2 ?? "-",
        r.temperature ?? "-",
        r.weight ?? "-",
      ];
      row.forEach((val, i) => {
        doc.text(String(val), x, y, { width: colWidths[i] });
        x += colWidths[i];
      });
      y += 14;
    });
    doc.y = y;
  }
  doc.moveDown(1);

  // Medications
  doc.fontSize(13).font("Helvetica-Bold").fillColor(INK_COLOR).text("Medications");
  doc.moveDown(0.3);
  if (medications.length === 0) {
    doc.fontSize(10).font("Helvetica").fillColor(MUTED_COLOR).text("No medications on record.");
  } else {
    doc.fontSize(10).font("Helvetica").fillColor(INK_COLOR);
    medications.forEach((m) => {
      const status = m.isActive ? "Active" : "Inactive";
      doc.text(`• ${m.name} — ${m.dosage}, ${m.frequency} (${status})`);
    });
  }
  doc.moveDown(1);

  // Appointments
  doc.fontSize(13).font("Helvetica-Bold").fillColor(INK_COLOR).text("Recent Appointments");
  doc.moveDown(0.3);
  if (appointments.length === 0) {
    doc.fontSize(10).font("Helvetica").fillColor(MUTED_COLOR).text("No appointments on record.");
  } else {
    doc.fontSize(10).font("Helvetica").fillColor(INK_COLOR);
    appointments.forEach((a) => {
      doc.text(
        `• ${new Date(a.requestedDate).toLocaleString()} with Dr. ${a.doctor?.name || "Unknown"} — ${a.status}`
      );
    });
  }

  doc.moveDown(2);
  doc.fontSize(8).fillColor(MUTED_COLOR).text("This report was generated by VitalIQ AI and is not a substitute for professional medical advice.", { align: "center" });

  doc.end();
});

module.exports = { downloadHealthReport };
