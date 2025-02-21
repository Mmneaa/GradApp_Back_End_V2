// controllers/authController.js
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, phoneNumber } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already in use." });

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString(); // Generate verification code

    const user = await User.create({
      username,
      email,
      password,
      phoneNumber,
      emailVerificationCode: verificationCode,
      emailVerified: false,
    });

    // Save verification code to user
    await user.save();

    // Send verification email
    await sendEmail(
      email,
      "Email Verification",
      `Your verification code is: ${verificationCode}`
    );

    res
      .status(201)
      .json({ message: "User registered. Verification email sent." });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials." });

    if (user.banned)
      return res.status(403).json({ message: "Account is banned." });

    res.json({
      token: generateToken(user._id, user.accountType),
      user: {
        id: user._id,
        username: user.username,
        accountType: user.accountType,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Additional methods for forgot password, reset password, etc.
