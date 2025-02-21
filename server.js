require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const http = require("http").Server(app);
const socketIO = require("socket.io")(http);
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const chatRoutes = require("./routes/chatRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const errorHandler = require("./middleware/errorHandler");
const connectDB = require("./config/db"); // Ensure this line is correct

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/appointments", appointmentRoutes);

// Error Handler
app.use(errorHandler);

// Socket.io setup for real-time communication
socketIO.on("connection", (socket) => {
  console.log("New client connected");
  // Socket events here
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
connectDB();

const server = http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Trying another port...`);
    const newPort = PORT + 1;
    http.listen(newPort, () => {
      console.log(`Server running on port ${newPort}`);
    });
  } else {
    console.error(`Server error: ${err.message}`);
  }
});
