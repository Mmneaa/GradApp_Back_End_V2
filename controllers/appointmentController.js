// controllers/appointmentController.js
const Appointment = require("../models/Appointment");

// Set schedule (Doctor only)
exports.setSchedule = async (req, res, next) => {
  try {
    const { schedule } = req.body;
    if (req.user.accountType !== "doctor") {
      return res.status(403).json({ message: "Permission denied" });
    }

    req.user.scheduleList = schedule;
    await req.user.save();
    res.json({ message: "Schedule set successfully" });
  } catch (error) {
    next(error);
  }
};

// Get schedule (Doctor only)
exports.getSchedule = async (req, res, next) => {
  try {
    if (req.user.accountType !== "doctor") {
      return res.status(403).json({ message: "Permission denied" });
    }

    const schedule = req.user.scheduleList;
    res.json(schedule);
  } catch (error) {
    next(error);
  }
};

// Make a reservation (User only)
exports.makeReservation = async (req, res, next) => {
  try {
    const { doctorId, dateTime } = req.body;
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      dateTime,
    });
    if (existingAppointment)
      return res.status(400).json({ message: "Time slot already booked." });

    const appointment = await Appointment.create({
      user: req.user._id,
      doctor: doctorId,
      dateTime,
    });

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

// Get reservations (User only)
exports.getReservations = async (req, res, next) => {
  try {
    const reservations = await Appointment.find({ user: req.user._id })
      .populate("doctor", "username")
      .sort({ dateTime: 1 });

    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

// Get reservations (Doctor only)
exports.getDoctorReservations = async (req, res, next) => {
  try {
    if (req.user.accountType !== "doctor") {
      return res.status(403).json({ message: "Permission denied" });
    }

    const reservations = await Appointment.find({ doctor: req.user._id })
      .populate("user", "username")
      .sort({ dateTime: 1 });

    res.json(reservations);
  } catch (error) {
    next(error);
  }
};
