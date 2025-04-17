// Load environment variables from .env file
require("dotenv").config();

// Integrate errors.js to handle unhandled exceptions and rejections
require("./errors");

// Import Express framework for building the server
const express = require("express");

// Import Mongoose for MongoDB connection
const mongoose = require("mongoose");

// Import CORS middleware to enable Cross-Origin Resource Sharing
const cors = require("cors");

// Import HTTP module to create the server
const http = require("http");

// Import Socket.IO for real-time communication
const socketIO = require("socket.io");

// Import route handlers for authentication
const authRoutes = require("./routes/authRoutes");

// Import route handlers for user-related operations
const userRoutes = require("./routes/userRoutes");

// Import route handlers for post-related operations
const postRoutes = require("./routes/postRoutes");

// Import route handlers for chat-related operations
const chatRoutes = require("./routes/chatRoutes");

// Import route handlers for appointment-related operations
const appointmentRoutes = require("./routes/appointmentRoutes");

// Import custom error handler middleware
const errorHandler = require("./middleware/errorHandler");

// Import database connection utility
const connectDB = require("./config/db");

// Initialize Express application
const app = express();

// Create HTTP server instance
const server = http.createServer(app);

// Initialize Socket.IO with the server
const io = socketIO(server);

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/users", userRoutes); // User routes
app.use("/api/posts", postRoutes); // Post routes
app.use("/api/chats", chatRoutes); // Chat routes
app.use("/api/appointments", appointmentRoutes); // Appointment routes

// Error Handler
app.use(errorHandler); // Custom error handler middleware

// Socket.io setup for real-time communication
io.on("connection", (socket) => {
  console.log("New client connected");
  // Socket events here
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000; // Define server port
connectDB(); // Establish MongoDB connection

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Trying another port...`);
    const newPort = PORT + 1;
    server.listen(newPort, () => {
      console.log(`Server running on port ${newPort}`);
    });
  } else {
    console.error(`Server error: ${err.message}`);
  }
});
