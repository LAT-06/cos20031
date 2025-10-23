const sequelize = require("../config/database");

async function addEquipmentColumn() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database");

    // Add EquipmentUsed column
    await sequelize.query(`
      ALTER TABLE ScoreRecord 
      ADD COLUMN IF NOT EXISTS EquipmentUsed VARCHAR(100) 
      COMMENT 'Equipment/Division used during shooting (for verification)'
    `);
    console.log("✓ Added EquipmentUsed column to ScoreRecord");

    console.log("\n✅ ScoreRecord table updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addEquipmentColumn();
