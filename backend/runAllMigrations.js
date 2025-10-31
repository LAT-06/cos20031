const { execSync } = require("child_process");

console.log("🚀 Running all database migrations...\n");

const migrations = [
  "migrations/updateCompetition.js",
  "migrations/addEquipmentToScoreRecord.js",
];

for (const migration of migrations) {
  try {
    console.log(`\n📦 Running: ${migration}`);
    console.log("─".repeat(50));
    execSync(`node ${migration}`, { stdio: "inherit" });
  } catch (error) {
    console.error(`\n❌ Failed to run ${migration}`);
    console.error(error.message);
    process.exit(1);
  }
}

console.log("\n\n✅ All migrations completed successfully!");
console.log("\n⚠️  IMPORTANT: Please restart your backend server now!\n");
