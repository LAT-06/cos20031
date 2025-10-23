const {
  Competition,
  ClubChampionship,
  ChampionshipCompetition,
  ScoreRecord,
  Archer,
  Round,
  Division,
  Class,
  Category,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

/**
 * Get all competitions
 */
exports.getAllCompetitions = async (req, res) => {
  try {
    const { year, search, limit = 50, offset = 0 } = req.query;

    const where = {};

    if (year) {
      where.Date = {
        [Op.between]: [`${year}-01-01`, `${year}-12-31`],
      };
    }

    if (search) {
      where.Name = { [Op.like]: `%${search}%` };
    }

    const competitions = await Competition.findAll({
      where,
      include: [
        {
          model: Round,
          as: "round",
          attributes: ["RoundID", "Name"],
        },
      ],
      order: [["Date", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({ competitions });
  } catch (error) {
    console.error("Get competitions error:", error);
    res.status(500).json({ error: "Failed to fetch competitions" });
  }
};

/**
 * Get competition by ID with results
 */
exports.getCompetitionById = async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findByPk(id, {
      include: [
        {
          model: ScoreRecord,
          as: "scoreRecords",
          where: { Status: "approved" },
          required: false,
          include: [
            {
              model: Archer,
              as: "archer",
              attributes: ["ArcherID", "FirstName", "LastName", "ClassID"],
              include: [{ model: Class, as: "class" }],
            },
            { model: Round, as: "round" },
            { model: Division, as: "division" },
          ],
        },
      ],
    });

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    res.json({ competition });
  } catch (error) {
    console.error("Get competition error:", error);
    res.status(500).json({ error: "Failed to fetch competition" });
  }
};

/**
 * Create competition (admin/recorder)
 */
exports.createCompetition = async (req, res) => {
  try {
    const { name, roundId, date, startDate, endDate, location, description, status } = req.body;

    const competition = await Competition.create({
      Name: name,
      RoundID: roundId || null,
      Date: date,
      StartDate: startDate || date,
      EndDate: endDate || date,
      Location: location || null,
      Description: description || null,
      Status: status || "upcoming",
    });

    res.status(201).json({
      message: "Competition created successfully",
      competition,
    });
  } catch (error) {
    console.error("Create competition error:", error);
    res.status(500).json({ error: "Failed to create competition" });
  }
};

/**
 * Update competition (admin/recorder)
 */
exports.updateCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, roundId, date, startDate, endDate, location, description, status } = req.body;

    const competition = await Competition.findByPk(id);

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    if (name) competition.Name = name;
    if (roundId !== undefined) competition.RoundID = roundId;
    if (date) competition.Date = date;
    if (startDate !== undefined) competition.StartDate = startDate;
    if (endDate !== undefined) competition.EndDate = endDate;
    if (location !== undefined) competition.Location = location;
    if (description !== undefined) competition.Description = description;
    if (status) competition.Status = status;

    await competition.save();

    res.json({
      message: "Competition updated successfully",
      competition,
    });
  } catch (error) {
    console.error("Update competition error:", error);
    res.status(500).json({ error: "Failed to update competition" });
  }
};

/**
 * Delete competition (admin)
 */
exports.deleteCompetition = async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findByPk(id);

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    await competition.destroy();

    res.json({ message: "Competition deleted successfully" });
  } catch (error) {
    console.error("Delete competition error:", error);
    res.status(500).json({ error: "Failed to delete competition" });
  }
};

/**
 * Get competition leaderboard by category
 */
exports.getCompetitionLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, divisionId, classId } = req.query;

    const where = {
      CompetitionID: id,
      Status: "approved",
    };

    if (divisionId) where.DivisionID = divisionId;

    const scores = await ScoreRecord.findAll({
      where,
      include: [
        {
          model: Archer,
          as: "archer",
          attributes: ["ArcherID", "FirstName", "LastName", "ClassID"],
          include: [{ model: Class, as: "class" }],
          where: classId ? { ClassID: classId } : {},
        },
        { model: Round, as: "round" },
        { model: Division, as: "division" },
      ],
      order: [["TotalScore", "DESC"]],
    });

    // Group by category if needed
    const leaderboard = scores.reduce((acc, score) => {
      const categoryKey = `${score.archer.class?.Name || "Unknown"} - ${
        score.division.Name
      }`;

      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }

      acc[categoryKey].push({
        rank: acc[categoryKey].length + 1,
        archer: {
          id: score.archer.ArcherID,
          name: `${score.archer.FirstName} ${score.archer.LastName}`,
          class: score.archer.class?.Name,
        },
        division: score.division.Name,
        round: score.round.Name,
        score: score.TotalScore,
        date: score.DateShot,
      });

      return acc;
    }, {});

    res.json({ leaderboard });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};
