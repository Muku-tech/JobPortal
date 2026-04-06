const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UserSavedJob = sequelize.define(
  "UserSavedJob",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    tableName: "user_saved_jobs",
    timestamps: true,
  },
);

UserSavedJob.associate = (models) => {
  UserSavedJob.belongsTo(models.User, { foreignKey: "user_id" });
  UserSavedJob.belongsTo(models.Job, { foreignKey: "job_id", as: "Job" });
};

module.exports = UserSavedJob;
