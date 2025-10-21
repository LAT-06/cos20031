const jwt = require("jsonwebtoken");
const { Archer } = require("../models");

/**
 * Middleware to verify JWT token and authenticate user
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "No authentication token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const archer = await Archer.findByPk(decoded.id, {
      attributes: { exclude: ["PasswordHash"] },
    });

    if (!archer) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    // Attach user to request
    req.user = archer;
    req.userId = archer.ArcherID;
    req.userRole = archer.Role;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid authentication token" });
    }
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Authentication token has expired" });
    }
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Generate JWT token for user
 */
const generateToken = (archerId) => {
  return jwt.sign({ id: archerId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "24h",
  });
};

module.exports = { auth, generateToken };
