// controllers/appointmentController.js
const Appointment = require("../models/Appointment");
const mongoose = require("mongoose");

// Set schedule: Allows a doctor to set their schedule.
exports.setSchedule = async (req, res, next) => {
  try {
    const { schedule } = req.body;
    if (req.user.accountType !== "doctor") {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Validate schedule as an array of ISO date strings
    if (!Array.isArray(schedule)) {
      return res.status(400).json({ message: "Schedule must be an array." });
    }

    const isValidDate = (date) => !isNaN(Date.parse(date));
    const validatedSchedule = schedule.map((item) => {
      if (!isValidDate(item)) {
        throw new Error(`Invalid date format: ${item}`);
      }
      return item;
    });

    req.user.scheduleList = validatedSchedule;
    await req.user.save();
    res.json({ message: "Schedule set successfully" });
  } catch (error) {
    if (error.message.startsWith("Invalid date format")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// Get schedule: Allows a doctor to retrieve their schedule.
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

// Make a reservation: Allows a user to book an appointment with a doctor.
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

// Get reservations: Retrieves all reservations made by the authenticated user.
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

// Get doctor reservations: Retrieves all reservations for the authenticated doctor.
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
