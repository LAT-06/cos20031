const sequelize = require("./config/database");

async function updateStatusEnum() {
  try {
    console.log("Updating ScoreRecord Status ENUM...");

    // Drop the old ENUM and create new one
    await sequelize.query(`
      ALTER TABLE ScoreRecord 
      MODIFY COLUMN Status ENUM('staged', 'pending', 'approved', 'rejected') 
      DEFAULT 'staged'
    `);

    console.log("✓ Status ENUM updated successfully!");
    console.log('Added "pending" to allowed status values');

    process.exit(0);
  } catch (error) {
    console.error("Error updating Status ENUM:", error);
    process.exit(1);
  }
}

updateStatusEnum();
