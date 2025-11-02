const { Sequelize } = require("sequelize");

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("Starting schema fixes for Round-related tables...");

      // Check what columns already exist
      const roundRangeDesc = await queryInterface.describeTable("RoundRange", { transaction });
      const endDesc = await queryInterface.describeTable("End", { transaction });
      const arrowDesc = await queryInterface.describeTable("Arrow", { transaction });

      console.log("\nCurrent RoundRange columns:", Object.keys(roundRangeDesc).join(", "));
      console.log("Current End columns:", Object.keys(endDesc).join(", "));
      console.log("Current Arrow columns:", Object.keys(arrowDesc).join(", "));
      console.log("");

      // 1. Add ScoringType to RoundRange table if not exists
      if (!roundRangeDesc.ScoringType) {
        console.log("1. Adding ScoringType to RoundRange...");
        await queryInterface.addColumn(
          "RoundRange",
          "ScoringType",
          {
            type: Sequelize.ENUM("10-zone", "5-zone", "X-ring", "Imperial"),
            allowNull: false,
            defaultValue: "10-zone",
          },
          { transaction }
        );
      } else {
        console.log("1. ScoringType already exists in RoundRange ✓");
      }

      // 2. Add ArrowsPerEnd to RoundRange table if not exists
      if (!roundRangeDesc.ArrowsPerEnd) {
        console.log("2. Adding ArrowsPerEnd to RoundRange...");
        await queryInterface.addColumn(
          "RoundRange",
          "ArrowsPerEnd",
          {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 6,
          },
          { transaction }
        );
      } else {
        console.log("2. ArrowsPerEnd already exists in RoundRange ✓");
      }

      // 3. Add RoundRangeID to End table if not exists
      if (!endDesc.RoundRangeID) {
        console.log("3. Adding RoundRangeID to End table...");
        await queryInterface.addColumn(
          "End",
          "RoundRangeID",
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: "RoundRange",
              key: "RoundRangeID",
            },
            onDelete: "CASCADE",
          },
          { transaction }
        );
      } else {
        console.log("3. RoundRangeID already exists in End ✓");
      }

      // 4. Add ArrowOrder to Arrow table if not exists
      if (!arrowDesc.ArrowOrder) {
        console.log("4. Adding ArrowOrder to Arrow table...");
        await queryInterface.addColumn(
          "Arrow",
          "ArrowOrder",
          {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          { transaction }
        );

        // Update existing arrows with sequential order
        console.log("   Updating existing arrows with order...");
        await queryInterface.sequelize.query(
          `UPDATE Arrow a
           SET ArrowOrder = (
             SELECT COUNT(*) 
             FROM Arrow a2 
             WHERE a2.EndID = a.EndID 
             AND a2.ArrowID <= a.ArrowID
           )
           WHERE ArrowOrder IS NULL`,
          { transaction }
        );

        // Make it NOT NULL
        await queryInterface.changeColumn(
          "Arrow",
          "ArrowOrder",
          {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          { transaction }
        );
      } else {
        console.log("4. ArrowOrder already exists in Arrow ✓");
      }

      await transaction.commit();
      console.log("✓ Schema fixes completed successfully!");
    } catch (error) {
      await transaction.rollback();
      console.error("✗ Migration failed:", error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("Reverting schema fixes...");

      // Remove RoundRangeID from End
      await queryInterface.removeColumn("End", "RoundRangeID", { transaction });

      // Remove ArrowsPerEnd from RoundRange
      await queryInterface.removeColumn("RoundRange", "ArrowsPerEnd", {
        transaction,
      });

      // Remove ScoringType from RoundRange
      await queryInterface.removeColumn("RoundRange", "ScoringType", {
        transaction,
      });

      // Check and remove ArrowOrder if needed
      try {
        const tableDesc = await queryInterface.describeTable("Arrow", { transaction });
        if (tableDesc.ArrowOrder) {
          await queryInterface.removeColumn("Arrow", "ArrowOrder", {
            transaction,
          });
        }
      } catch (err) {
        console.log("   Error checking ArrowOrder during rollback, skipping:", err.message);
      }

      await transaction.commit();
      console.log("✓ Rollback completed!");
    } catch (error) {
      await transaction.rollback();
      console.error("✗ Rollback failed:", error);
      throw error;
    }
  },
};
