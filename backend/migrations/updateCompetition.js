const sequelize = require("../config/database");

async function updateCompetitionTable() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database");

    // Add RoundID column
    await sequelize.query(`
      ALTER TABLE Competition 
      ADD COLUMN IF NOT EXISTS RoundID INT
    `);
    console.log("✓ Added RoundID column");

    // Add Status column
    await sequelize.query(`
      ALTER TABLE Competition 
      ADD COLUMN IF NOT EXISTS Status ENUM('upcoming', 'active', 'completed') 
      DEFAULT 'upcoming' NOT NULL
    `);
    console.log("✓ Added Status column");

    // Add StartDate column
    await sequelize.query(`
      ALTER TABLE Competition 
      ADD COLUMN IF NOT EXISTS StartDate DATE
    `);
    console.log("✓ Added StartDate column");

    // Add EndDate column
    await sequelize.query(`
      ALTER TABLE Competition 
      ADD COLUMN IF NOT EXISTS EndDate DATE
    `);
    console.log("✓ Added EndDate column");

    // Update existing records - copy Date to StartDate if null
    await sequelize.query(`
      UPDATE Competition 
      SET StartDate = Date 
      WHERE StartDate IS NULL
    `);
    console.log("✓ Updated existing records with StartDate = Date");

    console.log("\n✅ Competition table updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

updateCompetitionTable();
