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
        min: 5,
        max: 6,
      },
    },
    TargetFace: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "e.g., 80cm, 122cm",
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
