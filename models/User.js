// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, default: null },
    password: { type: String, required: true },
    accountType: {
      type: String,
      enum: ["admin", "moderator", "doctor", "user", "guest"],
      default: "user",
    },
    emailVerificationCode: { type: String },
    emailVerified: { type: Boolean, default: false },
    favouriteList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    staticFavouriteList: [
      {
        userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        postID: { type: String },
      },
    ],
    friendsList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    groupsList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    doctorsList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reservationList: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    ],
    scheduleList: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    ],
    preferredLanguage: { type: String, enum: ["EN", "AR"], default: "EN" },
    banned: { type: Boolean, default: false },
    bannedList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    roleChangedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    roleChangedAt: {
      type: Date,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
  },
  { timestamps: true }
);

// Hashing password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!enteredPassword) {
    throw new Error("Password is required for comparison");
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
