const jwt = require("jsonwebtoken");

const generateAuthToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const generateResetToken = (userId) => {
  return jwt.sign({ id: userId, purpose: "password_reset" }, process.env.JWT_RESET_SECRET, {
    expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m",
  });
};

module.exports = { generateAuthToken, generateResetToken };
