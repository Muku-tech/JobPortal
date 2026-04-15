const { sequelize } = require("./config/database");

async function fixNotificationsEnum() {
  try {
    await sequelize.query(`
      ALTER TABLE \`notifications\` 
      MODIFY COLUMN \`type\` ENUM(
        'application', 'interview', 'status_update', 'job_posted', 'system', 
        'message', 'message_sent'
      ) DEFAULT 'system'
    `);
    console.log("✅ Updated notifications.type ENUM to include message types");
  } catch (error) {
    if (error.message.includes("Duplicate")) {
      console.log("ℹ️ ENUM already updated");
    } else {
      console.error("Error updating ENUM:", error.message);
    }
  } finally {
    await sequelize.close();
  }
}

fixNotificationsEnum();
