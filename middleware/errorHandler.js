// middleware/errorHandler.js
// Error handler middleware: Handles errors and sends appropriate responses.
module.exports = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
  });
};
