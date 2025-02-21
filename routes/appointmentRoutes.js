// routes/appointmentRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  setSchedule,
  getSchedule,
  makeReservation,
  getReservations,
  getDoctorReservations,
} = require("../controllers/appointmentController");

// Doctor sets schedule
router.post("/schedule", protect, authorize("doctor"), setSchedule);

// Get doctor's schedule
router.get("/schedule", protect, authorize("doctor"), getSchedule);

// User makes a reservation
router.post("/reserve", protect, authorize("user"), makeReservation);

// User gets reservations
router.get("/reservations", protect, authorize("user"), getReservations);

// Doctor gets reservations
router.get(
  "/doctor-reservations",
  protect,
  authorize("doctor"),
  getDoctorReservations
);

module.exports = router;
