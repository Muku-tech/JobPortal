const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SavedJob = sequelize.define(
  "SavedJob",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "jobs", key: "id" },
    },
  },
  {
    tableName: "saved_jobs",
    timestamps: true,
    indexes: [{ unique: true, fields: ["user_id", "job_id"] }],
  }
);

SavedJob.associate = (models) => {
  SavedJob.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
  SavedJob.belongsTo(models.Job, { foreignKey: "job_id", as: "job" });
};

module.exports = SavedJob;
