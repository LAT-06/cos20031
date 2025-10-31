const sequelize = require("../config/database");

async function updateCompetitionStatus() {
  console.log("🔄 Updating Competition Status ENUM...\n");

  try {
    await sequelize.authenticate();
    console.log("✓ Connected to database\n");

    // Update Status ENUM to include 'ongoing' and 'cancelled'
    console.log("📝 Modifying Status column...");
    await sequelize.query(`
      ALTER TABLE Competition 
      MODIFY COLUMN Status ENUM('upcoming', 'active', 'ongoing', 'completed', 'cancelled') 
      DEFAULT 'upcoming' 
      NOT NULL
    `);
    console.log("✅ Status column updated successfully\n");

    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

updateCompetitionStatus();
