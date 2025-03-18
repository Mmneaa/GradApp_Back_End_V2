const express = require("express");
const router = express.Router();
const {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  // refreshToken,
} = require("../controllers/authController");
const {
  validateRegister,
  validateLogin,
  validateRequestPasswordReset,
  validateResetPassword,
} = require("../utils/validators");

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post(
  "/forgot-password",
  validateRequestPasswordReset,
  requestPasswordReset
);
router.post("/reset-password", validateResetPassword, resetPassword);
// router.post("/refresh-token", refreshToken); // Comment out this line

module.exports = router;
