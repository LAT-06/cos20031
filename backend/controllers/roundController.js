const {
  Round,
  RoundRange,
  EquivalentRound,
  Category,
  Class,
  Division,
} = require("../models");
const { Op } = require("sequelize");
const { isDateInRange } = require("../utils/helpers");

/**
 * Get all rounds
 */
exports.getAllRounds = async (req, res) => {
  try {
    const { search } = req.query;

    const where = {};
    if (search) {
      where.Name = { [Op.like]: `%${search}%` };
    }

    const rounds = await Round.findAll({
      where,
      include: [
        {
          model: RoundRange,
          as: "ranges",
          attributes: [
            "RoundRangeID",
            "RangeNo",
            "Distance",
            "Ends",
            "TargetFace",
          ],
        },
      ],
      order: [
        ["Name", "ASC"],
        [{ model: RoundRange, as: "ranges" }, "RangeNo", "ASC"],
      ],
    });

    res.json({ rounds });
  } catch (error) {
    console.error("Get rounds error:", error);
    res.status(500).json({ error: "Failed to fetch rounds" });
  }
};

/**
 * Get round by ID with details
 */
exports.getRoundById = async (req, res) => {
  try {
    const { id } = req.params;

    const round = await Round.findByPk(id, {
      include: [
        {
          model: RoundRange,
          as: "ranges",
          order: [["RangeNo", "ASC"]],
        },
      ],
    });

    if (!round) {
      return res.status(404).json({ error: "Round not found" });
    }

    res.json({ round });
  } catch (error) {
    console.error("Get round error:", error);
    res.status(500).json({ error: "Failed to fetch round" });
  }
};

/**
 * Create round (admin/recorder)
 */
exports.createRound = async (req, res) => {
  try {
    const { name, description, ranges } = req.body;

    // Check if round name already exists
    const existing = await Round.findOne({ where: { Name: name } });
    if (existing) {
      return res.status(400).json({ error: "Round name already exists" });
    }

    // Create round
    const round = await Round.create({
      Name: name,
      Description: description,
    });

    // Create ranges if provided
    if (ranges && Array.isArray(ranges)) {
      for (const range of ranges) {
        await RoundRange.create({
          RoundID: round.RoundID,
          RangeNo: range.rangeNo,
          Distance: range.distance,
          Ends: range.ends,
          TargetFace: range.targetFace,
        });
      }
    }

    // Fetch created round with ranges
    const result = await Round.findByPk(round.RoundID, {
      include: [
        {
          model: RoundRange,
          as: "ranges",
          order: [["RangeNo", "ASC"]],
        },
      ],
    });

    res.status(201).json({
      message: "Round created successfully",
      round: result,
    });
  } catch (error) {
    console.error("Create round error:", error);
    res.status(500).json({ error: "Failed to create round" });
  }
};

/**
 * Update round (admin/recorder)
 */
exports.updateRound = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, ranges } = req.body;

    const round = await Round.findByPk(id);
    if (!round) {
      return res.status(404).json({ error: "Round not found" });
    }

    // Update basic info
    if (name) round.Name = name;
    if (description !== undefined) round.Description = description;
    await round.save();

    // Update ranges if provided
    if (ranges && Array.isArray(ranges)) {
      // Delete existing ranges
      await RoundRange.destroy({ where: { RoundID: id } });

      // Create new ranges
      for (const range of ranges) {
        await RoundRange.create({
          RoundID: id,
          RangeNo: range.rangeNo,
          Distance: range.distance,
          Ends: range.ends,
          TargetFace: range.targetFace,
        });
      }
    }

    // Fetch updated round
    const result = await Round.findByPk(id, {
      include: [
        {
          model: RoundRange,
          as: "ranges",
          order: [["RangeNo", "ASC"]],
        },
      ],
    });

    res.json({
      message: "Round updated successfully",
      round: result,
    });
  } catch (error) {
    console.error("Update round error:", error);
    res.status(500).json({ error: "Failed to update round" });
  }
};

/**
 * Delete round (admin)
 */
exports.deleteRound = async (req, res) => {
  try {
    const { id } = req.params;

    const round = await Round.findByPk(id);
    if (!round) {
      return res.status(404).json({ error: "Round not found" });
    }

    await round.destroy();

    res.json({ message: "Round deleted successfully" });
  } catch (error) {
    console.error("Delete round error:", error);
    res.status(500).json({ error: "Failed to delete round" });
  }
};

/**
 * Get equivalent rounds for a category and date
 */
exports.getEquivalentRounds = async (req, res) => {
  try {
    const { id } = req.params; // Base round ID
    const { categoryId, date } = req.query;

    if (!categoryId || !date) {
      return res
        .status(400)
        .json({ error: "Category ID and date are required" });
    }

    const equivalents = await EquivalentRound.findAll({
      where: {
        BaseRoundID: id,
        CategoryID: categoryId,
      },
      include: [
        {
          model: Round,
          as: "equivalentRound",
          include: [{ model: RoundRange, as: "ranges" }],
        },
        {
          model: Category,
          as: "category",
          include: [
            { model: Class, as: "class" },
            { model: Division, as: "division" },
          ],
        },
      ],
    });

    // Filter by date range
    const validEquivalents = equivalents.filter((eq) =>
      isDateInRange(date, eq.StartDate, eq.EndDate)
    );

    res.json({ equivalents: validEquivalents });
  } catch (error) {
    console.error("Get equivalent rounds error:", error);
    res.status(500).json({ error: "Failed to fetch equivalent rounds" });
  }
};

/**
 * Create equivalent round rule (admin)
 */
exports.createEquivalentRound = async (req, res) => {
  try {
    const { baseRoundId, equivalentRoundId, categoryId, startDate, endDate } =
      req.body;

    if (baseRoundId === equivalentRoundId) {
      return res
        .status(400)
        .json({ error: "Base and equivalent rounds cannot be the same" });
    }

    const equivalent = await EquivalentRound.create({
      BaseRoundID: baseRoundId,
      EquivalentRoundID: equivalentRoundId,
      CategoryID: categoryId,
      StartDate: startDate,
      EndDate: endDate || null,
    });

    const result = await EquivalentRound.findByPk(equivalent.EquivalentID, {
      include: [
        { model: Round, as: "baseRound" },
        { model: Round, as: "equivalentRound" },
        { model: Category, as: "category" },
      ],
    });

    res.status(201).json({
      message: "Equivalent round created successfully",
      equivalent: result,
    });
  } catch (error) {
    console.error("Create equivalent round error:", error);
    res.status(500).json({ error: "Failed to create equivalent round" });
  }
};
