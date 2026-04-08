require("dotenv").config();
const { sequelize } = require("./config/database");

async function resetDB() {
  try {
    console.log("🔄 Dropping and recreating tables...");
    await sequelize.drop();
    await sequelize.sync({ force: true });
    console.log("✅ Database reset complete - clean slate!");
    console.log("Now run: node database/seed.js && npm start");

