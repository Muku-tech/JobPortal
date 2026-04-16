const { sequelize } = require("./config/database");

async function dropTable() {
  try {
    await sequelize.getQueryInterface().dropTable("notifications");
    console.log("✅ Notifications table dropped successfully");
  } catch (error) {
    if (error.message.includes("table does not exist")) {
      console.log("ℹ️ Notifications table already dropped");
    } else {
      console.error("❌ Failed to drop table:", error.message);
    }
  }
}

dropTable();
