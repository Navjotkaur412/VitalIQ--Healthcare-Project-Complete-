const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// Verifies the JWT sent in the Authorization header and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized: no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error("Not authorized: user no longer exists");
    }
    if (!user.isActive) {
      res.status(403);
      throw new Error("Account is deactivated. Contact an administrator.");
    }
    // Invalidate tokens issued before a password change
    if (user.passwordChangedAt && decoded.iat * 1000 < new Date(user.passwordChangedAt).getTime()) {
      res.status(401);
      throw new Error("Not authorized: token expired due to password change");
    }

    req.user = user;
    next();
  } catch (err) {
    if (res.statusCode && res.statusCode !== 200) {
      throw err;
    }
    res.status(401);
    throw new Error("Not authorized: invalid or expired token");
  }
});

module.exports = { protect };
