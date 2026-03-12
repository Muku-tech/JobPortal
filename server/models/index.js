const { sequelize } = require("../config/database");
const User = require("./User");
const Job = require("./Job");
const Application = require("./Application");
const JobView = require("./JobView");
const Notification = require("./Notification");

// User - Job associations (Employer posts jobs)
User.hasMany(Job, {
  foreignKey: "employer_id",
  as: "postedJobs",
  sourceKey: "id",
});
Job.belongsTo(User, {
  foreignKey: "employer_id",
  as: "employer",
  targetKey: "id",
});

// User - Application associations
User.hasMany(Application, {
  foreignKey: "user_id",
  as: "applications",
  sourceKey: "id",
});
Application.belongsTo(User, {
  foreignKey: "user_id",
  as: "applicant",
  targetKey: "id",
});

// Job - Application associations
Job.hasMany(Application, {
  foreignKey: "job_id",
  as: "applications",
  sourceKey: "id",
});
Application.belongsTo(Job, {
  foreignKey: "job_id",
  as: "job",
  targetKey: "id",
});

// User - JobView associations (for collaborative filtering)
User.hasMany(JobView, {
  foreignKey: "user_id",
  as: "jobViews",
  sourceKey: "id",
});
JobView.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
  targetKey: "id",
});

// Job - JobView associations
Job.hasMany(JobView, {
  foreignKey: "job_id",
  as: "views",
  sourceKey: "id",
});
JobView.belongsTo(Job, {
  foreignKey: "job_id",
  as: "job",
  targetKey: "id",
});

// Notifications associations
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = {
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
};
