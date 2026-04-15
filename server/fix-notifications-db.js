const { sequelize } = require("./config/database");

async function fixNotificationsTable() {
  try {
    await sequelize.query(`
      ALTER TABLE \`notifications\` 
      ADD COLUMN \`from_user_id\` INT NULL AFTER \`type\`
    `);
    console.log("✅ Added from_user_id column to notifications table");

    // Add index
    await sequelize.query(`
      ALTER TABLE \`notifications\` 
      ADD INDEX \`idx_notifications_from_user_id\` (\`from_user_id\`)
    `);
    console.log("✅ Added index on from_user_id");
  } catch (error) {
    if (error.message.includes("Duplicate column")) {
      console.log("ℹ️ Column already exists");
    } else {
      console.error("Error adding column:", error.message);
    }
  } finally {
    await sequelize.close();
  }
}

fixNotificationsTable();
