const { ClubChampionship, Competition, ChampionshipCompetition, ScoreRecord } = require("./models");
const sequelize = require("./config/database");

async function checkChampionshipData() {
  try {
    await sequelize.authenticate();
    console.log("✓ Connected to database\n");

    // Get all championships
    const championships = await ClubChampionship.findAll({
      include: [
        {
          model: Competition,
          as: "competitions",
          through: { attributes: [] },
        },
      ],
    });

    console.log(`Found ${championships.length} championship(s)\n`);

    for (const champ of championships) {
      console.log("━".repeat(60));
      console.log(`🏆 ${champ.Name} (${champ.Year})`);
      console.log(`   ID: ${champ.ChampionshipID}`);
      console.log(`   Competitions: ${champ.competitions.length}`);

      if (champ.competitions.length > 0) {
        const competitionIds = champ.competitions.map(c => c.CompetitionID);
        console.log(`   Competition IDs: ${competitionIds.join(", ")}`);

        // Check scores for these competitions
        const scores = await ScoreRecord.count({
          where: {
            CompetitionID: competitionIds,
          },
        });

        const approvedScores = await ScoreRecord.count({
          where: {
            CompetitionID: competitionIds,
            Status: "approved",
          },
        });

        console.log(`   Total Scores: ${scores}`);
        console.log(`   Approved Scores: ${approvedScores}`);
        
        if (approvedScores === 0) {
          console.log("   ⚠️  No approved scores - winners will be empty!");
        } else {
          console.log("   ✓ Has approved scores - should show winners");
        }
      } else {
        console.log("   ⚠️  No competitions linked - winners will be empty!");
      }
      console.log("");
    }

    console.log("━".repeat(60));
    console.log("\n💡 To fix:");
    console.log("1. Link competitions to championship (Edit → Select competitions)");
    console.log("2. Make sure scores exist for those competitions");
    console.log("3. Approve the scores (Scores Management → Approve)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkChampionshipData();
