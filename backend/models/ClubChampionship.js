const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ClubChampionship = sequelize.define(
  "ClubChampionship",
  {
    ChampionshipID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    Year: {
      type: DataTypes.INTEGER,
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
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "ClubChampionship",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["Year"],
      },
    ],
  }
);

module.exports = ClubChampionship;
