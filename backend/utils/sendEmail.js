const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

// Sends a real email when SMTP_* env vars are configured; otherwise logs to
// the console so local dev and demos work without any mail setup.
const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();

  if (!t) {
    console.log("\n===== EMAIL (SMTP not configured, dev fallback) =====");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log("=======================================================\n");
    return true;
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || `"VitalIQ AI" <no-reply@vitaliq.local>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("Email send failed:", err.message);
    return false;
  }
};

module.exports = sendEmail;
