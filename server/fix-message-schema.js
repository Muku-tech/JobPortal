const { sequelize } = require("./config/database");

async function fixMessageSchema() {
  try {
    console.log("🔄 Checking messages table schema...");

    // Check if column allows NULL
    const [results] = await sequelize.query(
      `
      SELECT COLUMN_NAME, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'messages' 
      AND COLUMN_NAME = 'application_id'
    `,
      { replacements: [sequelize.config.database] },
    );

    if (results.length > 0 && results[0].IS_NULLABLE === "NO") {
      console.log("✅ Making application_id nullable...");
      await sequelize.query(`
        ALTER TABLE messages 
        MODIFY COLUMN application_id INT NULL,
        ADD CONSTRAINT fk_message_application 
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
      `);
      console.log("✅ application_id now nullable with proper FK");
    } else {
      console.log("ℹ️ application_id already nullable");
    }

    // Test insert direct message (no application)
    await sequelize.query(`
      INSERT IGNORE INTO messages (sender_id, recipient_id, message, type, read) 
      VALUES (1, 1, 'Test direct message', 'user', false)
    `);
    console.log("✅ Test direct message inserted");

    const count = await sequelize.query(
      "SELECT COUNT(*) as unread FROM messages WHERE recipient_id = 1 AND read = false",
    );
    console.log(`📊 Unread count for user 1: ${count[0][0].unread}`);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await sequelize.close();
  }
}

fixMessageSchema();
