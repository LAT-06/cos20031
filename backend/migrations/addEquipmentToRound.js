const sequelize = require("../config/database");

async function addEquipmentToRound() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database");

    await sequelize.query(`
      ALTER TABLE Round
      ADD COLUMN IF NOT EXISTS Equipment VARCHAR(100)
      COMMENT 'Equipment required for the round'
    `);
    console.log("✓ Added Equipment column to Round");

    console.log("\n✅ Round table updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addEquipmentToRound();
