const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EquivalentRound = sequelize.define(
  "EquivalentRound",
  {
    EquivalentID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    BaseRoundID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    EquivalentRoundID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    CategoryID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    StartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    EndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "EquivalentRound",
    timestamps: false,
    validate: {
      baseNotEquivalent() {
        if (this.BaseRoundID === this.EquivalentRoundID) {
          throw new Error(
            "BaseRoundID and EquivalentRoundID cannot be the same"
          );
        }
      },
    },
  }
);

module.exports = EquivalentRound;
