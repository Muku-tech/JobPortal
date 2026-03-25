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
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    view_duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    action_type: {
      type: DataTypes.STRING,
      defaultValue: "view",
    },
  },
  {
    tableName: "job_views",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "job_id"],
      },
    ],
  },
);

JobView.associate = (models) => {
  JobView.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
  JobView.belongsTo(models.Job, { foreignKey: "job_id", as: "job" });
};

module.exports = JobView;
