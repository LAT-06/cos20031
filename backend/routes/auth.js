const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const validate = require("../middleware/validation");

// Validation rules
const signupValidation = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("dateOfBirth").isDate().withMessage("Valid date of birth is required"),
  body("gender")
    .isIn(["Male", "Female"])
    .withMessage("Gender must be Male or Female"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  validate,
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

// Routes
router.post("/signup", signupValidation, authController.signup);
router.post("/login", loginValidation, authController.login);
router.get("/me", auth, authController.getMe);
router.post("/logout", auth, authController.logout);

module.exports = router;
