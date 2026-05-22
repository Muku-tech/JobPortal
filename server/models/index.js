const { sequelize } = require("../config/database");
const User = require("./User");
const Job = require("./Job");
const Application = require("./Application");
const JobView = require("./JobView");
const Notification = require("./Notification");
const Message = require("./Message");
const Resume = require("./Resume");

const models = {
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
  Message,
  Resume,
};

Object.keys(models).forEach((modelName) => {
  if (models[modelName] && typeof models[modelName].associate === "function") {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  User,
  Job,
  Application,
  JobView,
  Notification,
  Message,
  Resume,
};
