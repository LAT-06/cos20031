const sequelize = require("../config/database");

async function addClassRefToRound() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database\n");

    console.log("🔧 Checking Round table schema...");

    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('Round');

    if (tableDescription.ClassRefID) {
      console.log("✓ ClassRefID column already exists");
      console.log("   Type:", tableDescription.ClassRefID.type);
      console.log("   Nullable:", tableDescription.ClassRefID.allowNull);
      console.log("\n✅ Migration already completed!");
      process.exit(0);
    }

    console.log("📝 Adding ClassRefID column...");

    // Add column
    await queryInterface.addColumn('Round', 'ClassRefID', {
      type: sequelize.Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Class',
        key: 'ClassID'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    console.log("✓ Added ClassRefID column with foreign key constraint");

    // Verify the change
    const updatedDescription = await queryInterface.describeTable('Round');
    
    if (updatedDescription.ClassRefID) {
      console.log("\n📋 ClassRefID column details:");
      console.log("   Type:", updatedDescription.ClassRefID.type);
      console.log("   Nullable:", updatedDescription.ClassRefID.allowNull);
    }

    console.log("\n✅ Round table updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

addClassRefToRound();
