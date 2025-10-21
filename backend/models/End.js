const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const End = sequelize.define(
  "End",
  {
    EndID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ScoreRecordID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    EndNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TotalScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "End",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["ScoreRecordID", "EndNumber"],
      },
    ],
  }
);

module.exports = End;
