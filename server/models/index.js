const { sequelize } = require("../config/database");
const User = require("./User");
const Job = require("./Job");
const Application = require("./Application");
const JobView = require("./JobView");
const Notification = require("./Notification");
const UserSavedJob = require("./UserSavedJob");

// Associations
require("./User").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
  UserSavedJob,
});
require("./Job").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
  UserSavedJob,
});
require("./Application").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
  UserSavedJob,
});
require("./JobView").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
  UserSavedJob,
});
require("./Notification").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
  UserSavedJob,
});
require("./UserSavedJob").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
  UserSavedJob,
});

module.exports = {
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
  UserSavedJob,
};
