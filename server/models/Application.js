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
      type: DataTypes.ENUM("applied", "considering", "final"),
      defaultValue: "applied",
    },
    is_shortlisted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    interview_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    decision: {
      type: DataTypes.ENUM("hired", "rejected"),
      allowNull: true,
    },
    employer_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resume_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "resumes",
        key: "id",
      },
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

Application.associate = (models) => {
  Application.belongsTo(models.Job, {
    foreignKey: "job_id",
    as: "job",
  });
  Application.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "applicant",
  });
  Application.belongsTo(models.Resume, {
    foreignKey: "resume_id",
    as: "resume",
  });
};

module.exports = Application;
