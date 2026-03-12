const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Application = sequelize.define(
  "Application",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "jobs",
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    cover_letter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "reviewed", "shortlisted", "interviewed", "hired", "rejected"),
      defaultValue: "pending",
    },
    employer_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "applications",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["job_id", "user_id"],
      },
    ],
  },
);

module.exports = Application;
