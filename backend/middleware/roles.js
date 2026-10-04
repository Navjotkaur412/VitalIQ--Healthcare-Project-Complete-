// Usage: authorize("doctor", "admin")
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized: no authenticated user");
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Access denied: requires role [${allowedRoles.join(", ")}]`);
    }
    next();
  };
};

module.exports = { authorize };
