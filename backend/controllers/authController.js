const { Archer, Class, Division } = require("../models");
const { generateToken } = require("../middleware/auth");
const { calculateAge, determineClass } = require("../utils/helpers");

/**
 * Register new archer
 */
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      password,
      defaultDivisionId,
    } = req.body;

    // Check if email already exists
    const existingArcher = await Archer.findOne({ where: { Email: email } });
    if (existingArcher) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Determine class based on age and gender
    const age = calculateAge(dateOfBirth);
    const className = determineClass(age, gender);

    // Find class ID
    const classObj = await Class.findOne({ where: { Name: className } });

    // Create archer
    const archer = await Archer.create({
      FirstName: firstName,
      LastName: lastName,
      DateOfBirth: dateOfBirth,
      Gender: gender,
      Email: email,
      PasswordHash: password, // Will be hashed by model hook
      Role: "archer",
      DefaultDivisionID: defaultDivisionId || null,
      ClassID: classObj ? classObj.ClassID : null,
    });

    // Generate token
    const token = generateToken(archer.ArcherID);

    // Return user data without password
    const archerData = {
      archerId: archer.ArcherID,
      firstName: archer.FirstName,
      lastName: archer.LastName,
      email: archer.Email,
      role: archer.Role,
      dateOfBirth: archer.DateOfBirth,
      gender: archer.Gender,
      classId: archer.ClassID,
      defaultDivisionId: archer.DefaultDivisionID,
    };

    res.status(201).json({
      message: "Registration successful",
      token,
      user: archerData,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

/**
 * Login archer
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find archer by email
    const archer = await Archer.findOne({
      where: { Email: email },
      include: [
        { model: Class, as: "class", attributes: ["ClassID", "Name"] },
        {
          model: Division,
          as: "defaultDivision",
          attributes: ["DivisionID", "Name"],
        },
      ],
    });

    if (!archer) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isValidPassword = await archer.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(archer.ArcherID);

    // Return user data
    const archerData = {
      archerId: archer.ArcherID,
      firstName: archer.FirstName,
      lastName: archer.LastName,
      email: archer.Email,
      role: archer.Role,
      dateOfBirth: archer.DateOfBirth,
      gender: archer.Gender,
      class: archer.class,
      defaultDivision: archer.defaultDivision,
    };

    res.json({
      message: "Login successful",
      token,
      user: archerData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * Get current user info
 */
exports.getMe = async (req, res) => {
  try {
    const archer = await Archer.findByPk(req.userId, {
      attributes: { exclude: ["PasswordHash"] },
      include: [
        { model: Class, as: "class", attributes: ["ClassID", "Name"] },
        {
          model: Division,
          as: "defaultDivision",
          attributes: ["DivisionID", "Name"],
        },
      ],
    });

    if (!archer) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: archer });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

/**
 * Logout (client-side token removal)
 */
exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};
