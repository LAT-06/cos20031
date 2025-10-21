const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Class = sequelize.define(
  "Class",
  {
    ClassID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    AgeMin: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    AgeMax: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Gender: {
      type: DataTypes.ENUM("Male", "Female", "Both"),
      allowNull: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Class",
    timestamps: false,
  }
);

module.exports = Class;
