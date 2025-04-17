// models/Appointment.js
// Appointment model: Defines the schema for appointments, including user, doctor, and date/time.
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateTime: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
