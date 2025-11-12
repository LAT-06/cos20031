const sequelize = require("../config/database");

// Import all models
const Archer = require("./Archer");
const Class = require("./Class");
const Division = require("./Division");
const Category = require("./Category");
const Round = require("./Round");
const RoundRange = require("./RoundRange");
const EquivalentRound = require("./EquivalentRound");
const Competition = require("./Competition");
const ClubChampionship = require("./ClubChampionship");
const ChampionshipCompetition = require("./ChampionshipCompetition");
const ScoreRecord = require("./ScoreRecord");
const End = require("./End");
const Arrow = require("./Arrow");
const ArcherUpdateRequest = require("./ArcherUpdateRequest");

// Define associations

// Archer associations
Archer.belongsTo(Class, { foreignKey: "ClassID", as: "class" });
Archer.belongsTo(Division, {
  foreignKey: "DefaultDivisionID",
  as: "defaultDivision",
});
Class.hasMany(Archer, { foreignKey: "ClassID", as: "archers" });
Division.hasMany(Archer, { foreignKey: "DefaultDivisionID", as: "archers" });

// Category associations
Category.belongsTo(Class, { foreignKey: "ClassID", as: "class" });
Category.belongsTo(Division, { foreignKey: "DivisionID", as: "division" });
Class.hasMany(Category, { foreignKey: "ClassID", as: "categories" });
Division.hasMany(Category, { foreignKey: "DivisionID", as: "categories" });

// Round associations
Round.hasMany(RoundRange, {
  foreignKey: "RoundID",
  as: "ranges",
  onDelete: "CASCADE",
});
RoundRange.belongsTo(Round, { foreignKey: "RoundID", as: "round" });

// Round-Class relationship (for eligible rounds)
Round.belongsTo(Class, { foreignKey: "ClassRefID", as: "refClass" });
Class.hasMany(Round, { foreignKey: "ClassRefID", as: "eligibleRounds" });

// EquivalentRound associations
EquivalentRound.belongsTo(Round, {
  foreignKey: "BaseRoundID",
  as: "baseRound",
});
EquivalentRound.belongsTo(Round, {
  foreignKey: "EquivalentRoundID",
  as: "equivalentRound",
});
EquivalentRound.belongsTo(Category, {
  foreignKey: "CategoryID",
  as: "category",
});

// Championship and Competition associations (Many-to-Many)
ClubChampionship.belongsToMany(Competition, {
  through: ChampionshipCompetition,
  foreignKey: "ChampionshipID",
  otherKey: "CompetitionID",
  as: "competitions",
});

Competition.belongsToMany(ClubChampionship, {
  through: ChampionshipCompetition,
  foreignKey: "CompetitionID",
  otherKey: "ChampionshipID",
  as: "championships",
});

// Competition-Round relationship
Competition.belongsTo(Round, { foreignKey: "RoundID", as: "round" });
Round.hasMany(Competition, { foreignKey: "RoundID", as: "competitions" });

// ScoreRecord associations
ScoreRecord.belongsTo(Archer, { foreignKey: "ArcherID", as: "archer" });
ScoreRecord.belongsTo(Round, { foreignKey: "RoundID", as: "round" });
ScoreRecord.belongsTo(Division, { foreignKey: "DivisionID", as: "division" });
ScoreRecord.belongsTo(Competition, {
  foreignKey: "CompetitionID",
  as: "competition",
});
ScoreRecord.belongsTo(Archer, { foreignKey: "ApprovedBy", as: "approver" });

Archer.hasMany(ScoreRecord, { foreignKey: "ArcherID", as: "scoreRecords" });
Round.hasMany(ScoreRecord, { foreignKey: "RoundID", as: "scoreRecords" });
Division.hasMany(ScoreRecord, { foreignKey: "DivisionID", as: "scoreRecords" });
Competition.hasMany(ScoreRecord, {
  foreignKey: "CompetitionID",
  as: "scoreRecords",
});

// End associations
ScoreRecord.hasMany(End, {
  foreignKey: "ScoreRecordID",
  as: "ends",
  onDelete: "CASCADE",
});
End.belongsTo(ScoreRecord, { foreignKey: "ScoreRecordID", as: "scoreRecord" });
End.belongsTo(RoundRange, { foreignKey: "RoundRangeID", as: "roundRange" });
RoundRange.hasMany(End, { foreignKey: "RoundRangeID", as: "ends" });

// Arrow associations
End.hasMany(Arrow, { foreignKey: "EndID", as: "arrows", onDelete: "CASCADE" });
Arrow.belongsTo(End, { foreignKey: "EndID", as: "end" });

// ArcherUpdateRequest associations
ArcherUpdateRequest.belongsTo(Archer, {
  foreignKey: "ArcherID",
  as: "Archer",
});
ArcherUpdateRequest.belongsTo(Archer, {
  foreignKey: "ReviewedBy",
  as: "Reviewer",
});
Archer.hasMany(ArcherUpdateRequest, {
  foreignKey: "ArcherID",
  as: "updateRequests",
});

// Export all models and sequelize instance
module.exports = {
  sequelize,
  Archer,
  Class,
  Division,
  Category,
  Round,
  RoundRange,
  EquivalentRound,
  Competition,
  ClubChampionship,
  ChampionshipCompetition,
  ScoreRecord,
  End,
  Arrow,
  ArcherUpdateRequest,
};
