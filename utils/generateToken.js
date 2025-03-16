const jwt = require("jsonwebtoken");

const generateAccessToken = (id, accountType) => {
  return jwt.sign({ id, accountType }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
