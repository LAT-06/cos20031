const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChampionshipCompetition = sequelize.define(
  "ChampionshipCompetition",
  {
    ChampionshipID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    CompetitionID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    tableName: "ChampionshipCompetition",
    timestamps: false,
  }
);

module.exports = ChampionshipCompetition;
