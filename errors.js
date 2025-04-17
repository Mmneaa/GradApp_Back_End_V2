// errors.js: Centralized error handling for unhandled exceptions, rejections, and other critical errors.

const fs = require("fs");
const path = require("path");

// Log errors to a file for debugging purposes
const logErrorToFile = (error) => {
  const logFilePath = path.join(__dirname, "error.log");
  const errorMessage = `${new Date().toISOString()} - ${
    error.stack || error
  }\n`;
  fs.appendFileSync(logFilePath, errorMessage, "utf8");
};

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  logErrorToFile(err);
  process.exit(1); // Exit the process to avoid undefined behavior
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  logErrorToFile(reason);
  process.exit(1); // Exit the process to avoid undefined behavior
});

// Catch SIGTERM and SIGINT signals for graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing application gracefully.");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing application gracefully.");
  process.exit(0);
});
