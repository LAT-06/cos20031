const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt");

const Archer = sequelize.define(
  "Archer",
  {
    ArcherID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    FirstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    LastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    DateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    Gender: {
      type: DataTypes.ENUM("Male", "Female"),
      allowNull: false,
    },
    Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    PasswordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    Role: {
      type: DataTypes.ENUM("admin", "recorder", "archer"),
      defaultValue: "archer",
    },
    DefaultDivisionID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ClassID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Archer",
    timestamps: false,
    hooks: {
      beforeCreate: async (archer) => {
        if (archer.PasswordHash) {
          const salt = await bcrypt.genSalt(10);
          archer.PasswordHash = await bcrypt.hash(archer.PasswordHash, salt);
        }
      },
      beforeUpdate: async (archer) => {
        if (archer.changed("PasswordHash")) {
          const salt = await bcrypt.genSalt(10);
          archer.PasswordHash = await bcrypt.hash(archer.PasswordHash, salt);
        }
      },
    },
  }
);

// Instance method to compare password
Archer.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.PasswordHash);
};

module.exports = Archer;
