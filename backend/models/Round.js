const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Round = sequelize.define(
  "Round",
  {
    RoundID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    Description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Equipment: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Round",
    timestamps: false,
  }
);

module.exports = Round;
