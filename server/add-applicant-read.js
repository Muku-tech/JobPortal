const { sequelize } = require("./config/database");

async function addApplicantRead() {
  try {
    console.log("🔧 Adding applicant_read column if missing...");

    // Check if column exists
    const [results] = await sequelize.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'applicant_read'`,
      { replacements: [sequelize.config.database] },
    );

    if (results[0].count === 0) {
      console.log("✅ Adding applicant_read BOOLEAN DEFAULT false");
      await sequelize.query(
        `ALTER TABLE messages ADD COLUMN applicant_read BOOLEAN DEFAULT false`,
      );
      console.log("✅ Column added");
    } else {
      console.log("ℹ️ applicant_read column already exists");
    }

    // Verify schema
    const [tableInfo] = await sequelize.query("DESCRIBE messages");
    console.log(
      "Messages table columns:",
      tableInfo.map((row) => row.Field).join(", "),
    );

    // Test query like controller
    const testMessages = await sequelize.query(
      "SELECT id, sender_id, recipient_id FROM messages LIMIT 1",
    );
    console.log("✅ Test query success. Sample:", testMessages[0]);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

addApplicantRead();
