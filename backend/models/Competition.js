const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Competition = sequelize.define(
  "Competition",
  {
    CompetitionID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    RoundID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    StartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    EndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    Location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    Description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Status: {
      type: DataTypes.ENUM(
        "upcoming",
        "active",
        "ongoing",
        "completed",
        "cancelled"
      ),
      defaultValue: "upcoming",
      allowNull: false,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Competition",
    timestamps: false,
  }
);

module.exports = Competition;
