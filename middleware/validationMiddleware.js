// middleware/validationMiddleware.js
// Validation middleware: Validates request bodies against a provided schema.
module.exports = function (schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      res.status(400).json({ message: errorMessage });
    } else {
      next();
    }
  };
};
