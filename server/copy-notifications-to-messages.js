const { sequelize } = require("./config/database");

async function copyData() {
  try {
    // Copy relevant notifications to messages
    const query = `
      INSERT INTO messages (sender_id, recipient_id, title, content, read, type, createdAt, updatedAt)
      SELECT 
        COALESCE(from_user_id, 1) as sender_id,
        user_id as recipient_id,
        title,
        message as content,
        read,
        'application_update' as type,
        createdAt,
        updatedAt
      FROM notifications 
      WHERE type IN ('application', 'interview', 'status_update')
    `;

    const result = await sequelize.query(query, { raw: true });
    console.log(
      `✅ Copied ${result[1]} notifications to messages (excluded saved jobs/system)`,
    );
  } catch (error) {
    console.error("❌ Failed to copy data:", error.message);
  }
}

copyData();
