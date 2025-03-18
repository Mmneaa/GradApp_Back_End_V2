const jwt = require("jsonwebtoken");

const generateToken = (id, accountType) => {
  return jwt.sign({ id, accountType }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });
};

// const generateRefreshToken = (id) => {
//   return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
//     expiresIn: "7d",
//   });
// };

module.exports = { generateToken };

// module.exports = { generateAccessToken, generateRefreshToken };
