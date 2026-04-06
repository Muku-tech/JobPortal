const { sequelize } = require("../config/database");
const User = require("./User");
const Job = require("./Job");
const Application = require("./Application");
const JobView = require("./JobView");
const Notification = require("./Notification");
const Resume = require("./Resume");

// Associations
require("./User").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
});
require("./Job").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
});
require("./Application").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
});
require("./JobView").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
});
require("./Notification").associate({
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
});
// require("./Resume").associate({
//   sequelize,
//   User,
//   Resume,
// });
// Resume.associate({ sequelize, User });

module.exports = {
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
  Resume,
};
