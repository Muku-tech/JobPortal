const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const JobView = sequelize.define(
  "JobView",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "jobs",
        key: "id",
      },
    },
    view_duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Duration in seconds",
    },
    action_type: {
      type: DataTypes.ENUM("view", "save", "share", "apply"),
      defaultValue: "view",
    },
  },
  {
    tableName: "job_views",
    timestamps: true,
    indexes: [
      {
        unique: false,
        fields: ["user_id", "job_id"],
      },
    ],
  },
);

module.exports = JobView;
