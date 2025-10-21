const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ArcherUpdateRequest = sequelize.define(
  "ArcherUpdateRequest",
  {
    RequestID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ArcherID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Archer",
        key: "ArcherID",
      },
    },
    // Fields to update
    FirstName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    LastName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    DateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    Gender: {
      type: DataTypes.ENUM("Male", "Female"),
      allowNull: true,
    },
    DivisionID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    PasswordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Request status
    Status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      allowNull: false,
    },
    ReviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Archer",
        key: "ArcherID",
      },
    },
    ReviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    RejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "ArcherUpdateRequest",
    timestamps: false,
  }
);

module.exports = ArcherUpdateRequest;
