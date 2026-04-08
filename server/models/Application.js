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
      type: DataTypes.STRING(50),
      defaultValue: "applied",
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

Application.associate = (models) => {
  Application.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "applicant",
  });
  Application.belongsTo(models.Job, { foreignKey: "job_id", as: "job" });
};

module.exports = Application;
