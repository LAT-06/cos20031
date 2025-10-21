/**
 * Sync new models to database
 * Run this after adding new models
 */

const { sequelize } = require("../models");
const ArcherUpdateRequest = require("../models/ArcherUpdateRequest")(
  sequelize,
  require("sequelize").DataTypes
);

async function syncNewModels() {
  try {
    console.log("Syncing new models to database...");

    // Force sync only ArcherUpdateRequest table (creates if not exists)
    await ArcherUpdateRequest.sync({ alter: true });

    console.log("✓ ArcherUpdateRequest table synced successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error syncing models:", error);
    process.exit(1);
  }
}

syncNewModels();
