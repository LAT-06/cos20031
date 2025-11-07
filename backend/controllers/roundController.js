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
            "ScoringType",
            "ArrowsPerEnd",
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
    console.log('RAW REQUEST BODY:', JSON.stringify(req.body, null, 2));
    console.log('Type of ranges:', typeof req.body.ranges);
    console.log('Is ranges array?', Array.isArray(req.body.ranges));
    
    const { name, description, ranges } = req.body;

    console.log('Creating round with data:', {
      name,
      description,
      ranges: ranges,
      rangesType: typeof ranges,
      rangesIsArray: Array.isArray(ranges)
    });

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Round name is required" });
    }

    // Check if round name already exists
    const existing = await Round.findOne({ where: { Name: name } });
    if (existing) {
      return res.status(400).json({ error: "Round name already exists" });
    }

    // Create round
    const round = await Round.create({
      Name: name,
      Description: description || null,
    });

    console.log('Round created with ID:', round.RoundID);

    // Create ranges if provided
    if (ranges && Array.isArray(ranges)) {
      console.log('Creating', ranges.length, 'ranges...');
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        console.log(`Creating range ${i + 1}:`, range);
        
        // Map frontend fields to backend fields
        const rangeNo = range.rangeNo || (i + 1);
        const distance = range.distance;
        const ends = range.numEnds || range.ends;
        const targetFace = range.targetSize ? `${range.targetSize}cm` : (range.targetFace || '122cm');
        const scoringType = range.scoringType || '10-zone';
        const arrowsPerEnd = range.arrowsPerEnd || 6;
        
        // Validate range data
        if (!distance || !ends) {
          console.error('Invalid range data:', range);
          return res.status(400).json({ 
            error: `Range ${i + 1}: distance and ends/numEnds are required` 
          });
        }
        
        await RoundRange.create({
          RoundID: round.RoundID,
          RangeNo: rangeNo,
          Distance: distance,
          Ends: ends,
          TargetFace: targetFace,
          ScoringType: scoringType,
          ArrowsPerEnd: arrowsPerEnd,
        });
      }
      console.log('All ranges created successfully');
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

    console.log('Round creation complete:', result.RoundID);

    res.status(201).json({
      message: "Round created successfully",
      round: result,
    });
  } catch (error) {
    console.error("Create round error:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Failed to create round",
      details: error.message 
    });
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

      // Create new ranges with field mapping
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        
        // Map frontend fields to backend fields
        const rangeNo = range.rangeNo || (i + 1);
        const distance = range.distance;
        const ends = range.numEnds || range.ends;
        const targetFace = range.targetSize ? `${range.targetSize}cm` : (range.targetFace || '122cm');
        const scoringType = range.scoringType || '10-zone';
        const arrowsPerEnd = range.arrowsPerEnd || 6;
        
        await RoundRange.create({
          RoundID: id,
          RangeNo: rangeNo,
          Distance: distance,
          Ends: ends,
          TargetFace: targetFace,
          ScoringType: scoringType,
          ArrowsPerEnd: arrowsPerEnd,
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
 * List equivalent round rules (admin, optional filters)
 */
exports.listEquivalentRounds = async (req, res) => {
  try {
    const { categoryId, baseRoundId } = req.query;
    const where = {};
    if (categoryId) where.CategoryID = categoryId;
    if (baseRoundId) where.BaseRoundID = baseRoundId;
    const equivalents = await EquivalentRound.findAll({
      where,
      include: [
        { model: Round, as: "baseRound" },
        { model: Round, as: "equivalentRound" },
        { model: Category, as: "category", include: [{ model: Class, as: "class" }, { model: Division, as: "division" }] },
      ],
      order: [["StartDate", "DESC"]],
    });
    res.json({ equivalents });
  } catch (error) {
    console.error("List equivalent rounds error:", error);
    res.status(500).json({ error: "Failed to list equivalent rounds" });
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

/**
 * Update equivalent round rule (admin)
 */
exports.updateEquivalentRound = async (req, res) => {
  try {
    const { id } = req.params;
    const { baseRoundId, equivalentRoundId, categoryId, startDate, endDate } =
      req.body;

    const equivalent = await EquivalentRound.findByPk(id);
    if (!equivalent) {
      return res.status(404).json({ error: "Equivalent round rule not found" });
    }

    if (baseRoundId === equivalentRoundId) {
      return res
        .status(400)
        .json({ error: "Base and equivalent rounds cannot be the same" });
    }

    await equivalent.update({
      BaseRoundID: baseRoundId,
      EquivalentRoundID: equivalentRoundId,
      CategoryID: categoryId,
      StartDate: startDate,
      EndDate: endDate || null,
    });

    const result = await EquivalentRound.findByPk(id, {
      include: [
        { model: Round, as: "baseRound" },
        { model: Round, as: "equivalentRound" },
        { model: Category, as: "category" },
      ],
    });

    res.json({
      message: "Equivalent round updated successfully",
      equivalent: result,
    });
  } catch (error) {
    console.error("Update equivalent round error:", error);
    res.status(500).json({ error: "Failed to update equivalent round" });
  }
};

/**
 * Delete equivalent round rule (admin)
 */
exports.deleteEquivalentRound = async (req, res) => {
  try {
    const { id } = req.params;

    const equivalent = await EquivalentRound.findByPk(id);
    if (!equivalent) {
      return res.status(404).json({ error: "Equivalent round rule not found" });
    }

    await equivalent.destroy();

    res.json({ message: "Equivalent round rule deleted successfully" });
  } catch (error) {
    console.error("Delete equivalent round error:", error);
    res.status(500).json({ error: "Failed to delete equivalent round" });
  }
};

/**
 * Get eligible rounds for an archer based on their class/division
 */
exports.getEligibleRounds = async (req, res) => {
  try {
    const { archerId } = req.params;

    // Get archer with their class and default division
    const { Archer } = require("../models");
    const archer = await Archer.findByPk(archerId, {
      include: [
        { model: Class, as: "class" },
        { model: Division, as: "defaultDivision" }
      ],
    });

    if (!archer) {
      return res.status(404).json({ error: "Archer not found" });
    }

    if (!archer.ClassID) {
      return res.status(400).json({ 
        error: "Archer does not have a class assigned",
        message: "Please contact an administrator to assign a class to your profile"
      });
    }

    // Get all categories for this archer's class & default division
    const { Category } = require("../models");
    const categories = await Category.findAll({
      where: { ClassID: archer.ClassID, DivisionID: archer.DefaultDivisionID },
    });

    const categoryIds = categories.map((c) => c.CategoryID);

    if (categoryIds.length === 0) {
      return res.json({
        archer: {
          name: `${archer.FirstName} ${archer.LastName}`,
          class: archer.class?.Name || "N/A",
          division: archer.defaultDivision?.Name || "N/A",
        },
        eligibleRounds: [],
        message: "No categories found for your class",
      });
    }

    // Get all base rounds with their equivalent rounds for these categories
    const today = new Date();
    const equivalents = await EquivalentRound.findAll({
      where: {
        CategoryID: { [Op.in]: categoryIds },
        StartDate: { [Op.lte]: today },
        [Op.or]: [
          { EndDate: null },
          { EndDate: { [Op.gte]: today } },
        ],
      },
      include: [
        { 
          model: Round, 
          as: "baseRound",
          include: [{ model: RoundRange, as: "ranges" }],
        },
        { 
          model: Round, 
          as: "equivalentRound",
          include: [{ model: RoundRange, as: "ranges" }],
        },
        { model: Category, as: "category" },
      ],
    });

    // Group rounds by base round
    const roundsMap = new Map();

    equivalents.forEach((eq) => {
      const baseRoundId = eq.BaseRoundID;
      
      if (!roundsMap.has(baseRoundId)) {
        roundsMap.set(baseRoundId, {
          baseRound: eq.baseRound,
          equivalentRounds: [],
          categories: new Set(),
        });
      }

      const roundData = roundsMap.get(baseRoundId);
      roundData.equivalentRounds.push({
        ...eq.equivalentRound.toJSON(),
        category: eq.category.Name,
      });
      roundData.categories.add(eq.category.Name);
    });

    // Format response
    const eligibleRounds = Array.from(roundsMap.values()).map((data) => ({
      baseRound: data.baseRound,
      equivalentRounds: data.equivalentRounds,
      categories: Array.from(data.categories),
    }));

    res.json({
      archer: {
        name: `${archer.FirstName} ${archer.LastName}`,
        class: archer.class?.Name || "N/A",
        division: archer.defaultDivision?.Name || "N/A",
      },
      eligibleRounds,
      totalRounds: eligibleRounds.length,
    });
  } catch (error) {
    console.error("Get eligible rounds error:", error);
    res.status(500).json({ error: "Failed to fetch eligible rounds" });
  }
};
