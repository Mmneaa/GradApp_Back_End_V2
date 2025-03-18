// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateToken } = require("../utils/generateToken"); // Correct import

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, phoneNumber } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already in use." });

    // Create user with email verification disabled
    const user = await User.create({
      username,
      email,
      password,
      phoneNumber,
      emailVerified: true, // Set to true by default
    });

    // Generate JWT token
    const token = generateToken(user._id, user.accountType);

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        accountType: user.accountType,
      },
    });
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

    // Generate JWT token
    const token = generateToken(user._id, user.accountType);

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

/*
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newAccessToken = generateAccessToken(user._id, user.accountType);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};
*/
