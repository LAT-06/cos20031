const {
  ScoreRecord,
  End,
  Arrow,
  Archer,
  Round,
  RoundRange,
  Division,
  Competition,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const {
  validateScoreStructure,
  calculateTotalScore,
} = require("../utils/helpers");

/**
 * Get all scores with filters
 */
exports.getAllScores = async (req, res) => {
  try {
    const {
      archerId,
      roundId,
      divisionId,
      competitionId,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    const where = {};

    // Archers can only see approved scores (except their own)
    if (req.userRole === "archer") {
      where[Op.or] = [
        { Status: "approved" },
        { ArcherID: req.userId, Status: { [Op.in]: ["staged", "approved"] } },
      ];
    }

    if (archerId) where.ArcherID = archerId;
    if (roundId) where.RoundID = roundId;
    if (divisionId) where.DivisionID = divisionId;
    if (competitionId) where.CompetitionID = competitionId;
    if (status) where.Status = status;
    if (startDate) where.DateShot = { [Op.gte]: startDate };
    if (endDate) where.DateShot = { ...where.DateShot, [Op.lte]: endDate };

    const scores = await ScoreRecord.findAll({
      where,
      include: [
        {
          model: Archer,
          as: "archer",
          attributes: ["ArcherID", "FirstName", "LastName"],
        },
        { model: Round, as: "round" },
        { model: Division, as: "division" },
        { model: Competition, as: "competition", required: false },
        {
          model: Archer,
          as: "approver",
          attributes: ["ArcherID", "FirstName", "LastName"],
        },
      ],
      order: [["DateShot", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({ scores, count: scores.length });
  } catch (error) {
    console.error("Get scores error:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
};

/**
 * Get score by ID with full details
 */
exports.getScoreById = async (req, res) => {
  try {
    const { id } = req.params;

    const score = await ScoreRecord.findByPk(id, {
      include: [
        {
          model: Archer,
          as: "archer",
          attributes: ["ArcherID", "FirstName", "LastName", "Email"],
        },
        { model: Round, as: "round" },
        { model: Division, as: "division" },
        { model: Competition, as: "competition", required: false },
        {
          model: Archer,
          as: "approver",
          attributes: ["ArcherID", "FirstName", "LastName"],
        },
        {
          model: End,
          as: "ends",
          include: [
            {
              model: Arrow,
              as: "arrows",
              order: [["ArrowOrder", "ASC"]],
            },
          ],
        },
      ],
      order: [[{ model: End, as: "ends" }, "EndNumber", "ASC"]],
    });

    if (!score) {
      return res.status(404).json({ error: "Score not found" });
    }

    // Check access for archers
    if (
      req.userRole === "archer" &&
      score.ArcherID !== req.userId &&
      score.Status !== "approved"
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ score });
  } catch (error) {
    console.error("Get score error:", error);
    res.status(500).json({ error: "Failed to fetch score" });
  }
};

/**
 * Create/stage new score
 */
exports.createScore = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { roundId, divisionId, competitionId, dateShot, ends, notes } =
      req.body;

    // Get round with ranges to validate
    const round = await Round.findByPk(roundId, {
      include: [{ model: RoundRange, as: "ranges" }],
    });

    if (!round) {
      await transaction.rollback();
      return res.status(404).json({ error: "Round not found" });
    }

    // Validate score structure
    const validation = validateScoreStructure({ ends }, round);
    if (!validation.valid) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Invalid score structure",
        details: validation.errors,
      });
    }

    // Calculate total score
    let totalScore = 0;
    ends.forEach((end) => {
      end.arrows.forEach((arrow) => {
        totalScore += arrow.score;
      });
    });

    // Create score record
    const scoreRecord = await ScoreRecord.create(
      {
        ArcherID: req.userId,
        RoundID: roundId,
        DivisionID: divisionId,
        CompetitionID: competitionId || null,
        DateShot: dateShot,
        Status: "staged",
        TotalScore: totalScore,
        Notes: notes || null,
      },
      { transaction }
    );

    // Create ends and arrows
    for (const endData of ends) {
      // Calculate end total
      const endTotal = endData.arrows.reduce(
        (sum, arrow) => sum + arrow.score,
        0
      );

      const end = await End.create(
        {
          ScoreRecordID: scoreRecord.ScoreRecordID,
          EndNumber: endData.endNumber,
          TotalScore: endTotal,
        },
        { transaction }
      );

      // Create arrows
      for (const arrowData of endData.arrows) {
        await Arrow.create(
          {
            EndID: end.EndID,
            Score: arrowData.score,
            ArrowOrder: arrowData.arrowOrder,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Fetch complete score record
    const result = await ScoreRecord.findByPk(scoreRecord.ScoreRecordID, {
      include: [
        { model: Round, as: "round" },
        { model: Division, as: "division" },
        {
          model: End,
          as: "ends",
          include: [{ model: Arrow, as: "arrows" }],
        },
      ],
    });

    res.status(201).json({
      message: "Score staged successfully",
      score: result,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Create score error:", error);
    res.status(500).json({ error: "Failed to create score" });
  }
};

/**
 * Update staged score
 */
exports.updateScore = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { dateShot, ends, notes } = req.body;

    const scoreRecord = await ScoreRecord.findByPk(id);

    if (!scoreRecord) {
      await transaction.rollback();
      return res.status(404).json({ error: "Score not found" });
    }

    // Only owner can update staged scores
    if (scoreRecord.ArcherID !== req.userId) {
      await transaction.rollback();
      return res.status(403).json({ error: "Access denied" });
    }

    // Only staged scores can be updated
    if (scoreRecord.Status !== "staged") {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "Only staged scores can be updated" });
    }

    // Get round for validation
    const round = await Round.findByPk(scoreRecord.RoundID, {
      include: [{ model: RoundRange, as: "ranges" }],
    });

    // Validate if ends provided
    if (ends) {
      const validation = validateScoreStructure({ ends }, round);
      if (!validation.valid) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Invalid score structure",
          details: validation.errors,
        });
      }

      // Delete existing ends and arrows
      await End.destroy({
        where: { ScoreRecordID: id },
        transaction,
      });

      // Recalculate total and create new ends
      let totalScore = 0;
      for (const endData of ends) {
        const endTotal = endData.arrows.reduce(
          (sum, arrow) => sum + arrow.score,
          0
        );
        totalScore += endTotal;

        const end = await End.create(
          {
            ScoreRecordID: id,
            EndNumber: endData.endNumber,
            TotalScore: endTotal,
          },
          { transaction }
        );

        for (const arrowData of endData.arrows) {
          await Arrow.create(
            {
              EndID: end.EndID,
              Score: arrowData.score,
              ArrowOrder: arrowData.arrowOrder,
            },
            { transaction }
          );
        }
      }

      scoreRecord.TotalScore = totalScore;
    }

    if (dateShot) scoreRecord.DateShot = dateShot;
    if (notes !== undefined) scoreRecord.Notes = notes;
    scoreRecord.UpdatedAt = new Date();

    await scoreRecord.save({ transaction });
    await transaction.commit();

    // Fetch updated score
    const result = await ScoreRecord.findByPk(id, {
      include: [
        { model: Round, as: "round" },
        { model: Division, as: "division" },
        {
          model: End,
          as: "ends",
          include: [{ model: Arrow, as: "arrows" }],
        },
      ],
    });

    res.json({
      message: "Score updated successfully",
      score: result,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Update score error:", error);
    res.status(500).json({ error: "Failed to update score" });
  }
};

/**
 * Approve score (recorder/admin)
 */
exports.approveScore = async (req, res) => {
  try {
    const { id } = req.params;

    const scoreRecord = await ScoreRecord.findByPk(id);

    if (!scoreRecord) {
      return res.status(404).json({ error: "Score not found" });
    }

    // Can approve from staged or pending status
    if (!["staged", "pending"].includes(scoreRecord.Status)) {
      return res.status(400).json({ error: "Score cannot be approved from current status" });
    }

    scoreRecord.Status = "approved";
    scoreRecord.ApprovedBy = req.userId;
    scoreRecord.ApprovedAt = new Date();
    scoreRecord.UpdatedAt = new Date();

    await scoreRecord.save();

    res.json({
      message: "Score approved successfully",
      score: scoreRecord,
    });
  } catch (error) {
    console.error("Approve score error:", error);
    res.status(500).json({ error: "Failed to approve score" });
  }
};

/**
 * Reject score (recorder/admin)
 */
exports.rejectScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const scoreRecord = await ScoreRecord.findByPk(id);

    if (!scoreRecord) {
      return res.status(404).json({ error: "Score not found" });
    }

    // Can reject from staged or pending status
    if (!["staged", "pending"].includes(scoreRecord.Status)) {
      return res.status(400).json({ error: "Score cannot be rejected from current status" });
    }

    scoreRecord.Status = "rejected";
    scoreRecord.Notes = reason
      ? `${scoreRecord.Notes || ""}\nRejection reason: ${reason}`
      : scoreRecord.Notes;
    scoreRecord.UpdatedAt = new Date();

    await scoreRecord.save();

    res.json({
      message: "Score rejected",
      score: scoreRecord,
    });
  } catch (error) {
    console.error("Reject score error:", error);
    res.status(500).json({ error: "Failed to reject score" });
  }
};

/**
 * Update score status (recorder/admin)
 */
exports.updateScoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // Validate status
    const validStatuses = ["staged", "pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const scoreRecord = await ScoreRecord.findByPk(id);

    if (!scoreRecord) {
      return res.status(404).json({ error: "Score not found" });
    }

    // Update status
    scoreRecord.Status = status;

    // If approving, set approved by and date
    if (status === "approved") {
      scoreRecord.ApprovedBy = req.userId;
      scoreRecord.ApprovedAt = new Date();
    } else if (status === "pending" || status === "staged") {
      // Reset approval fields if changing back to pending or staged
      scoreRecord.ApprovedBy = null;
      scoreRecord.ApprovedAt = null;
    }

    // If rejecting, add reason to notes
    if (status === "rejected" && reason) {
      scoreRecord.Notes = reason
        ? `${scoreRecord.Notes || ""}\nRejection reason: ${reason}`
        : scoreRecord.Notes;
    }

    scoreRecord.UpdatedAt = new Date();

    await scoreRecord.save();

    res.json({
      message: "Score status updated successfully",
      score: scoreRecord,
    });
  } catch (error) {
    console.error("Update score status error:", error);
    res.status(500).json({ error: "Failed to update score status" });
  }
};

/**
 * Delete score (admin)
 */
exports.deleteScore = async (req, res) => {
  try {
    const { id } = req.params;

    const scoreRecord = await ScoreRecord.findByPk(id);

    if (!scoreRecord) {
      return res.status(404).json({ error: "Score not found" });
    }

    await scoreRecord.destroy();

    res.json({ message: "Score deleted successfully" });
  } catch (error) {
    console.error("Delete score error:", error);
    res.status(500).json({ error: "Failed to delete score" });
  }
};

/**
 * Get staged scores (recorder/admin)
 */
exports.getStagedScores = async (req, res) => {
  try {
    const scores = await ScoreRecord.findAll({
      where: { Status: "staged" },
      include: [
        {
          model: Archer,
          as: "archer",
          attributes: ["ArcherID", "FirstName", "LastName", "Email"],
        },
        { model: Round, as: "round" },
        { model: Division, as: "division" },
        { model: Competition, as: "competition", required: false },
      ],
      order: [["CreatedAt", "ASC"]],
    });

    res.json({ scores });
  } catch (error) {
    console.error("Get staged scores error:", error);
    res.status(500).json({ error: "Failed to fetch staged scores" });
  }
};

/**
 * Get club records
 */
exports.getClubRecords = async (req, res) => {
  try {
    const { divisionId, classId } = req.query;

    // Build where clause
    const where = { Status: "approved" };
    if (divisionId) where.DivisionID = divisionId;

    // Get highest score per round
    const records = await ScoreRecord.findAll({
      attributes: [
        "RoundID",
        "DivisionID",
        [sequelize.fn("MAX", sequelize.col("TotalScore")), "RecordScore"],
      ],
      where,
      include: [
        { model: Round, as: "round", attributes: [] },
        { model: Division, as: "division", attributes: [] },
      ],
      group: ["RoundID", "DivisionID"],
      raw: true,
    });

    // Get full details for each record
    const detailedRecords = await Promise.all(
      records.map(async (record) => {
        const scoreRecord = await ScoreRecord.findOne({
          where: {
            RoundID: record.RoundID,
            DivisionID: record.DivisionID,
            TotalScore: record.RecordScore,
            Status: "approved",
          },
          include: [
            {
              model: Archer,
              as: "archer",
              attributes: ["ArcherID", "FirstName", "LastName"],
            },
            { model: Round, as: "round" },
            { model: Division, as: "division" },
          ],
          order: [["DateShot", "ASC"]],
        });

        return scoreRecord;
      })
    );

    res.json({ records: detailedRecords.filter((r) => r !== null) });
  } catch (error) {
    console.error("Get club records error:", error);
    res.status(500).json({ error: "Failed to fetch club records" });
  }
};
