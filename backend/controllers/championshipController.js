const {
  ClubChampionship,
  ChampionshipCompetition,
  Competition,
  ScoreRecord,
  Archer,
  Round,
  Division,
  Class,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

/**
 * Get all championships
 */
exports.getAllChampionships = async (req, res) => {
  try {
    const championships = await ClubChampionship.findAll({
      include: [
        {
          model: Competition,
          as: "competitions",
          through: { attributes: [] },
          include: [
            {
              model: Round,
              as: "round",
              attributes: ["RoundID", "Name", "Description"],
              include: [
                {
                  model: require("../models").RoundRange,
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
            },
          ],
        },
      ],
      order: [["Year", "DESC"]],
    });

    res.json({ championships });
  } catch (error) {
    console.error("Get championships error:", error);
    res.status(500).json({ error: "Failed to fetch championships" });
  }
};

/**
 * Get championship by ID with details
 */
exports.getChampionshipById = async (req, res) => {
  try {
    const { id } = req.params;

    const championship = await ClubChampionship.findByPk(id, {
      include: [
        {
          model: Competition,
          as: "competitions",
          through: { attributes: [] },
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
                  attributes: ["ArcherID", "FirstName", "LastName"],
                  include: [{ model: Class, as: "class" }],
                },
                {
                  model: Round,
                  as: "round",
                  attributes: ["RoundID", "Name", "Description"],
                  include: [
                    {
                      model: require("../models").RoundRange,
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
                },
                { model: Division, as: "division" },
              ],
            },
            // also include competition's configured round
            {
              model: Round,
              as: "round",
              attributes: ["RoundID", "Name", "Description"],
              include: [
                {
                  model: require("../models").RoundRange,
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
            },
          ],
        },
      ],
    });

    if (!championship) {
      return res.status(404).json({ error: "Championship not found" });
    }

    res.json({ championship });
  } catch (error) {
    console.error("Get championship error:", error);
    res.status(500).json({ error: "Failed to fetch championship" });
  }
};

/**
 * Create championship (admin)
 */
exports.createChampionship = async (req, res) => {
  try {
    const { name, year, startDate, endDate } = req.body;

    // Check if championship for year already exists
    const existing = await ClubChampionship.findOne({ where: { Year: year } });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Championship for this year already exists" });
    }

    const championship = await ClubChampionship.create({
      Name: name,
      Year: year,
      StartDate: startDate || null,
      EndDate: endDate || null,
    });

    res.status(201).json({
      message: "Championship created successfully",
      championship,
    });
  } catch (error) {
    console.error("Create championship error:", error);
    res.status(500).json({ error: "Failed to create championship" });
  }
};

/**
 * Update championship (admin)
 */
exports.updateChampionship = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, year, startDate, endDate, competitionIds } = req.body;

    const championship = await ClubChampionship.findByPk(id);

    if (!championship) {
      return res.status(404).json({ error: "Championship not found" });
    }

    if (name) championship.Name = name;
    if (year) championship.Year = year;
    if (startDate !== undefined) championship.StartDate = startDate;
    if (endDate !== undefined) championship.EndDate = endDate;

    await championship.save();

    // Update competitions association if provided
    if (competitionIds !== undefined && Array.isArray(competitionIds)) {
      const { ChampionshipCompetition } = require("../models");

      // Remove all existing associations
      await ChampionshipCompetition.destroy({
        where: { ChampionshipID: id },
      });

      // Add new associations
      if (competitionIds.length > 0) {
        const associations = competitionIds.map((competitionId) => ({
          ChampionshipID: id,
          CompetitionID: competitionId,
        }));
        await ChampionshipCompetition.bulkCreate(associations);
      }
    }

    // Fetch updated championship with competitions
    const updated = await ClubChampionship.findByPk(id, {
      include: [
        {
          model: Competition,
          as: "competitions",
          through: { attributes: [] },
        },
      ],
    });

    res.json({
      message: "Championship updated successfully",
      championship: updated,
    });
  } catch (error) {
    console.error("Update championship error:", error);
    res.status(500).json({ error: "Failed to update championship" });
  }
};

/**
 * Delete championship (admin)
 */
exports.deleteChampionship = async (req, res) => {
  try {
    const { id } = req.params;

    const championship = await ClubChampionship.findByPk(id);

    if (!championship) {
      return res.status(404).json({ error: "Championship not found" });
    }

    await championship.destroy();

    res.json({ message: "Championship deleted successfully" });
  } catch (error) {
    console.error("Delete championship error:", error);
    res.status(500).json({ error: "Failed to delete championship" });
  }
};

/**
 * Add competition to championship (admin)
 */
exports.addCompetitionToChampionship = async (req, res) => {
  try {
    const { id } = req.params;
    const { competitionId } = req.body;

    const championship = await ClubChampionship.findByPk(id);
    if (!championship) {
      return res.status(404).json({ error: "Championship not found" });
    }

    const competition = await Competition.findByPk(competitionId);
    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    // Check if already added
    const existing = await ChampionshipCompetition.findOne({
      where: {
        ChampionshipID: id,
        CompetitionID: competitionId,
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "Competition already in championship" });
    }

    await ChampionshipCompetition.create({
      ChampionshipID: id,
      CompetitionID: competitionId,
    });

    res.json({ message: "Competition added to championship successfully" });
  } catch (error) {
    console.error("Add competition error:", error);
    res
      .status(500)
      .json({ error: "Failed to add competition to championship" });
  }
};

/**
 * Remove competition from championship (admin)
 */
exports.removeCompetitionFromChampionship = async (req, res) => {
  try {
    const { id, competitionId } = req.params;

    const result = await ChampionshipCompetition.destroy({
      where: {
        ChampionshipID: id,
        CompetitionID: competitionId,
      },
    });

    if (result === 0) {
      return res.status(404).json({ error: "Association not found" });
    }

    res.json({ message: "Competition removed from championship successfully" });
  } catch (error) {
    console.error("Remove competition error:", error);
    res
      .status(500)
      .json({ error: "Failed to remove competition from championship" });
  }
};

/**
 * Get championship standings
 */
exports.getChampionshipStandings = async (req, res) => {
  try {
    const { id } = req.params;

    // Get all competitions in championship
    const championship = await ClubChampionship.findByPk(id, {
      include: [
        {
          model: Competition,
          as: "competitions",
          through: { attributes: [] },
        },
      ],
    });

    if (!championship) {
      return res.status(404).json({ error: "Championship not found" });
    }

    const competitionIds = championship.competitions.map(
      (c) => c.CompetitionID
    );

    // Get all scores from these competitions
    const scores = await ScoreRecord.findAll({
      where: {
        CompetitionID: { [Op.in]: competitionIds },
        Status: "approved",
      },
      include: [
        {
          model: Archer,
          as: "archer",
          attributes: ["ArcherID", "FirstName", "LastName"],
          include: [{ model: Class, as: "class" }],
        },
        { model: Division, as: "division" },
        { model: Competition, as: "competition" },
      ],
    });

    // Aggregate scores by archer and category
    const standings = {};

    scores.forEach((score) => {
      const categoryKey = `${score.archer.class?.Name || "Unknown"} - ${
        score.division.Name
      }`;
      const archerKey = score.ArcherID;

      if (!standings[categoryKey]) {
        standings[categoryKey] = {};
      }

      if (!standings[categoryKey][archerKey]) {
        standings[categoryKey][archerKey] = {
          archer: {
            id: score.archer.ArcherID,
            name: `${score.archer.FirstName} ${score.archer.LastName}`,
            class: score.archer.class?.Name,
          },
          division: score.division.Name,
          totalScore: 0,
          competitions: [],
        };
      }

      standings[categoryKey][archerKey].totalScore += score.TotalScore;
      standings[categoryKey][archerKey].competitions.push({
        name: score.competition.Name,
        score: score.TotalScore,
        date: score.DateShot,
      });
    });

    // Convert to array and sort
    const formattedStandings = {};
    Object.keys(standings).forEach((category) => {
      formattedStandings[category] = Object.values(standings[category])
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
        }));
    });

    res.json({
      championship,
      standings: formattedStandings,
    });
  } catch (error) {
    console.error("Get championship standings error:", error);
    res.status(500).json({ error: "Failed to fetch championship standings" });
  }
};

/**
 * Get championship winners (top 3 per division/class)
 */
exports.getChampionshipWinners = async (req, res) => {
  try {
    const { id } = req.params;

    // Get all competitions in championship
    const championship = await ClubChampionship.findByPk(id, {
      include: [
        {
          model: Competition,
          as: "competitions",
          through: { attributes: [] },
        },
      ],
    });

    if (!championship) {
      return res.status(404).json({ error: "Championship not found" });
    }

    const competitionIds = championship.competitions.map(
      (c) => c.CompetitionID
    );

    console.log(
      `Championship ${id} has ${competitionIds.length} competitions:`,
      competitionIds
    );

    // If no competitions linked, return empty winners
    if (competitionIds.length === 0) {
      return res.json({
        championship,
        winners: {},
        message: "No competitions linked to this championship",
      });
    }

    // Get all approved scores from these competitions
    const scores = await ScoreRecord.findAll({
      where: {
        CompetitionID: { [Op.in]: competitionIds },
        Status: "approved",
      },
      include: [
        {
          model: Archer,
          as: "archer",
          attributes: ["ArcherID", "FirstName", "LastName"],
          include: [{ model: Class, as: "class" }],
        },
        { model: Division, as: "division" },
      ],
    });

    console.log(`Found ${scores.length} approved scores in these competitions`);

    // Group by Class -> Division -> Archer
    const winners = {};

    scores.forEach((score) => {
      const className = score.archer.class?.Name || "No Class";
      const divisionName = score.division?.Name || "No Division";
      const archerKey = score.ArcherID;

      // Initialize structure
      if (!winners[className]) {
        winners[className] = {};
      }
      if (!winners[className][divisionName]) {
        winners[className][divisionName] = {};
      }
      if (!winners[className][divisionName][archerKey]) {
        winners[className][divisionName][archerKey] = {
          ArcherID: score.ArcherID,
          FirstName: score.archer.FirstName,
          LastName: score.archer.LastName,
          TotalScore: 0,
          CompetitionCount: 0,
        };
      }

      // Aggregate scores
      winners[className][divisionName][archerKey].TotalScore +=
        score.TotalScore;
      winners[className][divisionName][archerKey].CompetitionCount += 1;
    });

    // Format and sort: top 3 per division
    const formattedWinners = {};
    Object.keys(winners).forEach((className) => {
      formattedWinners[className] = {};
      Object.keys(winners[className]).forEach((divisionName) => {
        formattedWinners[className][divisionName] = Object.values(
          winners[className][divisionName]
        )
          .map((archer) => ({
            ...archer,
            archerName: `${archer.FirstName} ${archer.LastName}`,
            totalScore: archer.TotalScore,
            competitionCount: archer.CompetitionCount,
          }))
          .sort((a, b) => b.TotalScore - a.TotalScore)
          .slice(0, 3); // Top 3 only
      });
    });

    res.json({
      championship,
      winners: formattedWinners,
    });
  } catch (error) {
    console.error("Get championship winners error:", error);
    res.status(500).json({ error: "Failed to fetch championship winners" });
  }
};
