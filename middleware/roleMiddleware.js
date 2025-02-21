// middleware/roleMiddleware.js
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.accountType)) {
      return res.status(403).json({ message: "Forbidden: Access is denied" });
    }
    next();
  };
};
