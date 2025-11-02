const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RoundRange = sequelize.define(
  "RoundRange",
  {
    RoundRangeID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    RoundID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    RangeNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Sequence number of this range in the round",
    },
    Distance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Distance in meters",
    },
    Ends: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 50,
      },
      comment: "Number of ends in this range",
    },
    TargetFace: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "e.g., 80cm, 122cm",
    },
    ScoringType: {
      type: DataTypes.ENUM("10-zone", "5-zone", "X-ring", "Imperial"),
      allowNull: false,
      defaultValue: "10-zone",
      comment: "Scoring system for this range",
    },
    ArrowsPerEnd: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 6,
      validate: {
        min: 1,
        max: 12,
      },
      comment: "Number of arrows per end",
    },
  },
  {
    tableName: "RoundRange",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["RoundID", "RangeNo"],
      },
    ],
  }
);

module.exports = RoundRange;
