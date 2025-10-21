const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Category = sequelize.define(
  "Category",
  {
    CategoryID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ClassID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    DivisionID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Category",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["ClassID", "DivisionID"],
      },
    ],
  }
);

module.exports = Category;
