const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Division = sequelize.define(
  "Division",
  {
    DivisionID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    Description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Division",
    timestamps: false,
  }
);

module.exports = Division;
