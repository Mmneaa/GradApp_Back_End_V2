// Token generator: Generates JWT tokens for user authentication.
const jwt = require("jsonwebtoken");

const generateToken = (userId, accountType) => {
  return jwt.sign({ id: userId, accountType }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
