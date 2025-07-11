const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect middleware: Verifies the JWT token, retrieves the user, and ensures the user is not banned.
exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token)
    return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (req.user.banned)
      return res.status(403).json({ message: "Account is banned." });

    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
