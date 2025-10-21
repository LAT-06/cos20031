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
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      password,
      role,
      defaultDivisionId,
    } = req.body;

    // Check if email already exists
    const existingArcher = await Archer.findOne({ where: { Email: email } });
    if (existingArcher) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Determine class
    const age = calculateAge(dateOfBirth);
    const className = determineClass(age, gender);
    const classObj = await Class.findOne({ where: { Name: className } });

    const archer = await Archer.create({
      FirstName: firstName,
      LastName: lastName,
      DateOfBirth: dateOfBirth,
      Gender: gender,
      Email: email,
      PasswordHash: password,
      Role: role || "archer",
      DefaultDivisionID: defaultDivisionId || null,
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

    // If archer is updating themselves, create a pending request
    if (isSelf && !isAdmin && !isRecorder) {
      const { ArcherUpdateRequest } = require("../models");

      // Hash password if provided
      let passwordHash = null;
      if (Password && Password.trim() !== "") {
        const bcrypt = require("bcrypt");
        passwordHash = await bcrypt.hash(Password, 10);
      }

      const request = await ArcherUpdateRequest.create({
        ArcherID: id,
        FirstName: FirstName || null,
        LastName: LastName || null,
        Email: Email || null,
        DateOfBirth: DateOfBirth || null,
        Gender: Gender || null,
        DivisionID: DivisionID || null,
        PasswordHash: passwordHash,
        Status: "pending",
        CreatedAt: new Date(),
      });

      return res.json({
        message:
          "Profile update request submitted. Waiting for recorder approval.",
        requestId: request.RequestID,
        status: "pending",
      });
    }

    // Admin/Recorder can update directly
    const updateData = {};
    if (FirstName) updateData.FirstName = FirstName;
    if (LastName) updateData.LastName = LastName;
    if (Email) updateData.Email = Email;
    if (DateOfBirth) {
      updateData.DateOfBirth = DateOfBirth;
      // Recalculate class
      const age = calculateAge(DateOfBirth);
      const className = determineClass(age, Gender || archer.Gender);
      const classObj = await Class.findOne({ where: { ClassName: className } });
      if (classObj) updateData.ClassID = classObj.ClassID;
    }
    if (Gender) updateData.Gender = Gender;
    if (DivisionID !== undefined) updateData.DefaultDivisionID = DivisionID;

    // Hash password if provided
    if (Password && Password.trim() !== "") {
      const bcrypt = require("bcrypt");
      updateData.PasswordHash = await bcrypt.hash(Password, 10);
    }

    // Only admin can change roles
    if (Role && isAdmin) {
      updateData.Role = Role;
    }

    updateData.UpdatedAt = new Date();

    await archer.update(updateData);

    const updated = await Archer.findByPk(id, {
      attributes: { exclude: ["PasswordHash"] },
      include: [
        { model: Class, as: "Class" },
        { model: Division, as: "Division" },
      ],
    });

    res.json({
      message: "Archer updated successfully",
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

/**
 * Check if archer has pending changes
 */
exports.getPendingChanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { ArcherUpdateRequest } = require("../models");

    const pendingRequest = await ArcherUpdateRequest.findOne({
      where: {
        ArcherID: id,
        Status: "pending",
      },
    });

    res.json({ hasPending: !!pendingRequest });
  } catch (error) {
    console.error("Get pending changes error:", error);
    res.status(500).json({ error: "Failed to check pending changes" });
  }
};

/**
 * Get all pending update requests (admin/recorder only)
 */
exports.getAllUpdateRequests = async (req, res) => {
  try {
    const { ArcherUpdateRequest } = require("../models");

    const requests = await ArcherUpdateRequest.findAll({
      where: { Status: "pending" },
      include: [
        {
          model: Archer,
          as: "Archer",
          attributes: ["ArcherID", "FirstName", "LastName", "Email"],
          include: [
            { model: Class, as: "class" },
            { model: Division, as: "defaultDivision" },
          ],
        },
      ],
      order: [["CreatedAt", "DESC"]],
    });

    res.json({ requests });
  } catch (error) {
    console.error("Get update requests error:", error);
    res.status(500).json({ error: "Failed to fetch update requests" });
  }
};

/**
 * Approve update request
 */
exports.approveUpdateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { ArcherUpdateRequest } = require("../models");

    const request = await ArcherUpdateRequest.findByPk(requestId, {
      include: [{ model: Archer, as: "Archer" }],
    });

    if (!request) {
      return res.status(404).json({ error: "Update request not found" });
    }

    if (request.Status !== "pending") {
      return res.status(400).json({ error: "Request already processed" });
    }

    const archer = request.Archer;

    // Apply updates
    const updateData = {};
    if (request.FirstName) updateData.FirstName = request.FirstName;
    if (request.LastName) updateData.LastName = request.LastName;
    if (request.Email) updateData.Email = request.Email;
    if (request.DateOfBirth) {
      updateData.DateOfBirth = request.DateOfBirth;
      // Recalculate class
      const age = calculateAge(request.DateOfBirth);
      const className = determineClass(age, request.Gender || archer.Gender);
      const classObj = await Class.findOne({ where: { ClassName: className } });
      if (classObj) updateData.ClassID = classObj.ClassID;
    }
    if (request.Gender) updateData.Gender = request.Gender;
    if (request.DivisionID) updateData.DefaultDivisionID = request.DivisionID;
    if (request.PasswordHash) updateData.PasswordHash = request.PasswordHash;

    updateData.UpdatedAt = new Date();

    await archer.update(updateData);

    // Mark request as approved
    await request.update({
      Status: "approved",
      ReviewedBy: req.userId,
      ReviewedAt: new Date(),
    });

    res.json({
      message: "Update request approved successfully",
      archer,
    });
  } catch (error) {
    console.error("Approve update request error:", error);
    res.status(500).json({ error: "Failed to approve update request" });
  }
};

/**
 * Reject update request
 */
exports.rejectUpdateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const { ArcherUpdateRequest } = require("../models");

    const request = await ArcherUpdateRequest.findByPk(requestId);

    if (!request) {
      return res.status(404).json({ error: "Update request not found" });
    }

    if (request.Status !== "pending") {
      return res.status(400).json({ error: "Request already processed" });
    }

    await request.update({
      Status: "rejected",
      ReviewedBy: req.userId,
      ReviewedAt: new Date(),
      RejectionReason: reason || "No reason provided",
    });

    res.json({
      message: "Update request rejected",
    });
  } catch (error) {
    console.error("Reject update request error:", error);
    res.status(500).json({ error: "Failed to reject update request" });
  }
};
