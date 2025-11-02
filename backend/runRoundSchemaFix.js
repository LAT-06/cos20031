const sequelize = require("./config/database");
const migration = require("./migrations/fixRoundTablesSchema");

async function runMigration() {
  try {
    console.log("🔧 Running schema fixes for Round tables...\n");

    await sequelize.authenticate();
    console.log("✓ Database connected\n");

    // Run the migration
    await migration.up(sequelize.getQueryInterface());

    console.log("\n✅ Migration completed successfully!");
    console.log("\nChanges made:");
    console.log("1. ✓ Added ScoringType to RoundRange (10-zone, 5-zone, X-ring, Imperial)");
    console.log("2. ✓ Added ArrowsPerEnd to RoundRange (default: 6)");
    console.log("3. ✓ Added RoundRangeID to End table");
    console.log("4. ✓ Verified/Added ArrowOrder to Arrow table");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

runMigration();
