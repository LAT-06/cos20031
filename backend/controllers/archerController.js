const { Archer, Class, Division, ScoreRecord, Round } = require("../models");
const { Op } = require("sequelize");
const { calculateAge, determineClass } = require("../utils/helpers");

/**
 * Get all archers (admin/recorder only)
 */
exports.getAllArchers = async (req, res) => {
  try {
    const { search, role, classId, divisionId } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { FirstName: { [Op.like]: `%${search}%` } },
        { LastName: { [Op.like]: `%${search}%` } },
        { Email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role) {
      where.Role = role;
    }

    if (classId) {
      where.ClassID = classId;
    }

    if (divisionId) {
      where.DefaultDivisionID = divisionId;
    }

    const archers = await Archer.findAll({
      where,
      attributes: { exclude: ["PasswordHash"] },
      include: [
        { model: Class, as: "class", attributes: ["ClassID", "Name"] },
        {
          model: Division,
          as: "defaultDivision",
          attributes: ["DivisionID", "Name"],
        },
      ],
      order: [
        ["LastName", "ASC"],
        ["FirstName", "ASC"],
      ],
    });

    res.json({ archers });
  } catch (error) {
    console.error("Get archers error:", error);
    res.status(500).json({ error: "Failed to fetch archers" });
  }
};

/**
 * Get archer by ID
 */
exports.getArcherById = async (req, res) => {
  try {
    const { id } = req.params;

    const archer = await Archer.findByPk(id, {
      attributes: { exclude: ["PasswordHash"] },
      include: [
        { model: Class, as: "class" },
        { model: Division, as: "defaultDivision" },
      ],
    });

    if (!archer) {
      return res.status(404).json({ error: "Archer not found" });
    }

    res.json({ archer });
  } catch (error) {
    console.error("Get archer error:", error);
    res.status(500).json({ error: "Failed to fetch archer" });
  }
};

/**
 * Create archer (admin only)
 */
exports.createArcher = async (req, res) => {
  try {
    const {
      FirstName,
      LastName,
      DateOfBirth,
      Gender,
      Email,
      Password,
      Role,
      DivisionID,
      // Legacy support
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      password,
      role,
      defaultDivisionId,
    } = req.body;

    // Use PascalCase if available, fallback to camelCase
    const finalFirstName = FirstName || firstName;
    const finalLastName = LastName || lastName;
    const finalDateOfBirth = DateOfBirth || dateOfBirth;
    const finalGender = Gender || gender;
    const finalEmail = Email || email;
    const finalPassword = Password || password;
    const finalRole = Role || role || "archer";
    const finalDivisionID = DivisionID || defaultDivisionId || null;

    // Check if email already exists
    const existingArcher = await Archer.findOne({ where: { Email: finalEmail } });
    if (existingArcher) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Determine class
    const age = calculateAge(finalDateOfBirth);
    const className = determineClass(age, finalGender);
    const classObj = await Class.findOne({ where: { Name: className } });

    const archer = await Archer.create({
      FirstName: finalFirstName,
      LastName: finalLastName,
      DateOfBirth: finalDateOfBirth,
      Gender: finalGender,
      Email: finalEmail,
      PasswordHash: finalPassword,
      Role: finalRole,
      DefaultDivisionID: finalDivisionID,
      ClassID: classObj ? classObj.ClassID : null,
    });

    const result = await Archer.findByPk(archer.ArcherID, {
      attributes: { exclude: ["PasswordHash"] },
      include: [
        { model: Class, as: "class" },
        { model: Division, as: "defaultDivision" },
      ],
    });

    res.status(201).json({
      message: "Archer created successfully",
      archer: result,
    });
  } catch (error) {
    console.error("Create archer error:", error);
    res.status(500).json({ error: "Failed to create archer" });
  }
};

/**
 * Update archer
 */
exports.updateArcher = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      FirstName,
      LastName,
      Email,
      DateOfBirth,
      Gender,
      Role,
      DivisionID,
      Password,
    } = req.body;

    // Check if user is updating themselves or is admin/recorder
    const isAdmin = req.userRole === "admin";
    const isRecorder = req.userRole === "recorder";
    const isSelf = req.userId === parseInt(id);

    if (!isSelf && !isAdmin && !isRecorder) {
      return res.status(403).json({ error: "Access denied" });
    }

    const archer = await Archer.findByPk(id);
    if (!archer) {
      return res.status(404).json({ error: "Archer not found" });
    }

    // All users can update directly now
    const updateData = {};
    if (FirstName) updateData.FirstName = FirstName;
    if (LastName) updateData.LastName = LastName;
    if (Email) updateData.Email = Email;
    if (DateOfBirth) {
      updateData.DateOfBirth = DateOfBirth;
      // Recalculate class
      const age = calculateAge(DateOfBirth);
      const className = determineClass(age, Gender || archer.Gender);
      const classObj = await Class.findOne({ where: { Name: className } });
      if (classObj) updateData.ClassID = classObj.ClassID;
    }
    if (Gender) updateData.Gender = Gender;
    
    // Only admin can change roles
    if (Role && isAdmin) {
      updateData.Role = Role;
      // Clear DefaultDivisionID if changing to admin/recorder
      if (Role === 'admin' || Role === 'recorder') {
        updateData.DefaultDivisionID = null;
      }
    }
    
    // Set division only if role is archer
    if (DivisionID !== undefined) {
      const currentRole = updateData.Role || archer.Role;
      if (currentRole === 'archer') {
        updateData.DefaultDivisionID = DivisionID;
      } else {
        updateData.DefaultDivisionID = null;
      }
    }

    // Hash password if provided
    if (Password && Password.trim() !== "") {
      const bcrypt = require("bcrypt");
      updateData.PasswordHash = await bcrypt.hash(Password, 10);
    }

    updateData.UpdatedAt = new Date();

    await archer.update(updateData);

    const updated = await Archer.findByPk(id, {
      attributes: { exclude: ["PasswordHash"] },
      include: [
        { model: Class, as: "class" },
        { model: Division, as: "defaultDivision" },
      ],
    });

    res.json({
      message: "Profile updated successfully",
      archer: updated,
    });
  } catch (error) {
    console.error("Update archer error:", error);
    res.status(500).json({ error: "Failed to update archer" });
  }
};

/**
 * Delete archer (admin only)
 */
exports.deleteArcher = async (req, res) => {
  try {
    const { id } = req.params;

    const archer = await Archer.findByPk(id);
    if (!archer) {
      return res.status(404).json({ error: "Archer not found" });
    }

    await archer.destroy();

    res.json({ message: "Archer deleted successfully" });
  } catch (error) {
    console.error("Delete archer error:", error);
    res.status(500).json({ error: "Failed to delete archer" });
  }
};

/**
 * Get archer's score history
 */
exports.getArcherScores = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, startDate, endDate, roundId } = req.query;

    // Check access
    if (
      req.userId !== parseInt(id) &&
      !["admin", "recorder"].includes(req.userRole)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const where = { ArcherID: id };

    if (status) {
      where.Status = status;
    } else if (req.userRole === "archer") {
      // Archers can only see approved scores (and their own staged scores)
      where.Status = { [Op.in]: ["approved", "staged"] };
    }

    if (startDate) {
      where.DateShot = { [Op.gte]: startDate };
    }

    if (endDate) {
      where.DateShot = { ...where.DateShot, [Op.lte]: endDate };
    }

    if (roundId) {
      where.RoundID = roundId;
    }

    const scores = await ScoreRecord.findAll({
      where,
      include: [
        { model: Round, as: "round", attributes: ["RoundID", "Name"] },
        { model: Division, as: "division", attributes: ["DivisionID", "Name"] },
        {
          model: Archer,
          as: "approver",
          attributes: ["ArcherID", "FirstName", "LastName"],
        },
      ],
      order: [["DateShot", "DESC"]],
    });

    res.json({ scores });
  } catch (error) {
    console.error("Get archer scores error:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
};

/**
 * Get archer's personal bests
 */
exports.getPersonalBests = async (req, res) => {
  try {
    const { id } = req.params;

    // Check access
    if (
      req.userId !== parseInt(id) &&
      !["admin", "recorder"].includes(req.userRole)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { sequelize } = require("../models");

    // Get highest score per round
    const personalBests = await ScoreRecord.findAll({
      attributes: [
        "RoundID",
        [sequelize.fn("MAX", sequelize.col("TotalScore")), "BestScore"],
      ],
      where: {
        ArcherID: id,
        Status: "approved",
      },
      include: [{ model: Round, as: "round", attributes: ["RoundID", "Name"] }],
      group: ["RoundID", "round.RoundID", "round.Name"],
      raw: false,
    });

    res.json({ personalBests });
  } catch (error) {
    console.error("Get personal bests error:", error);
    res.status(500).json({ error: "Failed to fetch personal bests" });
  }
};
