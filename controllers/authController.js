// controllers/authController.js
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");

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
    try {
      await sendEmail({
        email,
        subject: "Email Verification",
        message: `Your verification code is: ${verificationCode}`,
      });
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      return res
        .status(500)
        .json({ message: "Error sending verification email" });
    }

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

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    // Generate a 6-digit numerical code
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // Token valid for 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Prepare the email message
    const message = `Your Account's recovery code is ${resetToken}`;

    // Send the recovery code via email
    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Code",
        message,
      });
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      return res
        .status(500)
        .json({ message: "Error sending password reset email" });
    }

    res.json({ message: "Password reset code sent to your email" });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Find the user by reset token and ensure it's not expired
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    // Update the user's password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
