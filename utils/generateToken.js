// utils/generateToken.js
const jwt = require("jsonwebtoken");

const generateToken = (id, accountType) => {
  return jwt.sign({ id, accountType }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

module.exports = generateToken;
