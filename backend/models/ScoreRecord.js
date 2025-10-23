const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ScoreRecord = sequelize.define(
  "ScoreRecord",
  {
    ScoreRecordID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ArcherID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    RoundID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    DivisionID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    EquipmentUsed: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Equipment/Division used during shooting (for verification)",
    },
    CompetitionID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    DateShot: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    Status: {
      type: DataTypes.ENUM("staged", "pending", "approved", "rejected"),
      defaultValue: "staged",
    },
    TotalScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    TotalHits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    ApprovedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ApprovedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "ScoreRecord",
    timestamps: false,
    indexes: [
      {
        fields: ["ArcherID", "DateShot"],
      },
      {
        fields: ["CompetitionID"],
      },
    ],
  }
);

module.exports = ScoreRecord;
