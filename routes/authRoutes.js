const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { validateRegister, validateLogin } = require("../utils/validators");

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

// Routes for email verification, forgot password, etc.

module.exports = router;
