const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "jobportal_nepal",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("✅ Database connected & synchronized");
  } catch (error) {
    console.error("❌ Unable to connect to database:", error.message);
    console.log(
      "Make sure MySQL is running and database 'jobportal_nepal' exists",
    );
  }
};

module.exports = { sequelize, connectDB };
