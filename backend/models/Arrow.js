const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Arrow = sequelize.define(
  "Arrow",
  {
    ArrowID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    EndID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 10,
      },
      comment: "0=Miss, 1-10=Points",
    },
    ArrowOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Position within end (1-6)",
    },
  },
  {
    tableName: "Arrow",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["EndID", "ArrowOrder"],
      },
    ],
  }
);

module.exports = Arrow;
